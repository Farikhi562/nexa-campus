import 'server-only'

type ReminderType = 'h7' | 'h3' | 'h1' | 'day'

type DeadlineInfo = {
  title?: string | null
  course_name: string
  deadline_date: string
  deadline_time: string
  campus?: string | null
  room?: string | null
}

const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://campus.nexatechlabs.my.id').replace(/\/$/, '')

function formatDate(dateStr: string) {
  try {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTime(timeStr: string) {
  return (timeStr || '').slice(0, 5)
}

const TITLES: Record<ReminderType, string> = {
  h7: '📅 7 hari lagi',
  h3: '⚡ 3 hari lagi',
  h1: '⚠️ Besok deadline!',
  day: '🔴 Deadline hari ini!',
}

/**
 * Bangun payload notifikasi push (title/body/url) untuk 1 deadline + tipe reminder.
 * Mirip `buildReminderMessage` di lib/telegram.ts, tapi plain text untuk Web Push.
 */
export function buildPushPayload(type: ReminderType, d: DeadlineInfo) {
  const tanggal = formatDate(d.deadline_date)
  const jam = formatTime(d.deadline_time)
  const lokasi = [d.campus, d.room].filter(Boolean).join(' — ')

  const subject = d.title?.trim() || d.course_name

  const bodyLines = [
    `${d.course_name}${d.title ? ` — ${d.title}` : ''}`,
    `${tanggal}, ${jam} WIB`,
  ]
  if (lokasi) bodyLines.push(lokasi)

  return {
    title: `${TITLES[type]} — ${subject}`,
    body: bodyLines.join('\n'),
    url: '/dashboard',
    tag: `deadline-${type}`,
  }
}
