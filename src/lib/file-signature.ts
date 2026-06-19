import 'server-only'

/**
 * Verifikasi tipe file dari isi sebenarnya (magic number / byte signature),
 * bukan cuma percaya `file.type` yang dikirim client (header itu gampang
 * dipalsukan — file .exe bisa diklaim "image/png" dan lolos validasi MIME
 * biasa).
 *
 * Cakupan sengaja dibatasi ke tipe yang benar-benar dipakai upload di app
 * ini (gambar umum + PDF + dokumen Office/ZIP). Video & text/plain TIDAK
 * diverifikasi lewat magic byte di sini (perlu signature lebih kompleks /
 * tidak terlalu rawan disalahgunakan untuk app ini) — untuk tipe itu,
 * verifyFileContent akan meloloskan begitu saja dan tetap mengandalkan
 * validasi MIME header sebagai lapis pertama.
 */

type Signature = { mime: string; bytes: number[]; offset?: number }

const SIGNATURES: Signature[] = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // 'RIFF'; WEBP dicek terpisah di offset 8
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'application/zip', bytes: [0x50, 0x4b, 0x03, 0x04] }, // juga format dasar .docx/.xlsx
]

const OFFICE_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
])

/** Deteksi MIME dari isi buffer berdasarkan magic number. Null kalau tidak dikenali. */
export function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const sig of SIGNATURES) {
    const offset = sig.offset ?? 0
    if (buffer.length < offset + sig.bytes.length) continue
    const matches = sig.bytes.every((b, i) => buffer[offset + i] === b)
    if (!matches) continue

    if (sig.mime === 'image/webp') {
      // Format RIFF dipakai banyak hal; pastikan benar-benar WEBP di offset 8.
      if (buffer.length < 12) continue
      const marker = buffer.subarray(8, 12).toString('ascii')
      if (marker !== 'WEBP') continue
      return 'image/webp'
    }

    return sig.mime
  }
  return null
}

/**
 * True kalau isi file (byte sebenarnya) konsisten dengan `declaredMime`
 * (MIME yang diklaim client). Tipe yang tidak punya signature dikenal
 * (video/*, text/plain, dll) otomatis lolos — hanya lapis tambahan, bukan
 * pengganti validasi MIME header yang sudah ada.
 */
export function verifyFileContent(buffer: Buffer, declaredMime: string): boolean {
  const detected = detectMimeFromBuffer(buffer)
  if (!detected) return true // tidak punya signature dikenal -> tidak diblokir di sini

  if (detected === declaredMime) return true

  // .docx/.xlsx secara byte adalah file ZIP biasa -> wajar terdeteksi sebagai zip.
  if (detected === 'application/zip' && OFFICE_MIMES.has(declaredMime)) return true

  return false
}
