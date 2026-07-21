import { redirect } from 'next/navigation'
import FocusMode, { type FocusDeadline } from '@/components/dashboard/FocusMode'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Focus Mode · NEXA Campus',
  description: 'Timer Pomodoro yang terhubung ke deadline dan histori sesi fokus.',
}

function jakartaDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value)
}

export default async function FocusPage({ searchParams }: { searchParams?: { deadline?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const [deadlineResult, sessionResult, pointsResult] = await Promise.all([
    supabase
      .from('academic_deadlines')
      .select('id, title, course_name, deadline_date, deadline_time, estimated_minutes, progress_percent')
      .eq('user_id', user.id)
      .neq('status', 'completed')
      .order('deadline_date', { ascending: true })
      .order('deadline_time', { ascending: true })
      .limit(40),
    supabase
      .from('focus_sessions')
      .select('duration_minutes, completed_at')
      .eq('user_id', user.id)
      .gte('completed_at', sevenDaysAgo.toISOString())
      .order('completed_at', { ascending: true }),
    supabase
      .from('points_events')
      .select('ref, created_at')
      .eq('user_id', user.id)
      .eq('kind', 'focus_session')
      .gte('created_at', sevenDaysAgo.toISOString()),
  ])

  const focusSessions = sessionResult.error ? [] : (sessionResult.data ?? []) as Array<{ duration_minutes: number; completed_at: string }>
  const activeDates = new Set<string>()

  for (const row of focusSessions) activeDates.add(jakartaDate(new Date(row.completed_at)))
  if (activeDates.size === 0) {
    for (const row of pointsResult.data ?? []) {
      const ref = (row as { ref?: string | null }).ref
      activeDates.add(ref?.startsWith('focus-') ? ref.slice(6) : jakartaDate(new Date((row as { created_at: string }).created_at)))
    }
  }

  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sevenDaysAgo)
    date.setDate(date.getDate() + index)
    const key = jakartaDate(date)
    return { date: key, active: activeDates.has(key) }
  })

  const today = jakartaDate(now)
  const todayMinutes = focusSessions
    .filter((row) => jakartaDate(new Date(row.completed_at)) === today)
    .reduce((total, row) => total + Number(row.duration_minutes ?? 0), 0)
  const weekMinutes = focusSessions.reduce((total, row) => total + Number(row.duration_minutes ?? 0), 0)

  return (
    <FocusMode
      weekActivity={weekActivity}
      todayDone={activeDates.has(today)}
      deadlines={(deadlineResult.data ?? []) as FocusDeadline[]}
      initialDeadlineId={searchParams?.deadline ?? ''}
      todayMinutes={todayMinutes}
      weekMinutes={weekMinutes}
    />
  )
}
