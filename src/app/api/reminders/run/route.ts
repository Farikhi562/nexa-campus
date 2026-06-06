import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/reminders/telegram'
import { createServiceClient } from '@/lib/supabase/service'

type ReminderDeadline = {
  id: string
  user_id: string
  title: string | null
  course_name: string
  type: string
  source: string
  deadline_date: string
  deadline_time: string
  priority: string
  status: string
  reminder_enabled: boolean
}

type ReminderProfile = {
  id: string
  full_name: string | null
  telegram_chat_id: string | null
}

function jakartaDate(offsetDays = 0) {
  const now = new Date()
  now.setDate(now.getDate() + offsetDays)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  return `${year}-${month}-${day}`
}

function displayTitle(deadline: ReminderDeadline) {
  const title = deadline.title?.trim()
  if (title) return title
  return `${deadline.type.charAt(0).toUpperCase()}${deadline.type.slice(1)} ${deadline.course_name}`
}

function buildMessage(deadline: ReminderDeadline, label: string) {
  return [
    `NEXA Deadline Radar · ${label}`,
    '',
    `<b>${displayTitle(deadline)}</b>`,
    `Matkul/kegiatan: ${deadline.course_name}`,
    `Tanggal: ${deadline.deadline_date}`,
    `Jam: ${deadline.deadline_time.slice(0, 5)} WIB`,
    `Prioritas: ${deadline.priority}`,
    `Sumber: ${deadline.source}`,
    '',
    'NEXA hanya mengingatkan deadline yang kamu input manual. Tetap cek kanal resmi kampus ya.',
  ].join('\n')
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization')
  return header === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({
      status: 'locked',
      message: 'Telegram reminder belum aktif karena TELEGRAM_BOT_TOKEN belum diisi.',
    })
  }

  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized reminder runner.' }, { status: 401 })
  }

  const today = jakartaDate(0)
  const tomorrow = jakartaDate(1)

  let supabase
  try {
    supabase = createServiceClient()
  } catch {
    return NextResponse.json({
      status: 'locked',
      message: 'Reminder runner butuh SUPABASE_SERVICE_ROLE_KEY server-side.',
    })
  }

  const { data: deadlines, error } = await supabase
    .from('academic_deadlines')
    .select(
      'id,user_id,title,course_name,type,source,deadline_date,deadline_time,priority,status,reminder_enabled'
    )
    .eq('reminder_enabled', true)
    .neq('status', 'completed')
    .in('deadline_date', [today, tomorrow])

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil deadline reminder.' }, { status: 500 })
  }

  const typedDeadlines = (deadlines ?? []) as ReminderDeadline[]
  const userIds = Array.from(new Set(typedDeadlines.map((deadline) => deadline.user_id)))

  if (userIds.length === 0) {
    return NextResponse.json({ status: 'success', sent: 0, skipped: 0 })
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id,full_name,telegram_chat_id')
    .in('id', userIds)

  if (profileError) {
    return NextResponse.json({ error: 'Gagal mengambil profil reminder.' }, { status: 500 })
  }

  const typedProfiles = (profiles ?? []) as ReminderProfile[]
  const profileMap = new Map(typedProfiles.map((profile) => [profile.id, profile]))
  let sent = 0
  let skipped = 0

  for (const deadline of typedDeadlines) {
    const profile = profileMap.get(deadline.user_id)
    const label = deadline.deadline_date === today ? 'Hari ini' : 'H-1'
    const result = await sendTelegramMessage(
      profile?.telegram_chat_id,
      buildMessage(deadline, label)
    )

    if (result.ok) sent += 1
    else skipped += 1
  }

  return NextResponse.json({
    status: 'success',
    sent,
    skipped,
    checked_dates: [today, tomorrow],
  })
}
