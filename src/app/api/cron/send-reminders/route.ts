import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendTelegramMessage, buildReminderMessage } from '@/lib/telegram'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type ReminderType = 'h7' | 'h3' | 'h1' | 'day'

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`) return true
  if (req.headers.get('x-vercel-cron') === '1') return true
  if (process.env.NODE_ENV === 'development') return true
  return false
}

function wibNow() {
  const now = new Date()
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000)
  return {
    dateStr: wib.toISOString().slice(0, 10),
    hour: wib.getUTCHours(),
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

const WINDOWS: Array<{ days: number; type: ReminderType; enabledField: 'h7_enabled' | 'h3_enabled' | 'h1_enabled' | 'day_enabled' }> = [
  { days: 7, type: 'h7', enabledField: 'h7_enabled' },
  { days: 3, type: 'h3', enabledField: 'h3_enabled' },
  { days: 1, type: 'h1', enabledField: 'h1_enabled' },
  { days: 0, type: 'day', enabledField: 'day_enabled' },
]

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const db = createServiceClient()
  const { dateStr, hour } = wibNow()
  let totalSent = 0, totalFailed = 0, totalAttempts = 0

  console.log(`[Cron] Reminder start — WIB date=${dateStr} hour=${hour}`)

  for (const win of WINDOWS) {
    const targetDate = addDays(dateStr, win.days)

    // 1) Cari deadlines yang jatuh di targetDate + reminder_enabled
    const { data: deadlines, error: dErr } = await db
      .from('academic_deadlines')
      .select('id, title, course_name, deadline_date, deadline_time, campus, room, user_id')
      .eq('deadline_date', targetDate)
      .eq('reminder_enabled', true)
      .in('status', ['pending', 'in_progress'])

    if (dErr || !deadlines?.length) continue

    // 2) Kumpulkan user_id unik, fetch profil + reminder_preferences
    const userIds = Array.from(new Set(deadlines.map((d) => d.user_id as string)))

    const { data: profiles } = await db
      .from('profiles')
      .select('id, telegram_chat_id')
      .in('id', userIds)
      .not('telegram_chat_id', 'is', null)

    const { data: prefs } = await db
      .from('reminder_preferences')
      .select('user_id, channel, reminder_time, h7_enabled, h3_enabled, h1_enabled, day_enabled')
      .in('user_id', userIds)
      .eq('channel', 'telegram')

    const profileMap = new Map((profiles ?? []).map((p: Record<string, unknown>) => [p.id as string, p]))
    const prefMap = new Map((prefs ?? []).map((p: Record<string, unknown>) => [p.user_id as string, p]))

    for (const dl of deadlines) {
      const profile = profileMap.get(dl.user_id as string)
      const pref = prefMap.get(dl.user_id as string)

      if (!profile || !pref) continue

      const chatId = profile.telegram_chat_id as string
      if (!chatId?.trim()) continue

      // Cek apakah reminder window ini diaktifkan user
      if (!pref[win.enabledField]) continue

      // Cek jam: reminder hanya dikirim di jam yang sesuai reminder_time
      const reminderHour = parseInt((pref.reminder_time as string).slice(0, 2), 10)
      if (reminderHour !== hour) continue

      totalAttempts++

      // Dedup: sudah pernah dikirim?
      const { data: existing } = await db
        .from('reminder_logs')
        .select('id')
        .eq('deadline_id', dl.id as string)
        .eq('channel', 'telegram')
        .eq('reminder_type', win.type)
        .eq('status', 'sent')
        .maybeSingle()

      if (existing) continue

      const text = buildReminderMessage(win.type, {
        title: dl.title as string | null,
        course_name: dl.course_name as string,
        deadline_date: dl.deadline_date as string,
        deadline_time: dl.deadline_time as string,
        campus: dl.campus as string,
        room: dl.room as string,
      })

      const result = await sendTelegramMessage(chatId.trim(), text)

      if (result.ok) {
        await db.from('reminder_logs').insert({
          user_id: dl.user_id,
          deadline_id: dl.id,
          channel: 'telegram',
          reminder_type: win.type,
          status: 'sent',
          sent_at: new Date().toISOString(),
        }).then(() => null, () => null)

        await db.from('notifications').insert({
          user_id: dl.user_id,
          type: 'deadline_reminder',
          title: `Reminder: ${dl.course_name as string}`,
          message: `Deadline ${win.days === 0 ? 'hari ini' : `dalam ${win.days} hari`}: ${(dl.title as string | null) ?? (dl.course_name as string)}`,
          link: '/dashboard',
        }).then(() => null, () => null)

        totalSent++
      } else {
        await db.from('reminder_logs').insert({
          user_id: dl.user_id,
          deadline_id: dl.id,
          channel: 'telegram',
          reminder_type: win.type,
          status: 'failed',
          provider_message: result.error,
        }).then(() => null, () => null)
        totalFailed++
      }
    }
  }

  console.log(`[Cron] Done — sent=${totalSent} failed=${totalFailed} attempts=${totalAttempts}`)
  return NextResponse.json({ ok: true, date: dateStr, hour, sent: totalSent, failed: totalFailed, attempted: totalAttempts })
}
