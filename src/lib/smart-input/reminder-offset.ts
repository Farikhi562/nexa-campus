/**
 * Parse offset reminder dari teks: "ingatkan 2 jam sebelum", "reminder 30 menit
 * sebelumnya", "kasih tau gue sehari sebelum deadline". Mengembalikan jumlah
 * MENIT sebelum deadline, atau null kalau tidak ada penyebutan eksplisit.
 *
 * Konservatif: hanya cocok kalau ada angka + satuan waktu + kata "sebelum".
 */
export function parseReminderOffset(textRaw: string): number | null {
  const text = textRaw.toLowerCase()

  // Pola umum: "(ingatkan|reminder|kasih tau|ingetin) ... <N> <satuan> sebelum"
  // atau langsung "<N> <satuan> sebelum(nya)".
  const m = text.match(/(\d+)\s*(menit|jam|hari|minggu)\s*sebelum/)
  if (m) {
    const n = parseInt(m[1], 10)
    if (!Number.isFinite(n) || n <= 0) return null
    switch (m[2]) {
      case 'menit': return n
      case 'jam': return n * 60
      case 'hari': return n * 60 * 24
      case 'minggu': return n * 60 * 24 * 7
    }
  }

  // Kasus tanpa angka: "sehari sebelum", "sejam sebelum", "semenit sebelum"
  if (/\bse-?hari sebelum/.test(text)) return 60 * 24
  if (/\bse-?jam sebelum/.test(text)) return 60
  if (/\bse-?minggu sebelum/.test(text)) return 60 * 24 * 7

  return null
}

/** Ubah menit jadi label manusiawi: 120 → "2 jam sebelum". */
export function formatReminderOffset(minutes: number): string {
  if (minutes % (60 * 24 * 7) === 0) return `${minutes / (60 * 24 * 7)} minggu sebelum`
  if (minutes % (60 * 24) === 0) return `${minutes / (60 * 24)} hari sebelum`
  if (minutes % 60 === 0) return `${minutes / 60} jam sebelum`
  return `${minutes} menit sebelum`
}
