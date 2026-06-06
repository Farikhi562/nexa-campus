import { differenceInCalendarDays, isBefore, parseISO } from 'date-fns'
import type { AcademicDeadline } from '@/types'
import { getTypeLabel } from '@/lib/nexa-data'

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

export function getDisplayTitle(deadline: Pick<AcademicDeadline, 'title' | 'type' | 'course_name'>) {
  const title = deadline.title?.trim()
  return title || `${getTypeLabel(deadline.type)} ${deadline.course_name}`
}

export function getDeadlineDateTime(deadline: Pick<AcademicDeadline, 'deadline_date' | 'deadline_time'>) {
  return parseISO(`${deadline.deadline_date}T${deadline.deadline_time}`)
}

export function formatDeadlineDate(deadline: Pick<AcademicDeadline, 'deadline_date' | 'deadline_time'>) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(getDeadlineDateTime(deadline))
}

export function formatDeadlineTime(deadline: Pick<AcademicDeadline, 'deadline_time'>) {
  return deadline.deadline_time.slice(0, 5)
}

export function getUrgency(deadline: Pick<AcademicDeadline, 'deadline_date' | 'deadline_time' | 'status'>) {
  const now = new Date()
  const due = getDeadlineDateTime(deadline)
  const days = differenceInCalendarDays(due, now)

  if (deadline.status === 'completed') return { label: 'Selesai', tone: 'success' as BadgeTone, days }
  if (isBefore(due, now)) return { label: 'Terlambat', tone: 'danger' as BadgeTone, days }
  if (days === 0) return { label: 'Hari ini', tone: 'danger' as BadgeTone, days }
  if (days <= 1) return { label: 'H-1', tone: 'warning' as BadgeTone, days }
  if (days <= 3) return { label: 'H-3', tone: 'warning' as BadgeTone, days }
  if (days <= 7) return { label: 'H-7', tone: 'info' as BadgeTone, days }
  if (days <= 14) return { label: 'Minggu ini', tone: 'info' as BadgeTone, days }
  return { label: 'Nanti', tone: 'neutral' as BadgeTone, days }
}

export function sortNearest(a: AcademicDeadline, b: AcademicDeadline) {
  if (a.status === 'completed' && b.status !== 'completed') return 1
  if (a.status !== 'completed' && b.status === 'completed') return -1
  return getDeadlineDateTime(a).getTime() - getDeadlineDateTime(b).getTime()
}

export function countDashboardStats(deadlines: AcademicDeadline[]) {
  const today = new Date()
  return deadlines.reduce(
    (acc, deadline) => {
      const urgency = getUrgency(deadline)
      const active = deadline.status !== 'completed'
      if (!active) return acc

      if (urgency.days === 0 && urgency.label !== 'Terlambat') acc.today += 1
      if (urgency.days >= 0 && urgency.days <= 7) acc.week += 1
      if (getDeadlineDateTime(deadline).getTime() < today.getTime()) acc.overdue += 1
      if (!deadline.reminder_enabled) acc.noReminder += 1
      return acc
    },
    { today: 0, week: 0, overdue: 0, noReminder: 0 }
  )
}

export function getPriorityTone(priority: AcademicDeadline['priority']) {
  if (priority === 'urgent') return 'danger' as const
  if (priority === 'high') return 'warning' as const
  if (priority === 'low') return 'neutral' as const
  return 'info' as const
}

export function getStatusTone(status: AcademicDeadline['status']) {
  if (status === 'completed') return 'success' as const
  if (status === 'overdue') return 'danger' as const
  if (status === 'in_progress') return 'info' as const
  return 'neutral' as const
}
