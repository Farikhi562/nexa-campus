import { differenceInCalendarDays, format, isBefore, parseISO } from 'date-fns'
import type { AcademicDeadline } from '@/types'
import { getTypeLabel } from '@/lib/nexa-data'

export function getDisplayTitle(deadline: Pick<AcademicDeadline, 'title' | 'type' | 'course_name'>) {
  const title = deadline.title?.trim()
  return title || `${getTypeLabel(deadline.type)} ${deadline.course_name}`
}

export function getDeadlineDateTime(deadline: Pick<AcademicDeadline, 'deadline_date' | 'deadline_time'>) {
  return parseISO(`${deadline.deadline_date}T${deadline.deadline_time}`)
}

export function getUrgency(deadline: Pick<AcademicDeadline, 'deadline_date' | 'deadline_time' | 'status'>) {
  const now = new Date()
  const due = getDeadlineDateTime(deadline)
  const days = differenceInCalendarDays(due, now)

  if (deadline.status === 'completed') return { label: 'Selesai', tone: 'success' as const, days }
  if (isBefore(due, now)) return { label: 'Terlambat', tone: 'danger' as const, days }
  if (days === 0) return { label: 'Hari ini', tone: 'danger' as const, days }
  if (days <= 1) return { label: 'H-1', tone: 'warning' as const, days }
  if (days <= 3) return { label: 'H-3', tone: 'warning' as const, days }
  if (days <= 7) return { label: 'H-7', tone: 'info' as const, days }
  return { label: format(due, 'd MMM'), tone: 'neutral' as const, days }
}

export function sortNearest(a: AcademicDeadline, b: AcademicDeadline) {
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
