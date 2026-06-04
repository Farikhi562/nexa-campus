import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Plan } from '@/types'

const REWARD_DAYS = 30

type ReferrerProfile = {
  id: string
  plan: Plan
  pulse_trial_until: string | null
}

function normalizeReferralCode(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function addRewardDays(currentUntil: string | null) {
  const now = new Date()
  const current = currentUntil ? new Date(currentUntil) : null
  const base = current && current.getTime() > now.getTime() ? current : now
  return new Date(base.getTime() + REWARD_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })
  }

  let body: { referralCode?: unknown }
  try {
    body = (await request.json()) as { referralCode?: unknown }
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const referralCode = normalizeReferralCode(body.referralCode)
  if (!referralCode) {
    return NextResponse.json({ status: 'skipped' })
  }

  const service = createServiceClient()
  const { data: referrer, error: referrerError } = await service
    .from('profiles')
    .select('id, plan, pulse_trial_until')
    .eq('referral_code', referralCode)
    .maybeSingle()

  if (referrerError) {
    return NextResponse.json({ error: 'Referral gagal dicek.' }, { status: 500 })
  }

  const typedReferrer = referrer as ReferrerProfile | null
  if (!typedReferrer || typedReferrer.id === user.id) {
    return NextResponse.json({ status: 'ignored' })
  }

  const { data: insertedReferral, error: insertError } = await service
    .from('referrals')
    .insert({
      referrer_id: typedReferrer.id,
      referred_id: user.id,
      rewarded: false,
    })
    .select('id')
    .maybeSingle()

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ status: 'already_recorded' })
    }

    return NextResponse.json({ error: 'Referral gagal disimpan.' }, { status: 500 })
  }

  const rewardUntil = addRewardDays(typedReferrer.pulse_trial_until)
  const profileUpdate =
    typedReferrer.plan === 'command'
      ? { pulse_trial_until: rewardUntil }
      : { plan: 'pulse' as Plan, pulse_trial_until: rewardUntil }

  const { error: rewardError } = await service
    .from('profiles')
    .update(profileUpdate)
    .eq('id', typedReferrer.id)

  if (rewardError) {
    return NextResponse.json({ error: 'Reward referral gagal diproses.' }, { status: 500 })
  }

  await service
    .from('referrals')
    .update({ rewarded: true })
    .eq('id', insertedReferral?.id)

  return NextResponse.json({
    status: 'rewarded',
    reward_until: rewardUntil,
  })
}
