import { FEATURE_META, getDailyLimit, type FeatureKey } from '@/lib/billing/access'
import type { BillingPlanId } from '@/lib/billing/plans'

export default function UsageLimitBadge({
  plan,
  featureKey,
  used = 0,
}: {
  plan: BillingPlanId
  featureKey: FeatureKey
  used?: number
}) {
  const limit = getDailyLimit(plan, featureKey)
  const meta = FEATURE_META[featureKey]

  if (limit === null) {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
        {meta.label}: unlimited
      </span>
    )
  }

  const remaining = Math.max(limit - used, 0)

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
      {meta.label}: {remaining}/{limit} tersisa
    </span>
  )
}
