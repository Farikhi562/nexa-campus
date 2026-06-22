import { DEADLINE_TYPES, DEADLINE_SOURCES, PRIORITIES } from '@/lib/nexa-data'
import type { DeadlinePriority, DeadlineSource, DeadlineType } from '@/types'
import type { RawCandidate, SmartInputCandidate } from './types'

const ALLOWED_TYPES = new Set(DEADLINE_TYPES.map((t) => t.value))
const ALLOWED_SOURCES = new Set(DEADLINE_SOURCES.map((s) => s.value))
const ALLOWED_PRIORITIES = new Set(PRIORITIES.map((p) => p.value))

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function validDate(v: string): string | null {
  if (!DATE_RE.test(v)) return null
  const [y, m, d] = v.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return v
}

/**
 * Ubah hasil mentah (dari AI atau parser lokal) jadi SmartInputCandidate yang
 * aman untuk ditampilkan di Smart Preview dan (setelah dikonfirmasi user)
 * dikirim ke /api/smart-input/confirm.
 *
 * Semua field diberi default yang valid terhadap parseDeadlinePayload, supaya
 * preview TIDAK PERNAH gagal-render. Field yang masih perlu dicek user
 * (course_name generik / tanggal tidak terbaca) ditandai di `missing_fields`.
 */
export function normalizeCandidate(raw: RawCandidate, opts: { defaultCampus: string }): SmartInputCandidate {
  const missing: SmartInputCandidate['missing_fields'] = []

  let courseName = str(raw.course_name)
  if (!courseName) {
    courseName = str(raw.title) || 'Tugas baru'
    missing.push('course_name')
  }

  const typeRaw = str(raw.type)
  const type: DeadlineType = ALLOWED_TYPES.has(typeRaw as DeadlineType) ? (typeRaw as DeadlineType) : 'tugas'

  const sourceRaw = str(raw.source)
  const source: DeadlineSource = ALLOWED_SOURCES.has(sourceRaw as DeadlineSource)
    ? (sourceRaw as DeadlineSource)
    : 'lainnya'

  const dateRaw = str(raw.deadline_date)
  const date = dateRaw ? validDate(dateRaw) : null
  if (!date) missing.push('deadline_date')

  const timeRaw = str(raw.deadline_time)
  const time = TIME_RE.test(timeRaw) ? timeRaw : '23:59'

  const priorityRaw = str(raw.priority)
  const priority: DeadlinePriority = ALLOWED_PRIORITIES.has(priorityRaw as DeadlinePriority)
    ? (priorityRaw as DeadlinePriority)
    : 'normal'

  const isOnline = raw.online === true
  // Prioritaskan lokasi eksplisit yang terbaca dari teks (mis. "Ruang B204",
  // "Zoom") — sebelumnya field ini SELALU cuma "Online"/"Menyusul" walau
  // user sebutkan ruangan jelas di teksnya. Fallback ke logic lama kalau
  // tidak ada lokasi eksplisit yang terbaca.
  const explicitLocation = str(raw.location)
  const room = explicitLocation || (isOnline ? 'Online' : 'Menyusul')

  const title = str(raw.title) || null
  const notes = str(raw.notes) || null

  const confidence: SmartInputCandidate['confidence'] =
    missing.length === 0 ? 'high' : missing.includes('deadline_date') ? 'low' : 'medium'

  return {
    title,
    course_name: courseName,
    type,
    source,
    deadline_date: date,
    deadline_time: time,
    campus: opts.defaultCampus || 'Kampus',
    room,
    notes,
    priority,
    reminder_enabled: true,
    confidence,
    missing_fields: missing,
  }
}

export function normalizeCandidates(raws: RawCandidate[], opts: { defaultCampus: string }): SmartInputCandidate[] {
  return raws.map((r) => normalizeCandidate(r, opts))
}
