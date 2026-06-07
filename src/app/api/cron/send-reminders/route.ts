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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  return `${h?.padStart(2, '0')}:${m?.padStart(2, '0')} WIB`
}

function buildEmailHtml(params: {
  userName: string
  title: string
  courseName: string
  deadlineDate: string
  deadlineTime: string
  reminderType: ReminderType
  siteUrl: string
}): string {
  const { userName, title, courseName, deadlineDate, deadlineTime, reminderType, siteUrl } = params
  const urgencyLabel = reminderType === 'day' ? '🔴 HARI INI' :
    reminderType === 'h1' ? '🟡 BESOK' :
    reminderType === 'h3' ? '🟠 3 Hari Lagi' : '🟢 7 Hari Lagi'

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reminder Deadline</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;font-size:20px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">NEXA Campus</p>
                    <p style="margin:4px 0 0;font-size:11px;font-weight:700;color:#2dd4bf;letter-spacing:2px;text-transform:uppercase;">Deadline Radar</p>
                  </td>
                  <td align="right">
                    <span style="display:inline-block;background:#dc2626;color:#ffffff;font-size:11px;font-weight:900;padding:6px 14px;border-radius:99px;">${urgencyLabel}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:15px;color:#64748b;">Hei, <strong>${userName}</strong> 👋</p>
              <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
                Ini reminder dari NEXA Campus. Deadline kamu segera tiba!
              </p>

              <!-- Deadline Card -->
              <div style="background:#f1f5f9;border-radius:16px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #0f766e;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0f766e;text-transform:uppercase;letter-spacing:1px;">Mata Kuliah</p>
                <p style="margin:0 0 12px;font-size:18px;font-weight:900;color:#0f172a;">${courseName}</p>
                ${title ? `<p style="margin:0 0 12px;font-size:14px;color:#475569;">${title}</p>` : ''}
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding-right:16px;">
                      <p style="margin:0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Tanggal</p>
                      <p style="margin:4px 0 0;font-size:14px;font-weight:800;color:#0f172a;">${formatDate(deadlineDate)}</p>
                    </td>
                    <td>
                      <p style="margin:0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;">Jam</p>
                      <p style="margin:4px 0 0;font-size:14px;font-weight:800;color:#0f172a;">${formatTime(deadlineTime)}</p>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}/dashboard"
                       style="display:inline-block;background:#0f766e;color:#ffffff;font-size:15px;font-weight:900;text-decoration:none;padding:14px 32px;border-radius:14px;letter-spacing:-0.2px;">
                      Lihat Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;">
                Kamu menerima email ini karena mengaktifkan reminder di NEXA Campus.<br/>
                <a href="${siteUrl}/dashboard/settings/reminders" style="color:#0f766e;text-decoration:none;">Kelola preferensi reminder</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

async function sendEmailViaResend(params: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not set' }

  const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'NEXA Campus <reminder@nexatechlabs.my.id>'

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    })
    if (!res.ok) {
      const body = await res.text()
      return { ok: false, error: body }
    }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
}

const WINDOWS: Array<{
  days: number
  type: ReminderType
  enabledField: 'h7_enabled' | 'h3_enabled' | 'h1_enabled' | 'day_enabled'
}> = [
  { days: 7, type: 'h7', enabledField: 'h7_enabled' },
  { days: 3, type: 'h3', enabledField: 'h3_enabled' },
  { days: 1, type: 'h1', enabledField: 'h1_enabled' },
  { days: 0, type: 'day', enabledField: 'day_enabled' },
]

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://campus.nexatechlabs.my.id'

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

    // Only email channels for H-1 and H-0 (most urgent)
    const shouldEmail = win.days <= 1

    const { data: deadlines, error: dErr } = await db
      .from('academic_deadlines')
      .select('id, title, course_name, deadline_date, deadline_time, campus, room, user_id')
      .eq('deadline_date', targetDate)
      .eq('reminder_enabled', true)
      .in('status', ['pending', 'in_progress'])

    if (dErr || !deadlines?.length) continue

    const userIds = Array.from(new Set(deadlines.map((d) => d.user_id as string)))

    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, email, telegram_chat_id')
      .in('id', userIds)

    const { data: prefs } = await db
      .from('reminder_preferences')
      .select('user_id, channel, reminder_time, h7_enabled, h3_enabled, h1_enabled, day_enabled')
      .in('user_id', userIds)

    const profileMap = new Map(
      (profiles ?? []).map((p: Record<string, unknown>) => [p.id as string, p])
    )
    const prefByUser = new Map<string, Record<string, unknown>[]>()
    for (const pref of prefs ?? []) {
      const uid = pref.user_id as string
      if (!prefByUser.has(uid)) prefByUser.set(uid, [])
      prefByUser.get(uid)!.push(pref as Record<string, unknown>)
    }

    for (const dl of deadlines) {
      const profile = profileMap.get(dl.user_id as string)
      if (!profile) continue

      const userPrefs = prefByUser.get(dl.user_id as string) ?? []

      for (const pref of userPrefs) {
        if (!pref[win.enabledField]) continue

        const reminderHour = parseInt((pref.reminder_time as string).slice(0, 2), 10)
        if (reminderHour !== hour) continue

        const channel = pref.channel as string
        totalAttempts++

        // Dedup check
        const { data: existing } = await db
          .from('reminder_logs')
          .select('id')
          .eq('deadline_id', dl.id as string)
          .eq('channel', channel)
          .eq('reminder_type', win.type)
          .eq('status', 'sent')
          .maybeSingle()

        if (existing) continue

        let sent = false
        let providerError: string | undefined

        if (channel === 'telegram') {
          const chatId = profile.telegram_chat_id as string
          if (chatId?.trim()) {
            const text = buildReminderMessage(win.type, {
              title: dl.title as string | null,
              course_name: dl.course_name as string,
              deadline_date: dl.deadline_date as string,
              deadline_time: dl.deadline_time as string,
              campus: dl.campus as string,
              room: dl.room as string,
            })
            const result = await sendTelegramMessage(chatId.trim(), text)
            sent = result.ok
            providerError = result.error
          }
        } else if (channel === 'email' || (shouldEmail && channel === 'telegram')) {
          // Also send email for urgent reminders if email is available
          const email = profile.email as string
          if (email?.includes('@')) {
            const userName = (profile.full_name as string) || email.split('@')[0]!
            const subject =
              win.days === 0
                ? `🔴 Deadline Hari Ini: ${dl.course_name as string}`
                : `⚠️ Deadline Besok: ${dl.course_name as string}`

            const html = buildEmailHtml({
              userName,
              title: dl.title as string | null ?? '',
              courseName: dl.course_name as string,
              deadlineDate: dl.deadline_date as string,
              deadlineTime: dl.deadline_time as string,
              reminderType: win.type,
              siteUrl,
            })

            const result = await sendEmailViaResend({ to: email, subject, html })
            sent = result.ok
            providerError = result.error

            // Don't double-count this as a separate attempt if it's bonus email
            if (channel !== 'email') { /* bonus, don't alter totalAttempts */ }
          }
        }

        const logChannel = channel
        if (sent) {
          await db.from('reminder_logs').insert({
            user_id: dl.user_id,
            deadline_id: dl.id,
            channel: logChannel,
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
            channel: logChannel,
            reminder_type: win.type,
            status: 'failed',
            provider_message: providerError,
          }).then(() => null, () => null)
          totalFailed++
        }
      }
    }
  }

  console.log(`[Cron] Done — sent=${totalSent} failed=${totalFailed} attempts=${totalAttempts}`)
  return NextResponse.json({
    ok: true,
    date: dateStr,
    hour,
    sent: totalSent,
    failed: totalFailed,
    attempted: totalAttempts,
  })
}
