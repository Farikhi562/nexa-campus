import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/notifications/notify-user'

export const runtime = 'nodejs'

function authOk(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = request.headers.get('authorization')
  const query = request.nextUrl.searchParams.get('secret')
  return header === `Bearer ${secret}` || query === secret
}

function isoDatePlus(days: number) {
  const date = new Date()
  const jakarta = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  jakarta.setDate(jakarta.getDate() + days)
  return jakarta.toISOString().slice(0, 10)
}

type DeadlineRow = {
  id: string
  user_id: string
  title: string | null
  course_name: string | null
  deadline_date: string | null
  deadline_time: string | null
  priority: string | null
  status: string | null
}

function groupByUser(rows: DeadlineRow[]) {
  return rows.reduce<Record<string, DeadlineRow[]>>((acc, row) => {
    if (!row.user_id) return acc
    acc[row.user_id] ||= []
    acc[row.user_id].push(row)
    return acc
  }, {})
}

function formatDeadline(row: DeadlineRow) {
  const course = row.course_name ? ` (${row.course_name})` : ''
  const time = row.deadline_time ? ` jam ${row.deadline_time}` : ''
  return `• ${row.title || 'Deadline tanpa judul'}${course}${time}`
}

export async function GET(request: NextRequest) {
  if (!authOk(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = isoDatePlus(0)
  const tomorrow = isoDatePlus(1)

  const { data: rows, error } = await supabase
    .from('academic_deadlines')
    .select('id,user_id,title,course_name,deadline_date,deadline_time,priority,status')
    .in('deadline_date', [today, tomorrow])
    .neq('status', 'done')
    .limit(500)

  if (error) {
    console.error('[nexa-engagement] query failed', error)
    return NextResponse.json({ error: 'Failed to query deadlines' }, { status: 500 })
  }

  const byUser = groupByUser((rows ?? []) as DeadlineRow[])
  let sent = 0

  for (const [userId, deadlines] of Object.entries(byUser)) {
    const todayItems = deadlines.filter((item) => item.deadline_date === today)
    const tomorrowItems = deadlines.filter((item) => item.deadline_date === tomorrow)

    if (todayItems.length > 0) {
      await notifyUser({
        supabase,
        userId,
        type: 'daily_deadline_digest',
        title: 'Deadline hari ini, jangan pura-pura amnesia 🫠',
        body: [
          `Ada ${todayItems.length} deadline hari ini:`,
          ...todayItems.slice(0, 5).map(formatDeadline),
          '',
          'Buka NEXA Campus buat atur prioritas. Aplikasi udah dibuat, masa dicuekin kayak mantan.',
        ].join('\n'),
        url: '/dashboard/deadlines',
        dedupeKey: `daily_deadline_digest:${userId}:${today}`,
        channels: ['in_app', 'telegram'],
        metadata: { date: today, deadline_ids: todayItems.map((item) => item.id) },
      })
      sent += 1
    }

    if (tomorrowItems.length > 0) {
      await notifyUser({
        supabase,
        userId,
        type: 'tomorrow_deadline_nudge',
        title: 'Besok ada deadline, cicil sekarang lah 😭',
        body: [
          `Besok ada ${tomorrowItems.length} deadline:`,
          ...tomorrowItems.slice(0, 5).map(formatDeadline),
          '',
          'Mending cek dari sekarang daripada panik jam 23:47 seperti tradisi akademik manusia.',
        ].join('\n'),
        url: '/dashboard/deadlines',
        dedupeKey: `tomorrow_deadline_nudge:${userId}:${tomorrow}`,
        channels: ['in_app', 'telegram'],
        metadata: { date: tomorrow, deadline_ids: tomorrowItems.map((item) => item.id) },
      })
      sent += 1
    }
  }

  return NextResponse.json({ ok: true, users_notified: sent, today, tomorrow })
}
