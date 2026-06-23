import 'server-only'

export type FileExtractResult = { text: string } | { error: string }

const MAX_EXTRACTED_CHARS = 8000

/**
 * Ekstrak teks dari file PDF/DOCX.
 *
 * CATATAN PENTING — riwayat pilihan library PDF:
 *
 * 1) pdf-parse (awal Batch 7): di-reject karena bundling pdf.js v1.10.100 (2017)
 *    dengan module-level state yang menyebabkan teks PDF sebelumnya "bocor" ke
 *    hasil parse PDF sesudahnya (verified di testing dengan file asli).
 *
 * 2) pdfjs-dist v6 (Batch 7 setelah reject pdf-parse): berjalan di sandbox (Node
 *    ES2017+), tapi GAGAL di production Vercel dengan error "Gagal membaca file
 *    PDF" karena pdfjs-dist bergantung pada modul `canvas` untuk Node.js yang
 *    tidak berfungsi di dalam worker threads Vercel serverless — bahkan build
 *    legacy/build/pdf.mjs tetap punya dependency ini.
 *
 * 3) unpdf (sekarang): didesain khusus untuk serverless/edge runtimes (Cloudflare
 *    Workers, Vercel Edge & Serverless Functions). Bundling serverless build PDF.js
 *    yang MOCK modul canvas — tidak perlu konfigurasi tambahan, tidak ada
 *    dependency native, API bersih (getDocumentProxy + extractText).
 *    Diverifikasi bekerja di Node.js lokal DAN didesain eksplisit untuk Vercel.
 *    Zero dependency tambahan.
 */
export async function extractTextFromFile(
  base64: string,
  mimeType: string,
  filename?: string
): Promise<FileExtractResult> {
  const buffer = Buffer.from(base64, 'base64')

  if (mimeType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf')) {
    try {
      const { getDocumentProxy, extractText } = await import('unpdf')
      const pdf = await getDocumentProxy(new Uint8Array(buffer))
      const { text } = await extractText(pdf, { mergePages: true })

      const trimmed = (text as string).trim()
      if (!trimmed) {
        return {
          error:
            'PDF ini sepertinya hasil scan/gambar (tidak ada teks terbaca). Coba upload sebagai foto di tab "Upload Gambar".',
        }
      }
      return { text: trimmed.slice(0, MAX_EXTRACTED_CHARS) }
    } catch (err) {
      console.error('[smart-input] gagal parse PDF:', err)
      return { error: 'Gagal membaca file PDF ini. Pastikan file tidak corrupt/terkunci.' }
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

  // TXT — teks polos, langsung decode UTF-8.
  if (mimeType === 'text/plain' || filename?.toLowerCase().endsWith('.txt')) {
    try {
      const text = buffer.toString('utf-8').trim()
      if (!text) return { error: 'File teks ini kosong.' }
      return { text: text.slice(0, MAX_EXTRACTED_CHARS) }
    } catch {
      return { error: 'Gagal membaca file teks ini.' }
    }
  }

  // CSV — decode lalu rapikan jadi baris-baris (sel dipisah " | " biar parser NLP
  // tetap bisa baca tiap baris sebagai satu kandidat). Header (baris pertama)
  // dipertahankan karena sering berisi nama kolom yang membantu konteks AI.
  if (mimeType === 'text/csv' || filename?.toLowerCase().endsWith('.csv')) {
    try {
      const raw = buffer.toString('utf-8').trim()
      if (!raw) return { error: 'File CSV ini kosong.' }
      const lines = raw
        .split(/\r?\n/)
        .filter((line) => line.trim())
        .map((line) => {
          // Pisah CSV sederhana (koma atau titik koma), buang quote pembungkus.
          const cells = line.split(/[,;]/).map((c) => c.trim().replace(/^"|"$/g, ''))
          return cells.filter(Boolean).join(' | ')
        })
      const text = lines.join('\n')
      if (!text) return { error: 'Tidak ada data terbaca dari CSV ini.' }
      return { text: text.slice(0, MAX_EXTRACTED_CHARS) }
    } catch {
      return { error: 'Gagal membaca file CSV ini.' }
    }
  }

  if (mimeType === 'application/msword' || filename?.toLowerCase().endsWith('.doc')) {
    return {
      error:
        'Format .doc lama belum didukung. Convert dulu ke .docx atau PDF, atau pakai tab "Upload Gambar"/"Bahasa Natural".',
    }
  }

  return {
    error:
      'Format file tidak didukung. Gunakan PDF, DOCX, TXT, atau CSV (untuk gambar, pakai tab "Upload Gambar").',
  }
}
