/**
 * Ekstrak penyebutan ruangan/lokasi/platform dari teks bebas. Dipakai oleh
 * parser lokal (local-parser.ts) DAN quick-nl route — sebelumnya field
 * "room" cuma diisi binary "Online"/"Menyusul" dari deteksi online/offline,
 * tidak pernah benar-benar membaca ruangan yang disebut user (mis. "ruang
 * B204", "lab komputer 2", "gedung C lantai 3").
 *
 * Sengaja KONSERVATIF: kalau tidak yakin / pola tidak cocok jelas, return
 * null (biarkan caller fallback ke logic online/offline yang sudah ada) —
 * lebih baik tidak mengisi daripada salah mengisi dengan teks acak.
 */

const PLATFORM_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /\bgoogle\s*meet\b/i, label: 'Google Meet' },
  { re: /\bgmeet\b/i, label: 'Google Meet' },
  { re: /\bzoom\b/i, label: 'Zoom' },
  { re: /\bmicrosoft\s*teams\b/i, label: 'Microsoft Teams' },
  { re: /\bteams\b/i, label: 'Microsoft Teams' },
  { re: /\bvclass\b/i, label: 'VClass' },
  { re: /\bilab\b/i, label: 'iLab' },
]

// "ruang/ruangan/gedung/lab/lantai" + token pendek setelahnya (huruf/angka/titik/strip),
// maksimal 3 token, BERHENTI di kata penanda batas umum (jam/pukul/pada/untuk/dengan/dan/
// nama hari/besok/lusa/dst) supaya tidak ikut "menelan" bagian kalimat lain di belakangnya.
const ROOM_KEYWORD_RE =
  /\b(ruang(?:an)?|gedung|lab(?:oratorium)?|lt\.?|lantai)\s+((?:(?!\b(?:jam|pukul|pada|untuk|dengan|dan|yang|di|ke|hari|besok|lusa|senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu|deadline)\b)[a-z0-9.\-]+\s*){1,3})/i

function titleCaseKeyword(word: string): string {
  const map: Record<string, string> = {
    ruang: 'Ruang', ruangan: 'Ruangan', gedung: 'Gedung',
    lab: 'Lab', laboratorium: 'Laboratorium', lt: 'Lantai', 'lt.': 'Lantai', lantai: 'Lantai',
  }
  return map[word.toLowerCase()] ?? word
}

export function extractLocation(textRaw: string): string | null {
  const text = textRaw.trim()
  if (!text) return null

  const roomMatch = text.match(ROOM_KEYWORD_RE)
  if (roomMatch) {
    const keyword = titleCaseKeyword(roomMatch[1])
    const value = roomMatch[2].trim().replace(/\s{2,}/g, ' ')
    if (value) return `${keyword} ${value}`.trim()
  }

  for (const platform of PLATFORM_PATTERNS) {
    if (platform.re.test(text)) return platform.label
  }

  return null
}
