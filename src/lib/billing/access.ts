import type { BillingPlanId } from '@/lib/billing/plans'

export type PlanFeature =
  | 'deadline_basic'
  | 'deadline_unlimited'
  | 'reminder_basic'
  | 'weekly_summary'
  | 'custom_reminder'
  | 'ai_quick_add'
  | 'ask_nexa_premium'
  | 'telegram_notifications'
  | 'whatsapp_notifications'
  | 'email_notifications'

const PLAN_RANK: Record<BillingPlanId, number> = {
  radar: 0,
  pulse: 1,
  command: 2,
}

export const FEATURE_MIN_PLAN: Record<PlanFeature, BillingPlanId> = {
  deadline_basic: 'radar',
  reminder_basic: 'radar',
  deadline_unlimited: 'pulse',
  weekly_summary: 'pulse',
  telegram_notifications: 'pulse',
  custom_reminder: 'command',
  ai_quick_add: 'command',
  ask_nexa_premium: 'command',
  whatsapp_notifications: 'command',
  email_notifications: 'command',
}

export function normalizePlan(plan?: string | null): BillingPlanId {
  if (plan === 'pulse' || plan === 'command') return plan
  return 'radar'
}

export function canUseFeature(plan: string | null | undefined, feature: PlanFeature) {
  const currentPlan = normalizePlan(plan)
  const requiredPlan = FEATURE_MIN_PLAN[feature]
  return PLAN_RANK[currentPlan] >= PLAN_RANK[requiredPlan]
}

export function requiredPlanForFeature(feature: PlanFeature): BillingPlanId {
  return FEATURE_MIN_PLAN[feature]
}

export function upgradeMessage(feature: PlanFeature) {
  const required = requiredPlanForFeature(feature)
  if (required === 'pulse') return 'Fitur ini ada di NEXA Pulse. Upgrade dulu, jangan minta fitur premium sambil dompet mode stealth.'
  if (required === 'command') return 'Fitur ini ada di NEXA Command. Ini bagian AI/custom yang sengaja dikunci biar bisnisnya nggak cosplay jadi yayasan.'
  return 'Fitur ini tersedia untuk semua user.'
}
