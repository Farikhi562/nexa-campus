import type { RawCandidate } from './types'

/**
 * Parser lokal tanpa AI. Dipakai sebagai fallback kalau AI belum dikonfigurasi
 * atau gagal merespons. Mendukung multi-baris (mis. forward chat WA berisi
 * beberapa tugas) — tiap baris yang "kelihatan seperti tugas" jadi 1 kandidat.
 *
 * Sengaja konservatif: kalau tanggal tidak kebaca, deadline_date dibiarkan
 * kosong (bukan ditebak) — normalize.ts akan menandai itu sebagai
 * `missing_fields`, sehingga Smart Preview meminta user mengisinya.
 */

const MONTHS_ID: Record<string, number> = {
  januari: 1, jan: 1, februari: 2, feb: 2, maret: 3, mar: 3, april: 4, apr: 4, mei: 5,
  juni: 6, jun: 6, juli: 7, jul: 7, agustus: 8, agu: 8, ags: 8, september: 9, sep: 9,
  oktober: 10, okt: 10, november: 11, nov: 11, desember: 12, des: 12,
}
const DOW_ID: Record<string, number> = {
  minggu: 0, senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5, "jum'at": 5, sabtu: 6,
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function parseDate(text: string, today: Date): string | null {
  const iso = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`

  const dmy = text.match(/\b(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?\b/)
  if (dmy) {
    const d = +dmy[1], m = +dmy[2]
    let y = dmy[3] ? +dmy[3] : today.getFullYear()
    if (y < 100) y += 2000
    if (d <= 31 && m <= 12) return `${y}-${pad(m)}-${pad(d)}`
  }

  const named = text.match(/\b(\d{1,2})\s+([a-z]+)\b/)
  if (named && MONTHS_ID[named[2]]) {
    return `${today.getFullYear()}-${pad(MONTHS_ID[named[2]])}-${pad(+named[1])}`
  }

  if (/\bhari ini\b/.test(text)) return isoDate(today)
  if (/\bbesok\b/.test(text)) return isoDate(new Date(today.getTime() + 864e5))
  if (/\blusa\b/.test(text)) return isoDate(new Date(today.getTime() + 2 * 864e5))

  for (const [name, dow] of Object.entries(DOW_ID)) {
    if (text.includes(name)) {
      const isNextWeek = /\bminggu depan\b/.test(text)
      let diff = (dow - today.getDay() + 7) % 7
      if (diff === 0) diff = 7
      if (isNextWeek) diff += 7
      return isoDate(new Date(today.getTime() + diff * 864e5))
    }
  }

  return null
}

function parseTime(text: string): string {
  const hm = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
  if (hm) return `${pad(+hm[1])}:${hm[2]}`

  const jam = text.match(/jam\s+(\d{1,2})(?:[.:](\d{2}))?\s*(pagi|siang|sore|malam)?/)
  if (jam) {
    let h = +jam[1]
    const min = jam[2] ? +jam[2] : 0
    const part = jam[3]
    if ((part === 'sore' || part === 'malam') && h < 12) h += 12
    if (h > 23) h = 23
    return `${pad(h)}:${pad(min)}`
  }

  return '23:59'
}

function parseType(text: string): string {
  if (/\b(uts|uas|ujian)\b/.test(text)) return 'ujian'
  if (/\bpraktikum|lab\b/.test(text)) return 'praktikum'
  if (/\bkuis|quiz\b/.test(text)) return 'kuis'
  if (/\bpresentasi|presentation|sidang\b/.test(text)) return 'presentasi'
  if (/\bbayar|pembayaran|spp|ukt\b/.test(text)) return 'pembayaran'
  if (/\borganisasi|rapat|meeting\b/.test(text)) return 'organisasi'
  if (/\btugas|laporan|makalah|essay|paper\b/.test(text)) return 'tugas'
  return 'tugas'
}

function parseSource(text: string): string {
  if (/\bvclass\b/.test(text)) return 'vclass'
  if (/\bilab\b/.test(text)) return 'ilab'
  if (/\bgrup wa|grup whatsapp|\bwa\b/.test(text)) return 'grup_wa'
  if (/\bdosen\b/.test(text)) return 'dosen_langsung'
  if (/\bstudentsite\b/.test(text)) return 'studentsite'
  if (/\bbaak\b/.test(text)) return 'baak'
  if (/\blepkom\b/.test(text)) return 'lepkom'
  return 'lainnya'
}

function parsePriority(text: string): string {
  if (/\burgent|penting banget|deadline hari ini\b/.test(text)) return 'urgent'
  if (/\bpenting|high\b/.test(text)) return 'high'
  return 'normal'
}

function cleanCourseName(original: string): string {
  return original
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, '')
    // PENTING: hapus pola "jam HH.MM"/"jam HH:MM" SEBELUM regex tanggal d/m/y
    // generik. Kalau dibalik, "23.59" pada "jam 23.59" bisa lebih dulu "dimakan"
    // oleh regex tanggal (karena bentuknya mirip d.m), menyisakan kata "jam"
    // nyangkut sendirian di hasil akhir.
    .replace(/jam\s+\d{1,2}([.:]\d{2})?\s*(pagi|siang|sore|malam)?/gi, '')
    .replace(/\b\d{1,2}[/\-.]\d{1,2}(?:[/\-.]\d{2,4})?\b/g, '')
    .replace(/\b([01]?\d|2[0-3]):([0-5]\d)\b/g, '')
    .replace(/\b(hari ini|besok|lusa|minggu depan|senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu)\b/gi, '')
    .replace(/\bhari\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[,\-–—:]\s*$/, '')
    .trim()
}

/** True kalau baris ini kelihatan seperti info tugas (ada kata kunci atau tanggal/jam). */
function looksLikeTask(line: string): boolean {
  const hasKeyword = /\b(tugas|deadline|kuis|quiz|ujian|uts|uas|praktikum|presentasi|laporan|makalah|bayar|pembayaran|spp|ukt|rapat|sidang)\b/i.test(line)
  const hasDate = /\d{1,2}[/\-.]\d{1,2}|\d{4}-\d{2}-\d{2}|\b(hari ini|besok|lusa|senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu)\b/i.test(line)
  return hasKeyword || hasDate
}

/**
 * Parse 1 baris/kalimat jadi RawCandidate. Selalu mengembalikan sesuatu
 * (course_name fallback = teks asli) — caller yang menentukan apakah baris
 * ini layak jadi kandidat (lihat `looksLikeTask`).
 */
function parseLine(lineRaw: string, today: Date): RawCandidate {
  const line = lineRaw.toLowerCase()
  const date = parseDate(line, today)
  const time = parseTime(line)
  const type = parseType(line)
  const source = parseSource(line)
  const priority = parsePriority(line)
  const online = /\bonline|daring|vclass|ilab|zoom|gmeet\b/.test(line)
  const courseName = cleanCourseName(lineRaw.trim()) || lineRaw.trim()

  return {
    title: null,
    course_name: courseName,
    type,
    source,
    deadline_date: date,
    deadline_time: time,
    priority,
    notes: null,
    online,
  }
}

/**
 * Pecah teks bebas jadi beberapa kandidat. Mendukung:
 *  - 1 kalimat saja (mis. quick-add 1 baris)
 *  - banyak baris (forward chat / paste pengumuman)
 * Maks 10 kandidat untuk menjaga performa & UX preview tidak kebanjiran.
 */
export function localParseText(textRaw: string, now: Date = new Date()): RawCandidate[] {
  const lines = textRaw
    .split(/\r?\n/)
    .flatMap((l) => l.split(/(?<=[.!?])\s+(?=[A-Z0-9])/))
    .map((l) => l.trim())
    .filter((l) => l.length >= 3)

  const candidates: RawCandidate[] = []

  for (const line of lines) {
    if (!looksLikeTask(line)) continue
    candidates.push(parseLine(line, now))
    if (candidates.length >= 10) break
  }

  // Fallback terakhir: kalau tidak ada baris yang "kelihatan seperti tugas"
  // tapi user jelas menulis sesuatu, tetap buat 1 kandidat dari keseluruhan teks
  // (deadline_date kemungkinan null → akan ditandai missing_fields, user isi manual).
  if (candidates.length === 0 && textRaw.trim().length >= 3) {
    candidates.push(parseLine(textRaw.trim(), now))
  }

  return candidates
}
