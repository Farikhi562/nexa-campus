import 'server-only'
import { generateText, activeProviderInfo, aiConfigured } from '@/lib/ai/llm'

export type ParsedDeadline = {
  title: string | null
  course_name: string | null
  type: string | null
  deadline_date: string | null
  deadline_time: string | null
  priority: 'low' | 'medium' | 'high' | null
  confidence: 'low' | 'medium' | 'high'
  missing_fields: string[]
}

export type DeadlineParseResult = {
  isDeadlineIntent: boolean
  deadline: ParsedDeadline | null
  provider: string
  model: string
}

const CREATE_DEADLINE_PATTERNS = [
  /\b(tambah|tambahkan|catat|buatin|buatkan|input|masukin|masukkan|save|simpan)\b/i,
  /\b(deadline|tugas|quiz|kuis|uts|uas|ujian|praktikum|presentasi|laporan|project|proyek)\b/i,
]

const DAY_INDEX: Record<string, number> = {
  minggu: 0,
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  jumaat: 5,
  sabtu: 6,
}

function jakartaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)

  return new Date(Date.UTC(year, month - 1, day))
}

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function addDays(days: number) {
  const date = jakartaDate()
  date.setUTCDate(date.getUTCDate() + days)
  return toISODate(date)
}

function nextWeekday(target: number) {
  const today = jakartaDate()
  const current = today.getUTCDay()
  let diff = target - current
  if (diff <= 0) diff += 7
  today.setUTCDate(today.getUTCDate() + diff)
  return toISODate(today)
}

function getTodayISO() {
  return toISODate(jakartaDate())
}

function normalizeTime(text: string): string | null {
  // Jangan asal comot angka pertama, nanti tanggal 20/06/2026 dikira jam 20:00. Itu bukan AI, itu dongo berkedok regex.
  const withPrefix = text.match(/(?:jam|pukul|pk\.?|pkl\.?)\s*(\d{1,2})(?:[:.](\d{2}))?\s*(pagi|siang|sore|malam)?/i)
  const withSeparator = text.match(/\b(\d{1,2})[:.](\d{2})\b/)
  const withPeriod = text.match(/\b(\d{1,2})\s*(pagi|siang|sore|malam)\b/i)
  const match = withPrefix || withSeparator || withPeriod

  if (!match) return null

  let hour = Number(match[1])
  const minute = Number(match[2] && /^\d{2}$/.test(match[2]) ? match[2] : '0')
  const period = (withPrefix ? match[3] : withPeriod ? match[2] : undefined)?.toLowerCase()

  if (Number.isNaN(hour) || Number.isNaN(minute) || hour > 24 || minute > 59) return null

  if (period === 'malam' && hour < 12) hour += 12
  if (period === 'sore' && hour < 12) hour += 12
  if (period === 'siang' && hour < 11) hour += 12
  if (period === 'pagi' && hour === 12) hour = 0
  if (hour === 24) hour = 0

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function normalizeDate(text: string): string | null {
  const lower = text.toLowerCase()

  if (/\b(hari ini|today)\b/.test(lower)) return addDays(0)
  if (/\b(besok|tomorrow)\b/.test(lower)) return addDays(1)
  if (/\b(lusa)\b/.test(lower)) return addDays(2)
  if (/\b(minggu depan|pekan depan)\b/.test(lower)) return addDays(7)

  const explicit = lower.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/)
  if (explicit) {
    const day = Number(explicit[1])
    const month = Number(explicit[2])
    const currentYear = Number(getTodayISO().slice(0, 4))
    let year = explicit[3] ? Number(explicit[3]) : currentYear
    if (year < 100) year += 2000

    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
  }

  for (const [dayName, index] of Object.entries(DAY_INDEX)) {
    if (new RegExp(`\\b${dayName}\\b`, 'i').test(lower)) return nextWeekday(index)
  }

  return null
}

function inferType(text: string): string | null {
  const lower = text.toLowerCase()
  if (/\b(quiz|kuis)\b/.test(lower)) return 'quiz'
  if (/\b(uts|uas|ujian)\b/.test(lower)) return 'exam'
  if (/\b(praktikum)\b/.test(lower)) return 'practicum'
  if (/\b(presentasi)\b/.test(lower)) return 'presentation'
  if (/\b(laporan|makalah)\b/.test(lower)) return 'report'
  if (/\b(project|proyek)\b/.test(lower)) return 'project'
  return 'assignment'
}

function inferPriority(text: string): ParsedDeadline['priority'] {
  const lower = text.toLowerCase()
  if (/\b(penting|urgent|mepet|besok|hari ini|malam ini|deadline banget)\b/.test(lower)) return 'high'
  if (/\b(santai|gampang|kecil)\b/.test(lower)) return 'low'
  return 'medium'
}

function cleanTitle(text: string) {
  return text
    .replace(/\b(tolong|dong|ya|plis|please|nexa|assistant)\b/gi, ' ')
    .replace(/\b(tambah|tambahkan|catat|buatin|buatkan|input|masukin|masukkan|save|simpan)\b/gi, ' ')
    .replace(/\b(deadline|pengingat|reminder)\b/gi, ' ')
    .replace(/\b(hari ini|besok|lusa|minggu depan|pekan depan|senin|selasa|rabu|kamis|jumat|jumaat|sabtu|minggu)\b/gi, ' ')
    .replace(/(?:jam|pukul|pk\.?|pkl\.?)\s*\d{1,2}(?:[:.]\d{2})?\s*(?:pagi|siang|sore|malam)?/gi, ' ')
    .replace(/\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

function missingFields(deadline: Partial<ParsedDeadline>) {
  const missing: string[] = []
  if (!deadline.title) missing.push('title')
  if (!deadline.deadline_date) missing.push('deadline_date')
  return missing
}

function fallbackParse(text: string): ParsedDeadline {
  const title = cleanTitle(text) || null
  const deadline_date = normalizeDate(text)
  const deadline_time = normalizeTime(text)
  const parsed: ParsedDeadline = {
    title,
    course_name: null,
    type: inferType(text),
    deadline_date,
    deadline_time,
    priority: inferPriority(text),
    confidence: title && deadline_date ? 'medium' : 'low',
    missing_fields: [],
  }

  parsed.missing_fields = missingFields(parsed)
  return parsed
}

function safeJsonParse(text: string): Record<string, unknown> | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0]) as Record<string, unknown>
  } catch {
    return null
  }
}

function normalizeParsed(raw: Record<string, unknown>, originalText: string): ParsedDeadline {
  const fallback = fallbackParse(originalText)
  const deadline: ParsedDeadline = {
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim().slice(0, 120) : fallback.title,
    course_name: typeof raw.course_name === 'string' && raw.course_name.trim() ? raw.course_name.trim().slice(0, 80) : null,
    type: typeof raw.type === 'string' && raw.type.trim() ? raw.type.trim().slice(0, 40) : fallback.type,
    deadline_date: typeof raw.deadline_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.deadline_date) ? raw.deadline_date : fallback.deadline_date,
    deadline_time: typeof raw.deadline_time === 'string' && /^\d{2}:\d{2}$/.test(raw.deadline_time) ? raw.deadline_time : fallback.deadline_time,
    priority: raw.priority === 'low' || raw.priority === 'medium' || raw.priority === 'high' ? raw.priority : fallback.priority,
    confidence: raw.confidence === 'high' || raw.confidence === 'medium' || raw.confidence === 'low' ? raw.confidence : fallback.confidence,
    missing_fields: [],
  }

  deadline.missing_fields = missingFields(deadline)
  if (deadline.missing_fields.length > 0) deadline.confidence = 'low'
  return deadline
}

export function isDeadlineCreateIntent(text: string) {
  const lower = text.toLowerCase()
  const hasCreateVerb = CREATE_DEADLINE_PATTERNS[0].test(lower)
  const hasDeadlineWord = CREATE_DEADLINE_PATTERNS[1].test(lower)
  return hasCreateVerb && hasDeadlineWord
}

export async function parseDeadlineFromText(text: string): Promise<DeadlineParseResult> {
  const info = activeProviderInfo()
  const isDeadlineIntent = isDeadlineCreateIntent(text)

  if (!isDeadlineIntent) {
    return { isDeadlineIntent: false, deadline: null, provider: 'none', model: info.textModel }
  }

  const fallback = fallbackParse(text)

  if (!aiConfigured()) {
    return { isDeadlineIntent: true, deadline: fallback, provider: 'none', model: info.textModel }
  }

  try {
    const today = getTodayISO()
    const { text: resultText, provider, model } = await generateText({
      system: [
        'You extract academic deadline data from Indonesian student messages.',
        'Return ONLY strict JSON, no markdown.',
        'Use Asia/Jakarta calendar.',
        'If the user gives relative dates like besok/lusa/Jumat, convert them to YYYY-MM-DD using today.',
        'Allowed priority: low, medium, high.',
        'Allowed confidence: low, medium, high.',
      ].join(' '),
      user: JSON.stringify({
        today,
        message: text,
        expected_json: {
          title: 'short task title, required if possible',
          course_name: 'course name if mentioned, else null',
          type: 'assignment | quiz | exam | practicum | presentation | report | project',
          deadline_date: 'YYYY-MM-DD or null',
          deadline_time: 'HH:mm or null',
          priority: 'low | medium | high',
          confidence: 'low | medium | high',
        },
      }),
      temperature: 0.1,
      maxTokens: 350,
    })

    const json = safeJsonParse(resultText)
    if (!json) return { isDeadlineIntent: true, deadline: fallback, provider, model }

    return {
      isDeadlineIntent: true,
      deadline: normalizeParsed(json, text),
      provider,
      model,
    }
  } catch {
    return { isDeadlineIntent: true, deadline: fallback, provider: 'none', model: info.textModel }
  }
}
