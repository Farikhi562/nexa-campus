import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getDisplayTitle } from '@/lib/deadline-utils'
import { getSourceLabel, getTypeLabel } from '@/lib/nexa-data'
import type { AcademicDeadline, Profile, ReminderPreferences } from '@/types'

const TIME_ZONE = 'Asia/Jakarta'

function jakartaDateValue(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  return `${year}-${month}-${day}`
}

function addDays(dateValue: string, days: number) {
  const date = new Date(`${dateValue}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function daysUntil(fromDate: string, toDate: string) {
  const from = new Date(`${fromDate}T00:00:00Z`).getTime()
  const to = new Date(`${toDate}T00:00:00Z`).getTime()
  return Math.round((to - from) / (24 * 60 * 60 * 1000))
}

function isEnabledForDay(preferences: ReminderPreferences | null, day: number) {
  if (!preferences) return day === 1 || day === 0
  if (day === 7) return preferences.h7_enabled
  if (day === 3) return preferences.h3_enabled
  if (day === 1) return preferences.h1_enabled
  if (day === 0) return preferences.day_enabled
  return false
}

function makeReminderMessage(deadline: AcademicDeadline, day: number) {
  const urgency = day === 0 ? 'hari ini' : `H-${day}`
  return [
    `NEXA Reminder: ${getDisplayTitle(deadline)} jatuh tempo ${urgency}.`,
    `Tipe: ${getTypeLabel(deadline.type)}`,
    `Sumber: ${getSourceLabel(deadline.source)}`,
    `Waktu: ${deadline.deadline_date} ${deadline.deadline_time.slice(0, 5)}`,
    `Lokasi: ${deadline.campus} - ${deadline.room}`,
    '',
    'NEXA bisa ngingetin, tapi tugasnya tetap kamu yang ngerjain. Tragis, tapi adil.',
  ].join('\n')
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  })

  const result = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null
  return {
    ok: response.ok && Boolean(result?.ok),
    error: result?.description,
  }
}

async function logReminder(
  supabase: ReturnType<typeof createServiceClient>,
  payload: {
    user_id: string
    deadline_id: string
    channel: 'telegram'
    status: 'sent' | 'failed'
    error_message?: string | null
  }
) {
  try {
    await supabase.from('reminder_logs').insert(payload)
  } catch {
    // reminder_logs is optional for MVP. Sending Telegram should not crash if the table is absent.
  }
}

export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized reminder worker.' }, { status: 401 })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json(
      { status: 'locked', error: 'TELEGRAM_BOT_TOKEN belum tersedia di server.' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  const today = jakartaDateValue()
  const maxDate = addDays(today, 7)

  const { data: deadlines, error } = await supabase
    .from('academic_deadlines')
    .select('*')
    .eq('reminder_enabled', true)
    .in('status', ['pending', 'in_progress'])
    .gte('deadline_date', today)
    .lte('deadline_date', maxDate)

  if (error) {
    return NextResponse.json({ error: 'Gagal mengambil deadline reminder.' }, { status: 500 })
  }

  let sent = 0
  let skipped = 0
  let failed = 0

  for (const deadline of (deadlines ?? []) as AcademicDeadline[]) {
    const day = daysUntil(today, deadline.deadline_date)
    if (![7, 3, 1, 0].includes(day)) {
      skipped += 1
      continue
    }

    const [{ data: profile }, { data: preferences }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', deadline.user_id).maybeSingle(),
      supabase
        .from('reminder_preferences')
        .select('*')
        .eq('user_id', deadline.user_id)
        .eq('channel', 'telegram')
        .maybeSingle(),
    ])

    const typedProfile = profile as Profile | null
    const typedPreferences = preferences as ReminderPreferences | null

    if (!typedProfile?.telegram_chat_id || !isEnabledForDay(typedPreferences, day)) {
      skipped += 1
      continue
    }

    const result = await sendTelegramMessage(
      token,
      typedProfile.telegram_chat_id,
      makeReminderMessage(deadline, day)
    )

    if (result.ok) {
      sent += 1
      await logReminder(supabase, {
        user_id: deadline.user_id,
        deadline_id: deadline.id,
        channel: 'telegram',
        status: 'sent',
      })
    } else {
      failed += 1
      await logReminder(supabase, {
        user_id: deadline.user_id,
        deadline_id: deadline.id,
        channel: 'telegram',
        status: 'failed',
        error_message: result.error || 'Telegram send failed',
      })
    }
  }

  return NextResponse.json({ status: 'done', sent, skipped, failed })
}
