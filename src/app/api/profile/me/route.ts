import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan, isFounderEmail } from '@/lib/plans'
import { BADGES } from '@/lib/badges'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  const { data, error } = await supabase
    .from('profiles')
    .select('featured_badge, nexa_id, email, plan, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command, badges, founder_verified')
    .eq('id', user.id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const founder = isFounderEmail(user.email) || Boolean((data as { founder_verified?: boolean | null } | null)?.founder_verified)
  return NextResponse.json({
    ...(data ?? {}),
    plan: getEffectivePlan({ ...(data ?? {}), email: user.email }),
    founder_verified: founder,
    badges: founder ? BADGES.map((badge) => badge.id) : ((data as { badges?: unknown } | null)?.badges ?? []),
  })
}
