import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendTelegramMessage, buildReminderMessage } from '@/lib/telegram'
import { sendWebPush, pushConfigured } from '@/lib/push/web-push'
import { buildPushPayload } from '@/lib/reminders/push-message'

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

type ReminderPref = {
  user_id: string
  channel: string
  reminder_time: string
  h7_enabled: boolean
  h3_enabled: boolean
  h1_enabled: boolean
  day_enabled: boolean
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const db = createServiceClient()
  const { dateStr, hour } = wibNow()
  const pushReady = pushConfigured()

  let totalSent = 0, totalFailed = 0, totalAttempts = 0
  let pushSent = 0, pushFailed = 0, pushAttempts = 0, pushRemoved = 0

  console.log(`[Cron] Reminder start — WIB date=${dateStr} hour=${hour} pushReady=${pushReady}`)

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

    // 2) Kumpulkan user_id unik, fetch profil + reminder_preferences (semua channel)
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
      .in('channel', ['telegram', 'push'])

    // 3) Subscription push milik user-user ini (1 user bisa banyak device)
    const { data: pushSubs } = await db
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', userIds)

    const profileMap = new Map((profiles ?? []).map((p: Record<string, unknown>) => [p.id as string, p]))

    const telegramPrefMap = new Map<string, ReminderPref>()
    const pushPrefMap = new Map<string, ReminderPref>()
    for (const p of (prefs ?? []) as ReminderPref[]) {
      if (p.channel === 'telegram') telegramPrefMap.set(p.user_id, p)
      else if (p.channel === 'push') pushPrefMap.set(p.user_id, p)
    }

    const pushSubsByUser = new Map<string, Array<{ id: string; endpoint: string; p256dh: string; auth: string }>>()
    for (const s of (pushSubs ?? []) as Array<{ id: string; user_id: string; endpoint: string; p256dh: string; auth: string }>) {
      const list = pushSubsByUser.get(s.user_id) ?? []
      list.push(s)
      pushSubsByUser.set(s.user_id, list)
    }

    for (const dl of deadlines) {
      const userId = dl.user_id as string
      const deadlineInfo = {
        title: dl.title as string | null,
        course_name: dl.course_name as string,
        deadline_date: dl.deadline_date as string,
        deadline_time: dl.deadline_time as string,
        campus: dl.campus as string,
        room: dl.room as string,
      }

      // ---------------- TELEGRAM (existing logic) ----------------
      const profile = profileMap.get(userId)
      const telegramPref = telegramPrefMap.get(userId)

      if (profile && telegramPref) {
        const chatId = (profile.telegram_chat_id as string)?.trim()
        const reminderHour = parseInt(telegramPref.reminder_time.slice(0, 2), 10)

        if (chatId && telegramPref[win.enabledField] && reminderHour === hour) {
          totalAttempts++

          const { data: existing } = await db
            .from('reminder_logs')
            .select('id')
            .eq('deadline_id', dl.id as string)
            .eq('channel', 'telegram')
            .eq('reminder_type', win.type)
            .eq('status', 'sent')
            .maybeSingle()

          if (!existing) {
            const text = buildReminderMessage(win.type, deadlineInfo)
            const result = await sendTelegramMessage(chatId, text)

            if (result.ok) {
              await db.from('reminder_logs').insert({
                user_id: userId,
                deadline_id: dl.id,
                channel: 'telegram',
                reminder_type: win.type,
                status: 'sent',
                sent_at: new Date().toISOString(),
              }).then(() => null, () => null)

              await db.from('notifications').insert({
                user_id: userId,
                type: 'deadline_reminder',
                title: `Reminder: ${deadlineInfo.course_name}`,
                message: `Deadline ${win.days === 0 ? 'hari ini' : `dalam ${win.days} hari`}: ${deadlineInfo.title ?? deadlineInfo.course_name}`,
                link: '/dashboard',
              }).then(() => null, () => null)

              totalSent++
            } else {
              await db.from('reminder_logs').insert({
                user_id: userId,
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
      }

      // ---------------- WEB PUSH ----------------
      const pushPref = pushPrefMap.get(userId)
      const subs = pushSubsByUser.get(userId)

      if (pushReady && pushPref && subs?.length) {
        const reminderHour = parseInt(pushPref.reminder_time.slice(0, 2), 10)

        if (pushPref[win.enabledField] && reminderHour === hour) {
          pushAttempts++

          const { data: existing } = await db
            .from('reminder_logs')
            .select('id')
            .eq('deadline_id', dl.id as string)
            .eq('channel', 'push')
            .eq('reminder_type', win.type)
            .eq('status', 'sent')
            .maybeSingle()

          if (!existing) {
            const payload = buildPushPayload(win.type, deadlineInfo)
            let anySent = false
            let lastError: string | undefined

            for (const sub of subs) {
              const result = await sendWebPush(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
              )
              if (result.ok) {
                anySent = true
              } else if (result.gone) {
                await db.from('push_subscriptions').delete().eq('id', sub.id).then(() => null, () => null)
                pushRemoved++
              } else {
                lastError = result.error
              }
            }

            if (anySent) {
              await db.from('reminder_logs').insert({
                user_id: userId,
                deadline_id: dl.id,
                channel: 'push',
                reminder_type: win.type,
                status: 'sent',
                sent_at: new Date().toISOString(),
              }).then(() => null, () => null)

              await db.from('notifications').insert({
                user_id: userId,
                type: 'deadline_reminder',
                title: `Reminder: ${deadlineInfo.course_name}`,
                message: `Deadline ${win.days === 0 ? 'hari ini' : `dalam ${win.days} hari`}: ${deadlineInfo.title ?? deadlineInfo.course_name}`,
                link: '/dashboard',
              }).then(() => null, () => null)

              pushSent++
            } else {
              await db.from('reminder_logs').insert({
                user_id: userId,
                deadline_id: dl.id,
                channel: 'push',
                reminder_type: win.type,
                status: 'failed',
                provider_message: lastError ?? 'Semua device gagal/expired.',
              }).then(() => null, () => null)
              pushFailed++
            }
          }
        }
      }
    }
  }

  console.log(
    `[Cron] Done — telegram sent=${totalSent} failed=${totalFailed} attempts=${totalAttempts} | push sent=${pushSent} failed=${pushFailed} attempts=${pushAttempts} removed=${pushRemoved}`
  )

  return NextResponse.json({
    ok: true,
    date: dateStr,
    hour,
    telegram: { sent: totalSent, failed: totalFailed, attempted: totalAttempts },
    push: { ready: pushReady, sent: pushSent, failed: pushFailed, attempted: pushAttempts, removed: pushRemoved },
  })
}
