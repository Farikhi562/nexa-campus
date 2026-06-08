import type { Plan } from '@/types'

export const NEXA_FOUNDER_EMAIL = 'fauzanalfa36@gmail.com'

export type PlanProfileLike = {
  email?: string | null
  plan?: string | null
  pulse_trial_until?: string | null
  plan_expires_at?: string | null
  subscription_expires_at?: string | null
  command_expires_at?: string | null
  lifetime_command?: boolean | null
}

export function isFounderEmail(email?: string | null) {
  return String(email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL
}

function future(value?: string | null) {
  if (!value) return false
  const time = new Date(value).getTime()
  return Number.isFinite(time) && time > Date.now()
}

export function getEffectivePlan(profile?: PlanProfileLike | null): Plan {
  if (!profile) return 'radar'
  if (isFounderEmail(profile.email) || profile.lifetime_command) return 'command'

  const raw = profile.plan === 'command' || profile.plan === 'pulse' ? profile.plan : 'radar'
  if (raw === 'radar') return 'radar'

  const expiresAt = profile.plan_expires_at ?? profile.subscription_expires_at ?? profile.command_expires_at ?? profile.pulse_trial_until ?? null
  return future(expiresAt) ? raw : 'radar'
}

export function isPremiumActive(profile?: PlanProfileLike | null) {
  return getEffectivePlan(profile) !== 'radar'
}

export function planExpiresLabel(profile?: PlanProfileLike | null) {
  if (!profile) return null
  if (isFounderEmail(profile.email) || profile.lifetime_command) return 'Lifetime'
  const expiresAt = profile.plan_expires_at ?? profile.subscription_expires_at ?? profile.command_expires_at ?? profile.pulse_trial_until ?? null
  if (!expiresAt) return null
  try {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(expiresAt))
  } catch {
    return null
  }
}
