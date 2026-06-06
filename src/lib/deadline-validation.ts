import { DEADLINE_SOURCES, DEADLINE_STATUSES, DEADLINE_TYPES, PRIORITIES } from '@/lib/nexa-data'
import type { DeadlinePriority, DeadlineSource, DeadlineStatus, DeadlineType } from '@/types'

const allowedTypes = new Set(DEADLINE_TYPES.map((item) => item.value))
const allowedSources = new Set(DEADLINE_SOURCES.map((item) => item.value))
const allowedPriorities = new Set(PRIORITIES.map((item) => item.value))
const allowedStatuses = new Set(DEADLINE_STATUSES.map((item) => item.value))

export type DeadlinePayload = {
  title?: unknown
  course_name?: unknown
  type?: unknown
  source?: unknown
  deadline_date?: unknown
  deadline_time?: unknown
  campus?: unknown
  room?: unknown
  location_note?: unknown
  notes?: unknown
  priority?: unknown
  reminder_enabled?: unknown
  status?: unknown
}

export function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function optionalText(value: unknown) {
  const cleaned = text(value)
  return cleaned ? cleaned : null
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function parseDeadlinePayload(body: DeadlinePayload) {
  const courseName = text(body.course_name)
  const type = text(body.type)
  const source = text(body.source)
  const deadlineDate = text(body.deadline_date)
  const deadlineTime = text(body.deadline_time)
  const campus = text(body.campus)
  const room = text(body.room)
  const priority = text(body.priority || 'normal')
  const status = text(body.status || 'pending')

  if (!courseName) return { error: 'Mata kuliah atau kegiatan wajib diisi.' }
  if (!allowedTypes.has(type as DeadlineType)) return { error: 'Tipe deadline tidak valid.' }
  if (!allowedSources.has(source as DeadlineSource))
    return { error: 'Sumber deadline tidak valid.' }
  if (!isValidDate(deadlineDate)) return { error: 'Tanggal deadline tidak valid.' }
  if (!isValidTime(deadlineTime)) return { error: 'Jam deadline tidak valid.' }
  if (!campus) return { error: 'Kampus wajib diisi.' }
  if (!room) return { error: 'Ruangan wajib diisi. Kalau online, isi dengan Online.' }
  if (!allowedPriorities.has(priority as DeadlinePriority))
    return { error: 'Prioritas tidak valid.' }
  if (!allowedStatuses.has(status as DeadlineStatus)) return { error: 'Status tidak valid.' }

  return {
    data: {
      title: optionalText(body.title),
      course_name: courseName,
      type,
      source,
      deadline_date: deadlineDate,
      deadline_time: deadlineTime,
      campus,
      room,
      location_note: optionalText(body.location_note),
      notes: optionalText(body.notes),
      priority,
      reminder_enabled: body.reminder_enabled === true,
      status,
    },
  }
}

export function parseStatusPatch(value: unknown) {
  const status = text(value)
  if (!allowedStatuses.has(status as DeadlineStatus)) return { error: 'Status tidak valid.' }
  return { data: { status } }
}
