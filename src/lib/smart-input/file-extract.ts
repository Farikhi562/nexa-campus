import 'server-only'

export type FileExtractResult = { text: string } | { error: string }

const MAX_EXTRACTED_CHARS = 8000

/**
 * Ekstrak teks dari file PDF/DOCX. Sengaja simpel (sesuai brief): tidak ada OCR
 * untuk PDF hasil scan (gambar) — kalau hasil ekstraksi kosong, kembalikan
 * error yang ramah supaya UI bisa arahkan user ke tab Upload Gambar (vision AI)
 * atau Manual.
 *
 * Dependency: `pdfjs-dist` (PDF, build legacy Node) dan `mammoth` (DOCX).
 *
 * CATATAN PENTING soal pilihan library PDF:
 * Brief awal menyebut `pdf-parse`, tapi paket itu TERNYATA tidak dipakai di sini
 * — diuji langsung dengan PDF asli (tulisan tangan reportlab) dan ditemukan
 * tidak reliable: bundling pdf.js versi sangat lama (v1.10.100, ~2017) dengan
 * module-level state (`var PDFJS = null` di-cache lintas pemanggilan). Pada
 * pengujian terjadi kasus konkret: parsing PDF kosong segera setelah PDF berisi
 * teks mengembalikan teks dari PDF SEBELUMNYA (kemungkinan race condition di
 * pipeline async pdf.js lama itu saat worker dimatikan). Risiko ini terlalu
 * serius untuk app yang menyimpan data tugas mahasiswa — di Vercel serverless
 * dengan "warm" reuse, ini secara teori bisa membocorkan isi PDF user A ke hasil
 * ekstraksi user B kalau function instance dipakai ulang berurutan.
 * Sebagai gantinya dipakai `pdfjs-dist` (pdf.js resmi, aktif di-maintain
 * Mozilla) lewat build `legacy/build/pdf.mjs` yang didesain untuk Node tanpa
 * DOM/canvas. Sudah diuji ulang dengan pemanggilan berurutan & interleaved
 * (PDF berisi teks vs PDF kosong, bergantian beberapa kali) — hasilnya selalu
 * benar & konsisten, tidak ada kebocoran data antar pemanggilan.
 */
export async function extractTextFromFile(base64: string, mimeType: string, filename?: string): Promise<FileExtractResult> {
  const buffer = Buffer.from(base64, 'base64')

  if (mimeType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf')) {
    let loadingTask: { promise: Promise<unknown>; destroy: () => Promise<void> } | null = null
    try {
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')
      loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(buffer),
        useWorkerFetch: false,
        useSystemFonts: true,
      }) as unknown as { promise: Promise<unknown>; destroy: () => Promise<void> }

      type PdfPage = { getTextContent: () => Promise<{ items: Array<{ str?: string }> }>; cleanup: () => void }
      type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPage> }
      const doc = (await loadingTask.promise) as PdfDoc

      let text = ''
      for (let i = 1; i <= doc.numPages; i++) {
        const page = await doc.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map((item) => item.str ?? '').join(' ')
        text += (text ? '\n' : '') + pageText
        page.cleanup()
      }

      const trimmed = text.trim()
      if (!trimmed) {
        return { error: 'PDF ini sepertinya hasil scan/gambar (tidak ada teks terbaca). Coba upload sebagai foto di tab "Upload Gambar".' }
      }
      return { text: trimmed.slice(0, MAX_EXTRACTED_CHARS) }
    } catch (err) {
      console.error('[smart-input] gagal parse PDF:', err)
      return { error: 'Gagal membaca file PDF ini. Pastikan file tidak corrupt/terkunci.' }
    } finally {
      // WAJIB: selalu destroy loading task, baik sukses maupun gagal — kalau
      // tidak, resource pdf.js (dan kemungkinan state internal) bisa menumpuk
      // antar request di server yang sama (warm serverless reuse).
      if (loadingTask) {
        await loadingTask.destroy().catch(() => null)
      }
    }
  }

  const isDocx =
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    filename?.toLowerCase().endsWith('.docx')

  if (isDocx) {
    try {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      const text = (result.value || '').trim()
      if (!text) return { error: 'Tidak ada teks yang terbaca dari file Word ini.' }
      return { text: text.slice(0, MAX_EXTRACTED_CHARS) }
    } catch (err) {
      console.error('[smart-input] gagal parse DOCX:', err)
      return { error: 'Gagal membaca file Word (.docx) ini.' }
    }
  }

  if (mimeType === 'application/msword' || filename?.toLowerCase().endsWith('.doc')) {
    return { error: 'Format .doc lama belum didukung. Convert dulu ke .docx atau PDF, atau pakai tab "Upload Gambar"/"Bahasa Natural".' }
  }

  return { error: 'Format file tidak didukung. Gunakan PDF atau DOCX (untuk gambar, pakai tab "Upload Gambar").' }
}
