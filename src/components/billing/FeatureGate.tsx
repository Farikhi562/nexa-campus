'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import UpgradePromptCard from '@/components/billing/UpgradePromptCard'
import { canUseFeature, type FeatureKey } from '@/lib/billing/access'
import type { BillingPlanId } from '@/lib/billing/plans'

type AccessResponse = {
  plan?: BillingPlanId
  features?: Partial<Record<FeatureKey, boolean>>
}

export default function FeatureGate({
  featureKey,
  currentPlan,
  children,
  fallback,
  loadingFallback = null,
}: {
  featureKey: FeatureKey
  currentPlan?: BillingPlanId | null
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
}) {
  const [access, setAccess] = useState<AccessResponse | null>(null)
  const [loading, setLoading] = useState(!currentPlan)

  useEffect(() => {
    if (currentPlan) return
    let alive = true

    async function loadAccess() {
      try {
        const response = await fetch('/api/billing/access', { cache: 'no-store' })
        const data = (await response.json().catch(() => null)) as AccessResponse | null
        if (alive && response.ok) setAccess(data)
      } finally {
        if (alive) setLoading(false)
      }
    }

    void loadAccess()
    return () => {
      alive = false
    }
  }, [currentPlan])

  const allowed = useMemo(() => {
    if (currentPlan) return canUseFeature(currentPlan, featureKey)
    if (access?.features && typeof access.features[featureKey] === 'boolean') return Boolean(access.features[featureKey])
    if (access?.plan) return canUseFeature(access.plan, featureKey)
    return false
  }, [access, currentPlan, featureKey])

  if (loading) return <>{loadingFallback}</>
  if (!allowed) return <>{fallback ?? <UpgradePromptCard featureKey={featureKey} />}</>
  return <>{children}</>
}
