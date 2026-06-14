import Link from 'next/link'
import { Lock, Sparkles } from 'lucide-react'
import { BILLING_PLANS } from '@/lib/billing/plans'
import { FEATURE_META, getUpgradePlan, upgradeMessage, type FeatureKey } from '@/lib/billing/access'

export default function UpgradePromptCard({
  featureKey,
  title,
  description,
  compact = false,
}: {
  featureKey: FeatureKey
  title?: string
  description?: string
  compact?: boolean
}) {
  const requiredPlan = getUpgradePlan(featureKey)
  const plan = BILLING_PLANS[requiredPlan]
  const meta = FEATURE_META[featureKey]

  return (
    <div className={`rounded-3xl border border-amber-200 bg-amber-50/80 ${compact ? 'p-4' : 'p-6'} text-slate-900 shadow-sm`}>
      <div className="flex items-start gap-3">
        <div className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Lock className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Premium locked</p>
          <h3 className="mt-1 text-lg font-black text-slate-950">{title || meta.label}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {description || upgradeMessage(featureKey)}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-black text-white transition hover:bg-slate-800"
            >
              <Sparkles className="h-4 w-4" />
              Upgrade ke {plan.name.replace('NEXA ', '')} · {plan.priceLabel}
            </Link>
            <span className="text-xs font-bold text-slate-500">Teknologi butuh server, server butuh duit. Tragis tapi nyata.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
