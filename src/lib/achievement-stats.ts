import 'server-only'
import { createServiceClient } from '@/lib/supabase/service'
import type { AchievementStats } from '@/lib/badges'
import { BADGES } from '@/lib/badges'
import { getEffectivePlan, isFounderEmail } from '@/lib/plans'

/**
 * Modul ini dibuat untuk fix bug: badge yang tampil di halaman Pencapaian
 * (dihitung LIVE dari stats asli via evaluateBadges()) berbeda dengan badge
 * yang tampil saat profil dilihat user lain (sebelumnya baca kolom
 * `profiles.badges` — yang TERNYATA tidak pernah ditulis UI manapun, selalu
 * kosong). Fix: hitung badge LIVE juga untuk profil yang sedang dilihat,
 * pakai logic yang SAMA PERSIS dengan /api/achievements (lihat README Batch
 * "Badge Consistency Fix").
 *
 * Pakai service-role client + RPC get_user_rank (baru, lihat
 * docs/MIGRATION_badge_consistency_fix.sql) karena points_events tidak bisa
 * dibaca lintas-user lewat RLS biasa (benar, sudah diperketat di Batch 9).
 * Privasi profil TETAP digerbang di pemanggil (app/api/profile/[id]/route.ts
 * dan app/api/profile/me/route.ts) — modul ini murni alat hitung.
 */

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
  if (month === 0) { month = 12; year -= 1 }
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
    while (cursor && keys.has(cursor)) { count += 1; cursor = previousMonthKey(cursor) }
    best = Math.max(best, count)
  }
  return best
}

type RankRow = { points: number; rank: number | null; current_streak: number } | null

async function getRank(
  db: ReturnType<typeof createServiceClient>,
  userId: string,
  scope: 'all_time' | 'weekly' | 'monthly'
): Promise<RankRow> {
  const { data, error } = await db.rpc('get_user_rank', { p_user_id: userId, p_scope: scope })
  if (error || !Array.isArray(data) || data.length === 0) return null
  return data[0] as RankRow
}

/**
 * Hitung AchievementStats lengkap untuk SATU user (bisa diri sendiri atau
 * user lain — privasi sudah harus digerbang oleh pemanggil sebelum sampai
 * di sini). Dipakai oleh /api/achievements (diri sendiri) DAN
 * /api/profile/[id], /api/profile/me (untuk badge di profil publik).
 */
export async function getAchievementStatsFor(userId: string, userEmail?: string | null): Promise<AchievementStats> {
  const db = createServiceClient()

  const [
    createdRes, completedRes, ontimeRes, referralRes, dailyCheckinRes,
    profileRes, allTimeRank, weeklyRank, monthlyRank,
    monthlyWinnersRes, arenaApprovedRes, arenaCreatedRes,
  ] = await Promise.all([
    db.from('academic_deadlines').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    db.from('academic_deadlines').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed'),
    db.from('points_events').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('kind', 'ontime_bonus'),
    db.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', userId),
    db.from('daily_checkins').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    db.from('profiles').select('plan, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command, badges, founder_verified').eq('id', userId).maybeSingle(),
    getRank(db, userId, 'all_time'),
    getRank(db, userId, 'weekly'),
    getRank(db, userId, 'monthly'),
    db.from('leaderboard_monthly_winners').select('month_key, rank').eq('user_id', userId).eq('rank', 1).order('month_key', { ascending: false }).limit(24),
    db.from('nexa_arena_applications').select('id', { count: 'exact', head: true }).eq('applicant_id', userId).eq('status', 'accepted'),
    db.from('nexa_arena_posts').select('id', { count: 'exact', head: true }).eq('creator_id', userId),
  ])

  const profile = profileRes.data as Record<string, unknown> | null
  const founder = (userEmail ? isFounderEmail(userEmail) : false) || Boolean(profile?.founder_verified)
  const plan = getEffectivePlan({ ...(profile ?? {}), email: userEmail ?? undefined })
  const planExpiry = profile?.plan_expires_at ?? profile?.subscription_expires_at ?? null
  const commandExpiry = profile?.command_expires_at ?? profile?.subscription_expires_at ?? profile?.plan_expires_at ?? null
  const monthlyRankValue = monthlyRank?.rank ?? null

  return {
    created: createdRes.count ?? 0,
    completed: completedRes.count ?? 0,
    ontime: ontimeRes.count ?? 0,
    referrals: referralRes.count ?? 0,
    dailyCheckins: dailyCheckinRes.count ?? 0,
    arenaApproved: arenaApprovedRes.count ?? 0,
    arenaCreated: arenaCreatedRes.count ?? 0,
    weeklyRank: weeklyRank?.rank ?? null,
    monthlyRank: monthlyRankValue,
    pulseMonths: plan === 'pulse' ? monthsUntil(planExpiry) : 0,
    commandMonths: plan === 'command' ? monthsUntil(commandExpiry) : 0,
    monthlyTopOneStreak: consecutiveMonthlyTopOne(monthlyWinnersRes.data, monthlyRankValue === 1),
    streak: allTimeRank?.current_streak ?? 0,
    points: allTimeRank?.points ?? 0,
    isPremium: plan !== 'radar',
    plan,
    manualBadgeIds: founder ? BADGES.map((badge) => badge.id) : (Array.isArray(profile?.badges) ? (profile?.badges as string[]) : []),
    isFounder: founder,
  }
}
