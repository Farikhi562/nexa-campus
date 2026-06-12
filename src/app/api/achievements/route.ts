import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BADGES, type AchievementStats } from '@/lib/badges'
import { getEffectivePlan, isFounderEmail } from '@/lib/plans'

function jsonBadges(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean)
  return []
}

function firstRank(data: unknown): number | null {
  if (!Array.isArray(data) || data.length === 0) return null
  const rank = Number((data[0] as { rank?: unknown }).rank)
  return Number.isFinite(rank) ? rank : null
}

function monthsUntil(value: unknown): number {
  if (typeof value !== 'string' || !value) return 0
  const end = new Date(value).getTime()
  if (!Number.isFinite(end) || end <= Date.now()) return 0
  return Math.max(0, Math.floor((end - Date.now()) / (1000 * 60 * 60 * 24 * 30)))
}

function currentMonthKey() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

function normalizeMonthKey(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = value.match(/^(\d{4})-(\d{2})/)
  if (!match) return null
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return `${match[1]}-${match[2]}`
}

function previousMonthKey(value: string) {
  const [yearRaw, monthRaw] = value.split('-')
  let year = Number(yearRaw)
  let month = Number(monthRaw)
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null
  month -= 1
  if (month === 0) {
    month = 12
    year -= 1
  }
  return `${year}-${String(month).padStart(2, '0')}`
}

function monthKeyScore(value: string) {
  const [year, month] = value.split('-').map(Number)
  return year * 12 + month
}

function consecutiveMonthlyTopOne(rows: unknown, includeCurrentMonth: boolean) {
  const keys = new Set<string>()
  if (Array.isArray(rows)) {
    for (const row of rows) {
      const item = row as { month_key?: unknown; rank?: unknown }
      const rank = Number(item.rank ?? 1)
      const key = normalizeMonthKey(item.month_key)
      if (key && (!Number.isFinite(rank) || rank === 1)) keys.add(key)
    }
  }
  if (includeCurrentMonth) keys.add(currentMonthKey())

  const sorted = Array.from(keys).sort((a, b) => monthKeyScore(b) - monthKeyScore(a))
  let best = 0
  for (const start of sorted) {
    let count = 0
    let cursor: string | null = start
    while (cursor && keys.has(cursor)) {
      count += 1
      cursor = previousMonthKey(cursor)
    }
    best = Math.max(best, count)
  }
  return best
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const [createdRes, completedRes, ontimeRes, referralRes, dailyCheckinRes, profileRes, rankRes, weeklyRankRes, monthlyRankRes, monthlyWinnersRes, arenaApprovedRes, arenaCreatedRes] = await Promise.all([
    supabase.from('academic_deadlines').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('academic_deadlines').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
    supabase.from('points_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('kind', 'ontime_bonus'),
    supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id),
    supabase.from('daily_checkins').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('profiles').select('email, plan, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command, badges, founder_verified').eq('id', user.id).maybeSingle(),
    supabase.rpc('get_my_rank', { p_scope: 'all_time' }),
    supabase.rpc('get_my_rank', { p_scope: 'weekly' }),
    supabase.rpc('get_my_rank', { p_scope: 'monthly' }),
    supabase.from('leaderboard_monthly_winners').select('month_key, rank').eq('user_id', user.id).eq('rank', 1).order('month_key', { ascending: false }).limit(24),
    supabase.from('nexa_arena_applications').select('id', { count: 'exact', head: true }).eq('applicant_id', user.id).eq('status', 'accepted'),
    supabase.from('nexa_arena_posts').select('id', { count: 'exact', head: true }).eq('creator_id', user.id),
  ])

  const profile = profileRes.data as Record<string, unknown> | null
  const founder = isFounderEmail(user.email) || Boolean(profile?.founder_verified)
  const plan = getEffectivePlan({ ...(profile ?? {}), email: user.email })
  const rank = Array.isArray(rankRes.data) && rankRes.data.length > 0 ? rankRes.data[0] : null
  const monthlyRank = firstRank(monthlyRankRes.data)
  const planExpiry = profile?.plan_expires_at ?? profile?.subscription_expires_at ?? null
  const commandExpiry = profile?.command_expires_at ?? profile?.subscription_expires_at ?? profile?.plan_expires_at ?? null

  const stats: AchievementStats = {
    created: createdRes.count ?? 0,
    completed: completedRes.count ?? 0,
    ontime: ontimeRes.count ?? 0,
    referrals: referralRes.count ?? 0,
    dailyCheckins: dailyCheckinRes.count ?? 0,
    arenaApproved: arenaApprovedRes.count ?? 0,
    arenaCreated: arenaCreatedRes.count ?? 0,
    weeklyRank: firstRank(weeklyRankRes.data),
    monthlyRank,
    pulseMonths: plan === 'pulse' ? monthsUntil(planExpiry) : 0,
    commandMonths: plan === 'command' ? monthsUntil(commandExpiry) : 0,
    monthlyTopOneStreak: consecutiveMonthlyTopOne(monthlyWinnersRes.data, monthlyRank === 1),
    streak: (rank?.current_streak as number) ?? 0,
    points: (rank?.points as number) ?? 0,
    isPremium: plan !== 'radar',
    plan,
    manualBadgeIds: founder ? BADGES.map((badge) => badge.id) : jsonBadges(profile?.badges),
    isFounder: founder,
  }

  return NextResponse.json({ stats })
}
