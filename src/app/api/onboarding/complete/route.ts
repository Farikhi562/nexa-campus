import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type DeadlinePayload = {
  title?: unknown
  category?: unknown
  due_date?: unknown
  priority?: unknown
} | null

type CompleteOnboardingPayload = {
  deadlineSources?: unknown
  reminderPreference?: unknown
  telegramUsername?: unknown
  deadline?: DeadlinePayload
}

const allowedSources = new Set(['VClass', 'iLab', 'Grup WA', 'Email Dosen', 'BAAK', 'Lainnya'])
const allowedReminderPreferences = new Set(['telegram', 'dashboard'])
const allowedPriorities = new Set(['low', 'medium', 'high'])

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null) as CompleteOnboardingPayload | null
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Payload onboarding tidak valid.' }, { status: 400 })
  }

  const deadlineSources = Array.isArray(body.deadlineSources)
    ? body.deadlineSources.filter((item): item is string => typeof item === 'string' && allowedSources.has(item))
    : []
  const reminderPreference = typeof body.reminderPreference === 'string' && allowedReminderPreferences.has(body.reminderPreference)
    ? body.reminderPreference
    : 'dashboard'
  const telegramUsername = reminderPreference === 'telegram' && typeof body.telegramUsername === 'string'
    ? normalizeTelegramUsername(body.telegramUsername)
    : null

  if (deadlineSources.length === 0) {
    return NextResponse.json({ error: 'Pilih minimal satu sumber deadline.' }, { status: 400 })
  }

  if (reminderPreference === 'telegram' && !telegramUsername) {
    return NextResponse.json({ error: 'Username Telegram wajib diisi.' }, { status: 400 })
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      deadline_sources: deadlineSources,
      reminder_preference: reminderPreference,
      telegram_username: telegramUsername,
    },
  })

  if (metadataError) {
    return NextResponse.json({ error: metadataError.message }, { status: 500 })
  }

  const profileError = await updateProfile(supabase, user.id, {
    onboarding_completed: true,
    reminder_preference: reminderPreference,
    telegram_username: telegramUsername,
    deadline_sources: deadlineSources,
    updated_at: new Date().toISOString(),
  })

  if (profileError) {
    return NextResponse.json({ error: profileError }, { status: 500 })
  }

  if (body.deadline !== null && body.deadline !== undefined) {
    const deadline = parseDeadline(body.deadline)
    if (!deadline.ok) {
      return NextResponse.json({ error: deadline.error }, { status: 400 })
    }

    const insertError = await insertDeadline(supabase, user.id, deadline.value)
    if (insertError) {
      return NextResponse.json({ error: insertError }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}

function parseDeadline(deadline: DeadlinePayload) {
  if (!deadline || typeof deadline !== 'object') {
    return { ok: false as const, error: 'Deadline tidak valid.' }
  }

  const title = typeof deadline.title === 'string' ? deadline.title.trim() : ''
  const category = typeof deadline.category === 'string' && deadline.category.trim() ? deadline.category.trim() : 'Tugas'
  const dueDate = typeof deadline.due_date === 'string' ? deadline.due_date : ''
  const priority = typeof deadline.priority === 'string' && allowedPriorities.has(deadline.priority)
    ? deadline.priority
    : 'medium'

  if (!title || !dueDate) {
    return { ok: false as const, error: 'Judul dan tanggal deadline wajib diisi.' }
  }

  if (Number.isNaN(Date.parse(dueDate))) {
    return { ok: false as const, error: 'Tanggal deadline tidak valid.' }
  }

  return {
    ok: true as const,
    value: { title, category, due_date: dueDate, priority },
  }
}

async function updateProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  updates: Record<string, unknown>,
) {
  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (!error) return null

  const { error: fallbackError } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true, updated_at: updates.updated_at })
    .eq('id', userId)

  return fallbackError?.message ?? null
}

async function insertDeadline(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  deadline: { title: string; category: string; due_date: string; priority: string },
) {
  const typeMap: Record<string, string> = {
    UTS: 'ujian',
    UAS: 'ujian',
    Tugas: 'tugas',
    Quiz: 'kuis',
    Praktikum: 'praktikum',
    Lainnya: 'lainnya',
  }
  const priorityMap: Record<string, string> = {
    low: 'low',
    medium: 'normal',
    high: 'high',
  }

  const { error } = await supabase.from('academic_deadlines').insert({
    user_id: userId,
    title: deadline.title,
    course_name: deadline.title,
    type: typeMap[deadline.category] ?? 'lainnya',
    source: 'lainnya',
    deadline_date: deadline.due_date,
    deadline_time: '23:59',
    campus: '-',
    room: '-',
    status: 'pending',
    priority: priorityMap[deadline.priority] ?? 'normal',
    reminder_enabled: false,
  })

  return error?.message ?? null
}

function normalizeTelegramUsername(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`
}
