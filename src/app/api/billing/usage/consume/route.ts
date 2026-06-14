import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFeatureKey } from '@/lib/billing/access'
import { consumeFeatureUsage, getCurrentUser } from '@/lib/billing/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ error: 'Login dulu buat pakai fitur ini.' }, { status: 401 })
  }

  let body: { feature_key?: unknown; featureKey?: unknown }
  try {
    body = (await request.json()) as { feature_key?: unknown; featureKey?: unknown }
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const featureKey = body.feature_key ?? body.featureKey
  if (!isFeatureKey(featureKey)) {
    return NextResponse.json({ error: 'Feature key tidak valid.' }, { status: 400 })
  }

  const result = await consumeFeatureUsage({ userId: user.id, featureKey })
  const status = result.allowed ? 200 : result.status === 'locked' ? 402 : result.status === 'limit_reached' ? 429 : 500

  return NextResponse.json(result, { status })
}
