import type { RawCandidate } from './types'
import { extractLocation } from './location-extract'

// ── Recurring detection ───────────────────────────────────────────────────────
const DOW_NAMES: Record<string, number> = {
  minggu: 0, ahad: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5, "jum'at": 5, jumaat: 5,
  sabtu: 6,
}

function detectRecurring(text: string): { isRecurring: boolean; dayOfWeek: number | null } {
  const m = text.match(/\b(setiap|tiap|rutin|every)\s+(?:minggu\s+)?(senin|selasa|rabu|kamis|jumat|jum'?at|jumaat|sabtu|minggu|ahad)\b/i)
  if (m) {
    const dayName = m[2].toLowerCase().replace("jum'at", 'jumat')
    const dow: Record<string,number> = { minggu:0, ahad:0, senin:1, selasa:2, rabu:3, kamis:4, jumat:5, jumaat:5, sabtu:6 }
    return { isRecurring: true, dayOfWeek: dow[dayName] ?? null }
  }
  if (/\bjadwal\s+(mingguan|rutin|tetap)\b/i.test(text)) {
    return { isRecurring: true, dayOfWeek: null }
  }
  return { isRecurring: false, dayOfWeek: null }
}

function extractLecturerNote(text: string): string | null {
  const m = text.match(/\b(?:dari\s+|from\s+)?(bapak|pak|ibu|bu|dr\.?|prof\.?)\s+([a-z][\w.\s]{1,40}?)(?:\s*[:–,]|\s+bilang|\s+nyuruh|\s+minta|\s+kasih)/i)
  if (m) {
    const name = m[2].trim().replace(/\s{2,}/g, ' ')
    if (name.length >= 2) return `Dari ${m[1]} ${name}`
  }
  return null
}

function extractTitleHint(text: string): string | null {
  const labeledMatch = text.match(/\b(?:judul|title)\s*[:\-]\s*(.{3,150})/i)
  if (labeledMatch) {
    const value = labeledMatch[1].split(/[.\n]/)[0].trim()
    if (value.length >= 3) return value
  }
  const quoteMatch = text.match(/["""]([^"""]{3,150})["""]/)
  if (quoteMatch) return quoteMatch[1].trim()
  const subtitleMatch = text.match(/\btugas\s+(?:\d+|ke-\d+|[ivx]+)\s*[:\-–]\s*([A-Z][^.\n]{3,100})/i)
  if (subtitleMatch) return subtitleMatch[1].trim()
  return null
}

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
    // PENTING: "siang" sebelumnya TIDAK termasuk di kondisi ini -- "jam 2
    // siang" salah ke-parse jadi 02:00 (dini hari) padahal maksudnya 14:00
    // (siang hari). Indonesia: siang ~11:00-15:00, sore ~15:00-18:00,
    // malam ~18:00-24:00 -- ketiganya butuh +12 untuk jam 1-11.
    if ((part === 'siang' || part === 'sore' || part === 'malam') && h >= 1 && h < 12) h += 12
    // "jam 12 malam" = tengah malam = 00:00, bukan tetap 12 (siang/noon).
    if (part === 'malam' && h === 12) h = 0
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
    // Ruangan/lokasi sudah ditangkap terpisah lewat extractLocation() — buang
    // dari course_name supaya tidak nongol dobel ("Kalkulus ruang B204" jadi
    // cuma "Kalkulus", ruangnya pindah ke field room).
    .replace(/\b(ruang(?:an)?|gedung|lab(?:oratorium)?|lt\.?|lantai)\s+(?:(?!\b(?:jam|pukul|pada|untuk|dengan|dan|yang|di|ke|hari|besok|lusa|senin|selasa|rabu|kamis|jumat|jum'at|sabtu|minggu|deadline)\b)[a-z0-9.\-]+\s*){1,3}/gi, '')
    .replace(/\b(google\s*meet|gmeet|zoom|microsoft\s*teams|teams)\b/gi, '')
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
  const location = extractLocation(lineRaw)
  const titleHint = extractTitleHint(lineRaw)
  const lecturerNote = extractLecturerNote(lineRaw)
  const { isRecurring, dayOfWeek } = detectRecurring(line)
  const courseName = cleanCourseName(lineRaw.trim()) || lineRaw.trim()

  return {
    title: titleHint,
    course_name: courseName,
    type,
    source,
    deadline_date: date,
    deadline_time: time,
    priority,
    notes: lecturerNote,
    online,
    location,
    is_recurring: isRecurring || undefined,
    recurrence_day_of_week: dayOfWeek ?? undefined,
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
