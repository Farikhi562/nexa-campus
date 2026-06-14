import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import {
  FEATURE_META,
  canUseFeature,
  getDailyLimit,
  getPlanLimits,
  isFeatureKey,
  resolveEffectivePlan,
  upgradeMessage,
  type FeatureKey,
} from '@/lib/billing/access'
import type { BillingPlanId } from '@/lib/billing/plans'

type SupabaseLike = any

type AuthUser = {
  id: string
  email?: string | null
}

export type UserPlanAccess = {
  userId: string
  email: string | null
  plan: BillingPlanId
  profile: Record<string, unknown> | null
  limits: ReturnType<typeof getPlanLimits>
  features: Record<FeatureKey, boolean>
  usageToday: Partial<Record<FeatureKey, number>>
  ownerOverride?: boolean
}

export type ConsumeFeatureResult = {
  allowed: boolean
  status: 'ok' | 'locked' | 'limit_reached' | 'error'
  featureKey: FeatureKey
  plan: BillingPlanId
  usageCount: number
  limitCount: number | null
  message: string
  requiredPlan: BillingPlanId
}

const PROFILE_SELECT = [
  'id',
  'full_name',
  'name',
  'email',
  'avatar_url',
  'nexa_id',
  'plan',
  'plan_status',
  'plan_started_at',
  'plan_expires_at',
].join(',')

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeEmail(email?: string | null) {
  return (email || '').trim().toLowerCase()
}

function envEmailList(value?: string) {
  return (value || '')
    .split(',')
    .map((item) => normalizeEmail(item))
    .filter(Boolean)
}

function isOwnerCommandEmail(email?: string | null) {
  const normalized = normalizeEmail(email)
  if (!normalized) return false

  const ownerEmails = [
    ...envEmailList(process.env.NEXA_OWNER_EMAILS),
    ...envEmailList(process.env.COMMAND_LIFETIME_EMAILS),
    ...envEmailList(process.env.ADMIN_EMAILS),
  ]

  return ownerEmails.includes(normalized)
}

async function getProfileByUserId(supabase: SupabaseLike, userId: string, email?: string | null) {
  // Schema NEXA Campus lo sekarang pakai profiles.id = auth.users.id.
  // Jangan select user_id di sini. Kalau kolom user_id tidak ada, Supabase error dan plan kebaca radar.
  const byId = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle()

  if (byId.data) return byId.data

  // Fallback by email untuk jaga-jaga kalau row profile pernah dibuat pakai email duluan.
  // Ini tidak wajib, tapi lumayan buat ngerapihin database yang pernah hidup liar.
  if (email) {
    const byEmail = await supabase
      .from('profiles')
      .select(PROFILE_SELECT)
      .ilike('email', email)
      .maybeSingle()

    if (byEmail.data) return byEmail.data
  }

  return null
}

export async function getCurrentUser(supabase?: SupabaseLike): Promise<AuthUser | null> {
  const client = supabase ?? await createClient()
  const { data, error } = await client.auth.getUser()
  if (error || !data?.user) return null
  return { id: data.user.id, email: data.user.email }
}

export async function getUserPlanAccess(params: {
  supabase?: SupabaseLike
  user?: AuthUser | null
}): Promise<UserPlanAccess | null> {
  const supabase = params.supabase ?? await createClient()
  const user = params.user ?? await getCurrentUser(supabase)
  if (!user) return null

  const profile = await getProfileByUserId(supabase, user.id, user.email)
  const ownerOverride = isOwnerCommandEmail(user.email)
  const plan: BillingPlanId = ownerOverride ? 'command' : resolveEffectivePlan(profile)
  const limits = getPlanLimits(plan)

  const features = Object.keys(FEATURE_META).reduce((acc, key) => {
    const featureKey = key as FeatureKey
    acc[featureKey] = canUseFeature(plan, featureKey)
    return acc
  }, {} as Record<FeatureKey, boolean>)

  const { data: usageRows } = await supabase
    .from('feature_usage_daily')
    .select('feature_key,usage_count')
    .eq('user_id', user.id)
    .eq('usage_date', todayKey())

  const usageToday = Array.isArray(usageRows)
    ? usageRows.reduce((acc, row) => {
        if (isFeatureKey(row.feature_key)) acc[row.feature_key] = Number(row.usage_count || 0)
        return acc
      }, {} as Partial<Record<FeatureKey, number>>)
    : {}

  return {
    userId: user.id,
    email: user.email ?? null,
    plan,
    profile: profile ?? null,
    limits,
    features,
    usageToday,
    ownerOverride,
  }
}

export async function consumeFeatureUsage(params: {
  userId: string
  featureKey: FeatureKey
}): Promise<ConsumeFeatureResult> {
  const supabase = createAdminClient()
  const profile = await getProfileByUserId(supabase, params.userId)
  const plan = resolveEffectivePlan(profile)
  const requiredPlan = FEATURE_META[params.featureKey].minPlan
  const limitCount = getDailyLimit(plan, params.featureKey)

  if (!canUseFeature(plan, params.featureKey)) {
    return {
      allowed: false,
      status: 'locked',
      featureKey: params.featureKey,
      plan,
      usageCount: 0,
      limitCount,
      requiredPlan,
      message: upgradeMessage(params.featureKey),
    }
  }

  if (limitCount === 0) {
    return {
      allowed: false,
      status: 'limit_reached',
      featureKey: params.featureKey,
      plan,
      usageCount: 0,
      limitCount,
      requiredPlan,
      message: `Limit ${FEATURE_META[params.featureKey].label} di plan ini 0. Upgrade dulu, jangan ngajak AI kerja bakti tanpa nasi kotak.`,
    }
  }

  const { data, error } = await supabase.rpc('consume_feature_usage', {
    p_user_id: params.userId,
    p_feature_key: params.featureKey,
    p_limit_count: limitCount,
  })

  if (error) {
    console.error('[billing] consume_feature_usage failed', error)
    return {
      allowed: false,
      status: 'error',
      featureKey: params.featureKey,
      plan,
      usageCount: 0,
      limitCount,
      requiredPlan,
      message: 'Gagal cek usage limit. Pastikan migration v1.6.31 sudah jalan di Supabase.',
    }
  }

  const row = Array.isArray(data) ? data[0] : data
  const allowed = Boolean(row?.allowed)
  const usageCount = Number(row?.usage_count || 0)

  return {
    allowed,
    status: allowed ? 'ok' : 'limit_reached',
    featureKey: params.featureKey,
    plan,
    usageCount,
    limitCount,
    requiredPlan,
    message: allowed
      ? 'OK'
      : `Limit harian ${FEATURE_META[params.featureKey].label} sudah habis. Upgrade plan atau tunggu besok. Ya, waktu memang kejam.`,
  }
}
