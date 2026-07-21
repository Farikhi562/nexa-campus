import { redirect } from 'next/navigation'
import FocusMode, { type FocusDeadline } from '@/components/dashboard/FocusMode'
import FocusHeatmap, { type FocusHeatmapDay } from '@/components/dashboard/FocusHeatmap'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Focus Mode · NEXA Campus',
  description: 'Timer Pomodoro yang terhubung ke deadline, streak, dan histori sesi fokus.',
}

function jakartaDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value)
}

function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function calculateStreaks(days: FocusHeatmapDay[], today: string) {
  const active = new Set(days.filter((day) => day.minutes > 0).map((day) => day.date))
  const yesterday = shiftDate(today, -1)
  const recoveryStreak = !active.has(today) && active.has(yesterday)
  let cursor = recoveryStreak ? yesterday : today
  let currentStreak = 0
  while (active.has(cursor)) {
    currentStreak += 1
    cursor = shiftDate(cursor, -1)
  }

  let bestStreak = 0
  let running = 0
  for (const day of days) {
    if (day.minutes > 0) {
      running += 1
      bestStreak = Math.max(bestStreak, running)
    } else {
      running = 0
    }
  }
  return { currentStreak, bestStreak, recoveryStreak }
}

export default async function FocusPage({ searchParams }: { searchParams?: { deadline?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = jakartaDate()
  const heatmapStart = shiftDate(today, -83)
  const startIso = new Date(`${heatmapStart}T00:00:00+07:00`).toISOString()

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
      .gte('completed_at', startIso)
      .order('completed_at', { ascending: true }),
    supabase
      .from('points_events')
      .select('ref, created_at')
      .eq('user_id', user.id)
      .eq('kind', 'focus_session')
      .gte('created_at', startIso),
  ])

  const minutesByDate = new Map<string, number>()
  const sessions = sessionResult.error ? [] : (sessionResult.data ?? []) as Array<{ duration_minutes: number; completed_at: string }>
  for (const row of sessions) {
    const key = jakartaDate(new Date(row.completed_at))
    minutesByDate.set(key, (minutesByDate.get(key) ?? 0) + Number(row.duration_minutes ?? 0))
  }

  if (minutesByDate.size === 0) {
    for (const row of pointsResult.data ?? []) {
      const ref = (row as { ref?: string | null }).ref
      const key = ref?.startsWith('focus-') ? ref.slice(6) : jakartaDate(new Date((row as { created_at: string }).created_at))
      minutesByDate.set(key, Math.max(minutesByDate.get(key) ?? 0, 25))
    }
  }

  const heatmapDays: FocusHeatmapDay[] = Array.from({ length: 84 }, (_, index) => {
    const date = shiftDate(heatmapStart, index)
    return { date, minutes: minutesByDate.get(date) ?? 0 }
  })
  const weekDays = heatmapDays.slice(-7)
  const weekActivity = weekDays.map((day) => ({ date: day.date, active: day.minutes > 0 }))
  const todayMinutes = minutesByDate.get(today) ?? 0
  const weekMinutes = weekDays.reduce((sum, day) => sum + day.minutes, 0)
  const streaks = calculateStreaks(heatmapDays, today)

  return (
    <div className="space-y-5">
      <FocusMode
        weekActivity={weekActivity}
        todayDone={todayMinutes > 0}
        deadlines={(deadlineResult.data ?? []) as FocusDeadline[]}
        initialDeadlineId={searchParams?.deadline ?? ''}
        todayMinutes={todayMinutes}
        weekMinutes={weekMinutes}
      />
      <FocusHeatmap days={heatmapDays} {...streaks} />
    </div>
  )
}
