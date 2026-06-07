import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail } from '@/lib/admin'
import type { Plan } from '@/types'

const REWARD_DAYS = 30
const REFERRER_POINTS = 75

/** POST /api/admin/referrals/retry — admin retrigger reward untuk referral yang belum di-reward */
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: 'Admin only.' }, { status: 403 })

  let service: ReturnType<typeof createServiceClient>
  try { service = createServiceClient() } catch {
    return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY belum diset.' }, { status: 503 })
  }

  const { data: pending } = await service
    .from('referrals')
    .select('id, referrer_id, referred_id')
    .eq('rewarded', false)
    .limit(50)

  let rewarded = 0
  for (const ref of (pending ?? []) as Array<{ id: string; referrer_id: string; referred_id: string }>) {
    const { data: referrer } = await service
      .from('profiles')
      .select('id, plan, pulse_trial_until')
      .eq('id', ref.referrer_id)
      .maybeSingle()
    if (!referrer) continue

    const r = referrer as { id: string; plan: Plan; pulse_trial_until: string | null }
    const base = r.pulse_trial_until && new Date(r.pulse_trial_until) > new Date() ? new Date(r.pulse_trial_until) : new Date()
    const rewardUntil = new Date(base.getTime() + REWARD_DAYS * 24 * 60 * 60 * 1000).toISOString()
    const update = r.plan === 'command' ? { pulse_trial_until: rewardUntil } : { plan: 'pulse' as Plan, pulse_trial_until: rewardUntil }

    const { error } = await service.from('profiles').update(update).eq('id', r.id)
    if (!error) {
      await service.from('points_events').insert({
        user_id: r.id,
        kind: 'referral_reward',
        points: REFERRER_POINTS,
        ref: `referral:${ref.id}:retry`,
      }).then(() => null, () => null)
      await service.from('referrals').update({ rewarded: true, rewarded_at: new Date().toISOString(), reward_days: REWARD_DAYS, reward_plan: 'pulse' }).eq('id', ref.id).then(() => null, () => null)
      await service.rpc('add_profile_badge', { p_user_id: r.id, p_badge: 'connector' }).then(() => null, () => null)
      rewarded++
    }
  }

  return NextResponse.json({ ok: true, processed: pending?.length ?? 0, rewarded })
}
