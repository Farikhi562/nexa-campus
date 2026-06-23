import type { SmartInputIntent } from './types'

/**
 * Klasifikasi maksud utama input Smart Input dari teks mentah. Berbasis sinyal
 * kata kunci — ringan, tanpa AI (fallback). Kalau dipanggil dari jalur AI,
 * AI bisa override hasil ini.
 *
 *  - study    : ada niat belajar/paham materi ("ajarin", "jelasin", "rangkum")
 *  - reminder : minta diingatkan ("ingatkan", "reminder", "jangan lupa")
 *  - schedule : jadwal berulang/kuliah ("tiap senin", "jadwal kuliah")
 *  - deadline : tugas/ujian dengan tenggat (default untuk mayoritas input)
 *  - mixed    : terdeteksi >1 maksud kuat
 *  - unknown  : tidak ada sinyal sama sekali
 */
export function classifyIntent(textRaw: string): SmartInputIntent {
  const text = textRaw.toLowerCase()
  const signals: SmartInputIntent[] = []

  // Study — niat memahami materi
  if (/\b(ajarin|ajari|jelasin|jelaskan|rangkum|ringkas|pahami|paham|belajar|pelajari|materi|kuasai|mengerti|ngerti)\b/.test(text)
      && /\b(ajarin|ajari|jelasin|jelaskan|rangkum|ringkas|pahami|belajar|pelajari|kuasai|quiz|flashcard)\b/.test(text)) {
    signals.push('study')
  }

  // Reminder — minta diingatkan dengan offset waktu
  if (/\b(ingatkan|ingetin|reminder|jangan lupa|kasih tau|kasih tahu)\b/.test(text)
      && /sebelum/.test(text)) {
    signals.push('reminder')
  }

  // Schedule — jadwal berulang/rutin
  if (/\b(setiap|tiap|rutin)\s+(senin|selasa|rabu|kamis|jumat|jum'?at|sabtu|minggu)\b/.test(text)
      || /\bjadwal\s+(kuliah|mingguan|rutin|tetap)\b/.test(text)) {
    signals.push('schedule')
  }

  // Deadline — sinyal tenggat/tugas/ujian
  if (/\b(deadline|tenggat|kumpul|kumpulin|submit|tugas|laporan|makalah|uts|uas|ujian|quiz|kuis|presentasi|praktikum)\b/.test(text)) {
    signals.push('deadline')
  }

  const unique = Array.from(new Set(signals))
  if (unique.length === 0) return 'unknown'
  if (unique.length === 1) return unique[0]

  // Prioritas kalau campuran: study menang kalau ada (paling beda alurnya),
  // selain itu anggap 'mixed'.
  if (unique.includes('study') && unique.length === 2 && unique.includes('deadline')) return 'study'
  return 'mixed'
}
