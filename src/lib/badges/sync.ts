import { ALL_BADGE_KEYS } from './catalog'
import { autoBadgesForPlan, isOwnerEmail } from './owner'

type AnyClient = any

type SyncBadgeArgs = {
  admin: AnyClient
  user: { id: string; email?: string | null }
  profile?: Record<string, any> | null
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000
const YEAR_MS = 365 * 24 * 60 * 60 * 1000

function safeNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function dateAgeMs(value?: string | null) {
  if (!value) return 0
  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return 0
  return Date.now() - time
}

async function safeRows<T = any>(queryBuilder: any): Promise<T[]> {
  try {
    const { data, error } = await queryBuilder
    if (error) return []
    return (data || []) as T[]
  } catch {
    return []
  }
}

async function safeCount(admin: AnyClient, table: string, column: string, value: string) {
  try {
    const { count, error } = await admin.from(table).select('id', { count: 'exact', head: true }).eq(column, value)
    if (error) return 0
    return count || 0
  } catch {
    return 0
  }
}

async function safeCountByFilter(admin: AnyClient, table: string, filters: Array<[string, string, any]>) {
  try {
    let q = admin.from(table).select('id', { count: 'exact', head: true })
    for (const [method, column, value] of filters) {
      if (method === 'eq') q = q.eq(column, value)
      if (method === 'gte') q = q.gte(column, value)
      if (method === 'lte') q = q.lte(column, value)
    }
    const { count, error } = await q
    if (error) return 0
    return count || 0
  } catch {
    return 0
  }
}

async function getProgressMap(admin: AnyClient, userId: string) {
  const rows = await safeRows<{ metric_key: string; metric_value: number }>(
    admin.from('nexa_badge_progress').select('metric_key,metric_value').eq('user_id', userId)
  )
  return rows.reduce<Record<string, number>>((acc, item) => {
    acc[item.metric_key] = Math.max(acc[item.metric_key] || 0, safeNumber(item.metric_value))
    return acc
  }, {})
}

async function getApprovedOrders(admin: AnyClient, userId: string) {
  return safeRows<{ plan?: string | null; approved_at?: string | null; created_at?: string | null }>(
    admin
      .from('manual_payment_orders')
      .select('plan,approved_at,created_at,status')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .limit(1000)
  )
}

async function getDeadlineCount(admin: AnyClient, userId: string, progress: Record<string, number>) {
  const possibleCounts = await Promise.all([
    safeCount(admin, 'academic_deadlines', 'user_id', userId),
    safeCount(admin, 'academic_deadlines', 'owner_id', userId),
    safeCount(admin, 'deadlines', 'user_id', userId),
    safeCount(admin, 'deadline_items', 'user_id', userId),
  ])
  return Math.max(progress.deadline_total || 0, progress.deadlines_created || 0, ...possibleCounts)
}

async function getReferralCount(admin: AnyClient, userId: string, profile: Record<string, any> | null | undefined, progress: Record<string, number>) {
  const referralCode = String(profile?.referral_code || profile?.nexa_id || '').trim()
  const possibleCounts = await Promise.all([
    safeCount(admin, 'profiles', 'referred_by', userId),
    safeCount(admin, 'profiles', 'referrer_id', userId),
    safeCount(admin, 'profiles', 'referred_by_user_id', userId),
    referralCode ? safeCount(admin, 'profiles', 'referred_by', referralCode) : Promise.resolve(0),
    referralCode ? safeCount(admin, 'profiles', 'referral_code_used', referralCode) : Promise.resolve(0),
    safeCount(admin, 'referrals', 'referrer_id', userId),
    safeCount(admin, 'nexa_referrals', 'referrer_id', userId),
  ])
  return Math.max(progress.referral_count || 0, progress.valid_referrals || 0, ...possibleCounts)
}

async function grantBadges(admin: AnyClient, userId: string, badgeKeys: string[], source = 'auto_sync') {
  const uniqueKeys = Array.from(new Set(badgeKeys.filter(Boolean)))
  if (!uniqueKeys.length) return { granted: [] as string[], error: null as string | null }

  try {
    const { data: existingRows } = await admin
      .from('nexa_user_badges')
      .select('badge_key')
      .eq('user_id', userId)
      .in('badge_key', uniqueKeys)

    const existing = new Set((existingRows || []).map((item: { badge_key: string }) => item.badge_key))
    const missingKeys = uniqueKeys.filter((key) => !existing.has(key))

    if (!missingKeys.length) return { granted: uniqueKeys, error: null }

    const rows = missingKeys.map((badge_key) => ({
      user_id: userId,
      badge_key,
      source,
      is_pinned: false,
      metadata: { synced_at: new Date().toISOString() },
    }))

    const { error } = await admin.from('nexa_user_badges').insert(rows)
    if (error) return { granted: [] as string[], error: error.message }
    return { granted: uniqueKeys, error: null }
  } catch (err: any) {
    return { granted: [] as string[], error: err?.message || 'Gagal sync badge.' }
  }
}

export async function syncUnlockedBadgesForUser({ admin, user, profile }: SyncBadgeArgs) {
  const email = user.email || profile?.email || null

  if (isOwnerEmail(email)) {
    const result = await grantBadges(admin, user.id, ALL_BADGE_KEYS, 'owner_all_badges')

    return {
      unlockedKeys: ALL_BADGE_KEYS,
      autoBadges: ALL_BADGE_KEYS,
      stats: { ownerOverride: true },
      error: result.error,
    }
  }

  const progress = await getProgressMap(admin, user.id)
  const orders = await getApprovedOrders(admin, user.id)
  const pulseOrders = orders.filter((order) => order.plan === 'pulse').length
  const commandOrders = orders.filter((order) => order.plan === 'command').length
  const plan = String(profile?.plan || '').toLowerCase()
  const planStartedAt = String(profile?.plan_started_at || '') || null
  const planAgeMs = dateAgeMs(planStartedAt)
  const deadlineCount = await getDeadlineCount(admin, user.id, progress)
  const referralCount = await getReferralCount(admin, user.id, profile, progress)
  const top1MonthStreak = Math.max(progress.top1_leaderboard_month_streak || 0, progress.leaderboard_top1_month_streak || 0)
  const leaderboardActiveMonths = Math.max(progress.leaderboard_active_months || 0, progress.leaderboard_months || 0)

  const unlocked = new Set<string>(autoBadgesForPlan(plan, email))

  // Basic and core actions. Metrics bisa di-bump dari fitur mana pun pakai RPC bump_nexa_badge_progress.
  unlocked.add('first_ping')
  if (deadlineCount >= 1) unlocked.add('deadline_newbie')
  if (deadlineCount >= 3 || progress.deadlines_completed_before_due >= 3) unlocked.add('deadline_guard')
  if (deadlineCount >= 7 || progress.deadline_streak >= 7) unlocked.add('deadline_streaker')
  if (deadlineCount >= 10 || progress.deadlines_before_due >= 10) unlocked.add('anti_telat')
  if (deadlineCount >= 25 || progress.deadlines_completed >= 25) unlocked.add('deadline_commander')
  if (deadlineCount >= 500) unlocked.add('deadline_500_commander')

  if (progress.dashboard_pages_visited >= 3) unlocked.add('campus_walker')
  if (progress.study_room_sessions >= 1) unlocked.add('study_ally')
  if (progress.telegram_linked >= 1 || profile?.telegram_chat_id) unlocked.add('telegram_ready')
  if (progress.friend_count >= 3) unlocked.add('friend_magnet')
  if (progress.focus_sessions >= 3) unlocked.add('focus_keeper')
  if (progress.focus_sessions >= 10) unlocked.add('focus_grinder')
  if (progress.arena_opened >= 1) unlocked.add('arena_scout')
  if (progress.ai_quick_add_count >= 5) unlocked.add('quick_add_beast')
  if (progress.ai_battle_plan_count >= 3) unlocked.add('ai_scheduler')
  if (progress.ai_battle_plan_count >= 5) unlocked.add('battle_plan_maker')
  if (progress.risk_scan_count >= 5) unlocked.add('risk_hunter')
  if (progress.risk_scan_count >= 20 && progress.high_risk_saved >= 10) unlocked.add('risk_oracle')
  if (progress.custom_reminder_count >= 5) unlocked.add('reminder_builder')
  if (progress.study_room_voice_notes >= 3) unlocked.add('voice_note_caster')
  if (progress.study_room_calls_started >= 1) unlocked.add('video_call_initiator')
  if (progress.study_rooms_created >= 1) unlocked.add('study_room_host')
  if (progress.night_activity_count >= 5) unlocked.add('night_owl')
  if (progress.arena_competitions_joined >= 1) unlocked.add('arena_contender')
  if (progress.team_workspace_active_days >= 3) unlocked.add('team_synergy')
  if (progress.weekly_summary_reads >= 1) unlocked.add('summary_reader')
  if (progress.arena_team_captain >= 1) unlocked.add('arena_captain')
  if (progress.active_days >= 30 && progress.main_features_used >= 5) unlocked.add('campus_titan')

  // New payment / leaderboard / referral badges.
  if (pulseOrders >= 1 || plan === 'pulse') unlocked.add('pulse_spark')
  if (commandOrders >= 1 || plan === 'command') unlocked.add('command_spark')
  if (pulseOrders >= 6) unlocked.add('pulse_hexaflame')
  if (commandOrders >= 6) unlocked.add('command_hexacrown')
  if (pulseOrders >= 12 || (plan === 'pulse' && planAgeMs >= YEAR_MS)) unlocked.add('pulse_year_guardian')
  if (commandOrders >= 12 || (plan === 'command' && planAgeMs >= YEAR_MS)) unlocked.add('command_year_overlord')
  if (top1MonthStreak >= 6) unlocked.add('leaderboard_six_month_king')
  if (leaderboardActiveMonths >= 12 || progress.leaderboard_years >= 1) unlocked.add('leaderboard_year_titan')
  if (referralCount >= 100) unlocked.add('referral_mythos_100')

  const unlockedKeys = Array.from(unlocked).filter((key) => ALL_BADGE_KEYS.includes(key))
  const result = await grantBadges(admin, user.id, unlockedKeys, 'auto_requirement_sync')

  return {
    unlockedKeys,
    autoBadges: autoBadgesForPlan(plan, email),
    stats: {
      ownerOverride: false,
      pulseOrders,
      commandOrders,
      deadlineCount,
      referralCount,
      top1MonthStreak,
      leaderboardActiveMonths,
    },
    error: result.error,
  }
}

export async function bumpBadgeMetric(admin: AnyClient, userId: string, metricKey: string, delta = 1) {
  const cleanMetric = String(metricKey || '').trim()
  if (!cleanMetric) return

  await admin.from('nexa_badge_progress').upsert(
    {
      user_id: userId,
      metric_key: cleanMetric,
      metric_value: delta,
      metadata: { updated_by: 'bumpBadgeMetric', last_delta: delta },
    },
    { onConflict: 'user_id,metric_key' }
  )
}
