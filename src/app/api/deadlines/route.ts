import { NextRequest, NextResponse } from 'next/server'
import { DEADLINE_SOURCES, DEADLINE_STATUSES, DEADLINE_TYPES, PRIORITIES } from '@/lib/nexa-data'
import { createClient } from '@/lib/supabase/server'
import type { DeadlinePriority, DeadlineSource, DeadlineStatus, DeadlineType } from '@/types'

const allowedTypes = new Set(DEADLINE_TYPES.map((item) => item.value))
const allowedSources = new Set(DEADLINE_SOURCES.map((item) => item.value))
const allowedPriorities = new Set(PRIORITIES.map((item) => item.value))
const allowedStatuses = new Set(DEADLINE_STATUSES.map((item) => item.value))

type DeadlinePayload = {
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

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function optionalText(value: unknown) {
  const cleaned = text(value)
  return cleaned ? cleaned : null
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })
  }

  let body: DeadlinePayload
  try {
    body = (await request.json()) as DeadlinePayload
  } catch {
    return badRequest('Request tidak valid.')
  }

  const courseName = text(body.course_name)
  const type = text(body.type)
  const source = text(body.source)
  const deadlineDate = text(body.deadline_date)
  const deadlineTime = text(body.deadline_time)
  const campus = text(body.campus)
  const room = text(body.room)
  const priority = text(body.priority || 'normal')
  const status = text(body.status || 'pending')

  if (!courseName) return badRequest('Mata kuliah atau kegiatan wajib diisi.')
  if (!allowedTypes.has(type as DeadlineType)) return badRequest('Tipe deadline tidak valid.')
  if (!allowedSources.has(source as DeadlineSource)) return badRequest('Sumber deadline tidak valid.')
  if (!isValidDate(deadlineDate)) return badRequest('Tanggal deadline tidak valid.')
  if (!isValidTime(deadlineTime)) return badRequest('Jam deadline tidak valid.')
  if (!campus) return badRequest('Kampus wajib diisi.')
  if (!room) return badRequest('Ruangan wajib diisi. Kalau online, isi dengan Online.')
  if (!allowedPriorities.has(priority as DeadlinePriority)) return badRequest('Prioritas tidak valid.')
  if (!allowedStatuses.has(status as DeadlineStatus)) return badRequest('Status tidak valid.')

  const { data, error } = await supabase
    .from('academic_deadlines')
    .insert({
      user_id: user.id,
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
    })
    .select('id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
