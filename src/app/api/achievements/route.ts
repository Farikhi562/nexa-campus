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

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const [createdRes, completedRes, ontimeRes, referralRes, dailyCheckinRes, profileRes, rankRes, weeklyRankRes, monthlyRankRes, arenaApprovedRes, arenaCreatedRes] = await Promise.all([
    supabase.from('academic_deadlines').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('academic_deadlines').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
    supabase.from('points_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('kind', 'ontime_bonus'),
    supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id),
    supabase.from('daily_checkins').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('profiles').select('email, plan, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command, badges, founder_verified').eq('id', user.id).maybeSingle(),
    supabase.rpc('get_my_rank', { p_scope: 'all_time' }),
    supabase.rpc('get_my_rank', { p_scope: 'weekly' }),
    supabase.rpc('get_my_rank', { p_scope: 'monthly' }),
    supabase.from('nexa_arena_applications').select('id', { count: 'exact', head: true }).eq('applicant_id', user.id).eq('status', 'accepted'),
    supabase.from('nexa_arena_posts').select('id', { count: 'exact', head: true }).eq('creator_id', user.id),
  ])

  const profile = profileRes.data as Record<string, unknown> | null
  const founder = isFounderEmail(user.email) || Boolean(profile?.founder_verified)
  const plan = getEffectivePlan({ ...(profile ?? {}), email: user.email })
  const rank = Array.isArray(rankRes.data) && rankRes.data.length > 0 ? rankRes.data[0] : null

  const stats: AchievementStats = {
    created: createdRes.count ?? 0,
    completed: completedRes.count ?? 0,
    ontime: ontimeRes.count ?? 0,
    referrals: referralRes.count ?? 0,
    dailyCheckins: dailyCheckinRes.count ?? 0,
    arenaApproved: arenaApprovedRes.count ?? 0,
    arenaCreated: arenaCreatedRes.count ?? 0,
    weeklyRank: firstRank(weeklyRankRes.data),
    monthlyRank: firstRank(monthlyRankRes.data),
    streak: (rank?.current_streak as number) ?? 0,
    points: (rank?.points as number) ?? 0,
    isPremium: plan !== 'radar',
    plan,
    manualBadgeIds: founder ? BADGES.map((badge) => badge.id) : jsonBadges(profile?.badges),
    isFounder: founder,
  }

  return NextResponse.json({ stats })
}
