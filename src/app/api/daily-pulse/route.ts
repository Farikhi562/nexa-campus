import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type DailyMood = 'semangat' | 'normal' | 'capek' | 'tertekan'

type DailyCheckinRow = {
  id: string
  user_id: string
  activity_date: string
  mood: DailyMood | null
  focus_goal: string | null
  checkin_note: string | null
  points_awarded: number | null
  created_at: string
  updated_at: string
}

const validMoods = new Set<DailyMood>(['semangat', 'normal', 'capek', 'tertekan'])

function getJakartaDateString(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(date)
}

function previousDateString(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

function countCurrentStreak(rows: Array<Pick<DailyCheckinRow, 'activity_date'>>) {
  const dates = new Set(rows.map((row) => row.activity_date))
  let cursor = getJakartaDateString()
  let streak = 0

  while (dates.has(cursor)) {
    streak += 1
    cursor = previousDateString(cursor)
  }

  return streak
}

async function buildDailyPulse(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const today = getJakartaDateString()

  const [todayCheckinRes, recentCheckinsRes, completedTodayRes, pendingTodayRes, pointsTodayRes] = await Promise.all([
    supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_date', today)
      .maybeSingle(),
    supabase
      .from('daily_checkins')
      .select('activity_date')
      .eq('user_id', userId)
      .order('activity_date', { ascending: false })
      .limit(60),
    supabase
      .from('academic_deadlines')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('deadline_date', today)
      .eq('status', 'completed'),
    supabase
      .from('academic_deadlines')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('deadline_date', today)
      .neq('status', 'completed'),
    supabase
      .from('points_events')
      .select('points')
      .eq('user_id', userId)
      .eq('ref', `daily_checkin:${today}`),
  ])

  if (todayCheckinRes.error) throw todayCheckinRes.error
  if (recentCheckinsRes.error) throw recentCheckinsRes.error

  const row = todayCheckinRes.data as DailyCheckinRow | null
  const pointsToday = (pointsTodayRes.data ?? []).reduce((total: number, item: { points?: number | null }) => total + (item.points ?? 0), 0)

  return {
    checkedIn: Boolean(row),
    activityDate: today,
    mood: row?.mood ?? null,
    focusGoal: row?.focus_goal ?? null,
    checkinNote: row?.checkin_note ?? null,
    pointsAwarded: row?.points_awarded ?? 0,
    currentStreak: countCurrentStreak((recentCheckinsRes.data ?? []) as Array<Pick<DailyCheckinRow, 'activity_date'>>),
    totalCheckins: (recentCheckinsRes.data ?? []).length,
    completedToday: completedTodayRes.count ?? 0,
    pendingToday: pendingTodayRes.count ?? 0,
    pointsToday,
  }
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  try {
    const data = await buildDailyPulse(supabase, user.id)
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Daily Pulse gagal dimuat.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: { mood?: unknown; focusGoal?: unknown; checkinNote?: unknown } = {}
  try {
    body = await request.json()
  } catch {
    body = {}
  }

  const mood = typeof body.mood === 'string' && validMoods.has(body.mood as DailyMood)
    ? body.mood as DailyMood
    : 'normal'
  const focusGoal = typeof body.focusGoal === 'string' && body.focusGoal.trim().length > 0
    ? body.focusGoal.trim().slice(0, 120)
    : 'Beresin 1 deadline paling dekat'
  const checkinNote = typeof body.checkinNote === 'string'
    ? body.checkinNote.trim().slice(0, 180)
    : ''

  const today = getJakartaDateString()
  const pointsAwarded = 3

  const { error: upsertError } = await supabase
    .from('daily_checkins')
    .upsert(
      {
        user_id: user.id,
        activity_date: today,
        mood,
        focus_goal: focusGoal,
        checkin_note: checkinNote || null,
        points_awarded: pointsAwarded,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,activity_date' }
    )

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  await supabase.rpc('award_points', {
    p_kind: 'daily_checkin',
    p_ref: `daily_checkin:${today}`,
  })

  try {
    const data = await buildDailyPulse(supabase, user.id)
    return NextResponse.json({ data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Daily Pulse tersimpan, tapi gagal dimuat ulang.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
