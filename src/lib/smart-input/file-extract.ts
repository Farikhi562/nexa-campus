import 'server-only'

export type FileExtractResult = { text: string } | { error: string }

const MAX_EXTRACTED_CHARS = 8000

/**
 * Ekstrak teks dari file PDF/DOCX. Sengaja simpel (sesuai brief): tidak ada OCR
 * untuk PDF hasil scan (gambar) — kalau hasil ekstraksi kosong, kembalikan
 * error yang ramah supaya UI bisa arahkan user ke tab Upload Gambar (vision AI)
 * atau Manual.
 *
 * Dependency: `pdf-parse` (PDF) dan `mammoth` (DOCX) — lihat README untuk
 * `npm install`.
 */
export async function extractTextFromFile(base64: string, mimeType: string, filename?: string): Promise<FileExtractResult> {
  const buffer = Buffer.from(base64, 'base64')

  if (mimeType === 'application/pdf' || filename?.toLowerCase().endsWith('.pdf')) {
    try {
      // Import dinamis: hindari memuat pdf-parse kalau tidak dipakai.
      // pdf-parse punya CJS/ESM interop quirk — .default ada di CJS, tapi tidak
      // di ESM export. Pakai fallback supaya jalan di kedua mode.
      const mod = await import('pdf-parse') as any
      const pdfParse: (buf: Buffer) => Promise<{ text: string }> = mod.default ?? mod
      const result = await pdfParse(buffer)
      const text = (result.text || '').trim()
      if (!text) {
        return { error: 'PDF ini sepertinya hasil scan/gambar (tidak ada teks terbaca). Coba upload sebagai foto di tab "Upload Gambar".' }
      }
      return { text: text.slice(0, MAX_EXTRACTED_CHARS) }
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

  if (mimeType === 'application/msword' || filename?.toLowerCase().endsWith('.doc')) {
    return { error: 'Format .doc lama belum didukung. Convert dulu ke .docx atau PDF, atau pakai tab "Upload Gambar"/"Bahasa Natural".' }
  }

  return { error: 'Format file tidak didukung. Gunakan PDF atau DOCX (untuk gambar, pakai tab "Upload Gambar").' }
}
