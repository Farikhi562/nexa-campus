import type { Plan, Profile } from '@/types'

export const BASIC_PRICE = 'Rp19.000'
export const PRO_PRICE = 'Rp39.000'

export function hasPaidAccess(plan?: Plan | null) {
  return plan === 'basic' || plan === 'pro' || plan === 'admin'
}

export function hasProAccess(profile?: Pick<Profile, 'plan' | 'seat_owner_id'> | null) {
  if (!profile) return false
  return profile.plan === 'pro' || profile.plan === 'admin' || Boolean(profile.seat_owner_id)
}

export function canUseBasicTool(index: number, profile?: Pick<Profile, 'plan' | 'seat_owner_id'> | null) {
  if (hasProAccess(profile)) return true
  if (profile?.plan === 'basic') return index < 5
  return index < 0
}
