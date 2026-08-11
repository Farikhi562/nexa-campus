import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendTelegramMessage, buildReminderMessage } from '@/lib/telegram'
import { sendWebPush, pushConfigured } from '@/lib/push/web-push'
import { buildPushPayload } from '@/lib/reminders/push-message'
import { sendWhatsAppMessage, buildWhatsAppReminderMessage, waConfigured } from '@/lib/whatsapp'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

type ReminderType = 'h7' | 'h3' | 'h1' | 'day'

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`) return true
  // CATATAN KEAMANAN: SEBELUMNYA ada juga `if (req.headers.get('x-vercel-cron') === '1') return true`
  // di sini. Itu DIHAPUS karena header HTTP biasa bisa dipalsukan siapa saja
  // (curl -H "x-vercel-cron: 1" ...) — Vercel TIDAK menjamin/strip header ini
  // dari request eksternal. Satu-satunya mekanisme yang didokumentasikan resmi
  // oleh Vercel sebagai aman adalah CRON_SECRET via Authorization Bearer header
  // (lihat https://vercel.com/docs/cron-jobs/manage-cron-jobs). Pastikan
  // CRON_SECRET sudah diset di environment variables Vercel.
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

type PrefRow = {
  user_id: string
  channel: string
  reminder_time: string
  h7_enabled: boolean
  h3_enabled: boolean
  h1_enabled: boolean
  day_enabled: boolean
}

type PushSubRow = { user_id: string; endpoint: string; p256dh: string; auth: string }

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const db = createServiceClient()
  const { dateStr, hour } = wibNow()
  const pushEnabled = pushConfigured()
  const waEnabled = waConfigured()
  let totalSent = 0, totalFailed = 0, totalAttempts = 0
  let pushSent = 0, pushFailed = 0, pushRemoved = 0
  let waSent = 0, waFailed = 0

  console.log(`[Cron] Reminder start — WIB date=${dateStr} hour=${hour} push=${pushEnabled} whatsapp=${waEnabled}`)

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

    // 2) Kumpulkan user_id unik, fetch profil + reminder_preferences (telegram & push)
    const userIds = Array.from(new Set(deadlines.map((d) => d.user_id as string)))

    const { data: profiles } = await db
      .from('profiles')
      .select('id, telegram_chat_id, whatsapp_number')
      .in('id', userIds)

    const { data: prefs } = await db
      .from('reminder_preferences')
      .select('user_id, channel, reminder_time, h7_enabled, h3_enabled, h1_enabled, day_enabled')
      .in('user_id', userIds)
      .in('channel', ['telegram', 'push', 'whatsapp'])

    const { data: pushSubs } = pushEnabled
      ? await db
          .from('push_subscriptions')
          .select('user_id, endpoint, p256dh, auth')
          .in('user_id', userIds)
      : { data: [] as PushSubRow[] }

    const profileMap = new Map((profiles ?? []).map((p: Record<string, unknown>) => [p.id as string, p]))
    const prefRows = (prefs ?? []) as PrefRow[]
    const telegramPrefMap = new Map(prefRows.filter((p) => p.channel === 'telegram').map((p) => [p.user_id, p]))
    const pushPrefMap = new Map(prefRows.filter((p) => p.channel === 'push').map((p) => [p.user_id, p]))
    const waPrefMap = new Map(prefRows.filter((p) => p.channel === 'whatsapp').map((p) => [p.user_id, p]))

    const subsByUser = new Map<string, PushSubRow[]>()
    for (const sub of (pushSubs ?? []) as PushSubRow[]) {
      const list = subsByUser.get(sub.user_id) ?? []
      list.push(sub)
      subsByUser.set(sub.user_id, list)
    }

    for (const dl of deadlines) {
      const userId = dl.user_id as string
      const profile = profileMap.get(userId)
      let notifiedThisRound = false

      // ─── Channel: Telegram ─────────────────────────────────────────────
      const telegramPref = telegramPrefMap.get(userId)
      const chatId = (profile?.telegram_chat_id as string | undefined)?.trim()

      if (profile && telegramPref && chatId && telegramPref[win.enabledField]) {
        const reminderHour = parseInt(telegramPref.reminder_time.slice(0, 2), 10)

        if (reminderHour === hour) {
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
            const text = buildReminderMessage(win.type, {
              title: dl.title as string | null,
              course_name: dl.course_name as string,
              deadline_date: dl.deadline_date as string,
              deadline_time: dl.deadline_time as string,
              campus: dl.campus as string,
              room: dl.room as string,
            })

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
              notifiedThisRound = true
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

      // ─── Channel: Web Push (notifikasi asli HP/laptop, seperti WA/native) ──
      const pushPref = pushPrefMap.get(userId)
      const subs = subsByUser.get(userId) ?? []

      if (pushEnabled && pushPref && subs.length && pushPref[win.enabledField]) {
        const reminderHour = parseInt(pushPref.reminder_time.slice(0, 2), 10)

        if (reminderHour === hour) {
          const { data: existingPush } = await db
            .from('reminder_logs')
            .select('id')
            .eq('deadline_id', dl.id as string)
            .eq('channel', 'push')
            .eq('reminder_type', win.type)
            .eq('status', 'sent')
            .maybeSingle()

          if (!existingPush) {
            const payload = buildPushPayload(win.type, {
              title: dl.title as string | null,
              course_name: dl.course_name as string,
              deadline_date: dl.deadline_date as string,
              deadline_time: dl.deadline_time as string,
              campus: dl.campus as string,
              room: dl.room as string,
            })

            let anyOk = false
            for (const sub of subs) {
              const result = await sendWebPush(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload
              )
              if (result.ok) {
                anyOk = true
              } else if (result.gone) {
                await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
                pushRemoved++
              }
            }

            if (anyOk) {
              await db.from('reminder_logs').insert({
                user_id: userId,
                deadline_id: dl.id,
                channel: 'push',
                reminder_type: win.type,
                status: 'sent',
                sent_at: new Date().toISOString(),
              }).then(() => null, () => null)
              notifiedThisRound = true
              pushSent++
            } else {
              await db.from('reminder_logs').insert({
                user_id: userId,
                deadline_id: dl.id,
                channel: 'push',
                reminder_type: win.type,
                status: 'failed',
                provider_message: 'Semua push subscription gagal/expired.',
              }).then(() => null, () => null)
              pushFailed++
            }
          }
        }
      }

      // ─── Channel: WhatsApp (Wablas) ─────────────────────────────────────
      const waPref = waPrefMap.get(userId)
      const waNumber = (profile?.whatsapp_number as string | undefined)?.trim()

      if (waEnabled && profile && waPref && waNumber && waPref[win.enabledField]) {
        const reminderHour = parseInt(waPref.reminder_time.slice(0, 2), 10)

        if (reminderHour === hour) {
          const { data: existingWa } = await db
            .from('reminder_logs')
            .select('id')
            .eq('deadline_id', dl.id as string)
            .eq('channel', 'whatsapp')
            .eq('reminder_type', win.type)
            .eq('status', 'sent')
            .maybeSingle()

          if (!existingWa) {
            const text = buildWhatsAppReminderMessage(win.type, {
              title: dl.title as string | null,
              course_name: dl.course_name as string,
              deadline_date: dl.deadline_date as string,
              deadline_time: dl.deadline_time as string,
              campus: dl.campus as string,
              room: dl.room as string,
            })

            const result = await sendWhatsAppMessage(waNumber, text)

            if (result.ok) {
              await db.from('reminder_logs').insert({
                user_id: userId,
                deadline_id: dl.id,
                channel: 'whatsapp',
                reminder_type: win.type,
                status: 'sent',
                sent_at: new Date().toISOString(),
              }).then(() => null, () => null)
              notifiedThisRound = true
              waSent++
            } else {
              await db.from('reminder_logs').insert({
                user_id: userId,
                deadline_id: dl.id,
                channel: 'whatsapp',
                reminder_type: win.type,
                status: 'failed',
                provider_message: result.error,
              }).then(() => null, () => null)
              waFailed++
            }
          }
        }
      }

      // ─── Notifikasi in-app (bell) — sekali per deadline+window, terlepas
      // dari channel mana yang berhasil, biar nggak dobel di notification bell.
      if (notifiedThisRound) {
        await db.from('notifications').insert({
          user_id: userId,
          type: 'deadline_reminder',
          title: `Reminder: ${dl.course_name as string}`,
          message: `Deadline ${win.days === 0 ? 'hari ini' : `dalam ${win.days} hari`}: ${(dl.title as string | null) ?? (dl.course_name as string)}`,
          link: `/dashboard/deadlines/${dl.id as string}/edit`,
          related_deadline_id: dl.id,
        }).then(() => null, () => null)
      }
    }
  }

  console.log(
    `[Cron] Done — telegram sent=${totalSent} failed=${totalFailed} attempts=${totalAttempts} | push sent=${pushSent} failed=${pushFailed} removed=${pushRemoved} | whatsapp sent=${waSent} failed=${waFailed}`
  )
  return NextResponse.json({
    ok: true,
    date: dateStr,
    hour,
    telegram: { sent: totalSent, failed: totalFailed, attempted: totalAttempts },
    push: { enabled: pushEnabled, sent: pushSent, failed: pushFailed, removed_expired: pushRemoved },
    whatsapp: { enabled: waEnabled, sent: waSent, failed: waFailed },
  })
}
