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
  checkout_mood?: DailyMood | null
  checkout_note?: string | null
  goal_completed?: boolean | null
  checked_out_at?: string | null
  created_at: string
  updated_at: string
}

const validMoods = new Set<DailyMood>(['semangat', 'normal', 'capek', 'tertekan'])

function getJakartaDateString(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
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
    supabase.from('daily_checkins').select('*').eq('user_id', userId).eq('activity_date', today).maybeSingle(),
    supabase.from('daily_checkins').select('*').eq('user_id', userId).order('activity_date', { ascending: false }).limit(60),
    supabase.from('academic_deadlines').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('deadline_date', today).eq('status', 'completed'),
    supabase.from('academic_deadlines').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('deadline_date', today).neq('status', 'completed'),
    supabase.from('points_events').select('points').eq('user_id', userId).eq('ref', `daily_checkin:${today}`),
  ])

  if (todayCheckinRes.error) throw todayCheckinRes.error
  if (recentCheckinsRes.error) throw recentCheckinsRes.error

  const row = todayCheckinRes.data as DailyCheckinRow | null
  const recentRows = (recentCheckinsRes.data ?? []) as DailyCheckinRow[]
  const pointsToday = (pointsTodayRes.data ?? []).reduce((total: number, item: { points?: number | null }) => total + (item.points ?? 0), 0)

  return {
    checkedIn: Boolean(row),
    checkedOut: Boolean(row?.checked_out_at),
    activityDate: today,
    mood: row?.mood ?? null,
    focusGoal: row?.focus_goal ?? null,
    checkinNote: row?.checkin_note ?? null,
    checkoutMood: row?.checkout_mood ?? null,
    checkoutNote: row?.checkout_note ?? null,
    goalCompleted: row?.goal_completed ?? null,
    checkedOutAt: row?.checked_out_at ?? null,
    pointsAwarded: row?.points_awarded ?? 0,
    currentStreak: countCurrentStreak(recentRows),
    totalCheckins: recentRows.length,
    completedToday: completedTodayRes.count ?? 0,
    pendingToday: pendingTodayRes.count ?? 0,
    pointsToday,
    recentDays: recentRows.slice(0, 7).reverse().map((item) => ({
      activityDate: item.activity_date,
      mood: item.mood ?? null,
      checkoutMood: item.checkout_mood ?? null,
      goalCompleted: item.goal_completed ?? null,
      checkedOut: Boolean(item.checked_out_at),
    })),
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  try {
    return NextResponse.json({ data: await buildDailyPulse(supabase, user.id) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Daily Pulse gagal dimuat.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    mode?: unknown
    mood?: unknown
    focusGoal?: unknown
    checkinNote?: unknown
    checkoutMood?: unknown
    checkoutNote?: unknown
    goalCompleted?: unknown
  }

  const today = getJakartaDateString()
  const mode = body.mode === 'checkout' ? 'checkout' : 'checkin'

  if (mode === 'checkout') {
    const checkoutMood = typeof body.checkoutMood === 'string' && validMoods.has(body.checkoutMood as DailyMood)
      ? body.checkoutMood as DailyMood
      : 'normal'
    const checkoutNote = typeof body.checkoutNote === 'string' ? body.checkoutNote.trim().slice(0, 240) : ''
    const goalCompleted = body.goalCompleted === true

    const { data, error } = await supabase
      .from('daily_checkins')
      .update({
        checkout_mood: checkoutMood,
        checkout_note: checkoutNote || null,
        goal_completed: goalCompleted,
        checked_out_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('activity_date', today)
      .select('id')
      .maybeSingle()

    if (error) {
      const migrationHint = error.message.toLowerCase().includes('checkout_')
        ? ' Jalankan migration 20260721_productivity_depth.sql dulu.'
        : ''
      return NextResponse.json({ error: `${error.message}${migrationHint}` }, { status: 500 })
    }
    if (!data) return NextResponse.json({ error: 'Check-in pagi dulu sebelum menutup hari.' }, { status: 400 })
  } else {
    const mood = typeof body.mood === 'string' && validMoods.has(body.mood as DailyMood) ? body.mood as DailyMood : 'normal'
    const focusGoal = typeof body.focusGoal === 'string' && body.focusGoal.trim().length > 0
      ? body.focusGoal.trim().slice(0, 120)
      : 'Beresin 1 deadline paling dekat'
    const checkinNote = typeof body.checkinNote === 'string' ? body.checkinNote.trim().slice(0, 180) : ''
    const pointsAwarded = 3

    const { error } = await supabase
      .from('daily_checkins')
      .upsert({
        user_id: user.id,
        activity_date: today,
        mood,
        focus_goal: focusGoal,
        checkin_note: checkinNote || null,
        points_awarded: pointsAwarded,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,activity_date' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await supabase.rpc('award_points', { p_kind: 'daily_checkin', p_ref: `daily_checkin:${today}` })
  }

  try {
    return NextResponse.json({ data: await buildDailyPulse(supabase, user.id) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Daily Pulse tersimpan, tapi gagal dimuat ulang.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
