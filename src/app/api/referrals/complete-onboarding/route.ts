import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { Plan } from '@/types'

const REFERRER_REWARD_DAYS = 30
const REFERRER_POINTS = 75
const REFERRED_POINTS = 15

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
  return new Date(base.getTime() + REFERRER_REWARD_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

async function safeNotify(
  service: ReturnType<typeof createServiceClient>,
  payload: { user_id: string; type: string; title: string; message: string; link?: string }
) {
  await service.from('notifications').insert(payload).then(() => null, () => null)
}

async function awardReferralPoints(
  service: ReturnType<typeof createServiceClient>,
  referralId: string,
  referrerId: string,
  referredId: string
) {
  await service.from('points_events').insert([
    {
      user_id: referrerId,
      kind: 'referral_reward',
      points: REFERRER_POINTS,
      ref: `referral:${referralId}:referrer`,
    },
    {
      user_id: referredId,
      kind: 'referral_join_bonus',
      points: REFERRED_POINTS,
      ref: `referral:${referralId}:referred`,
    },
  ]).then(() => null, () => null)
}

async function unlockReferralBadges(service: ReturnType<typeof createServiceClient>, referrerId: string) {
  const { count } = await service
    .from('referrals')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_id', referrerId)
    .eq('rewarded', true)

  const rewardedCount = count ?? 0
  const badges = ['connector']
  if (rewardedCount >= 3) badges.push('squad')
  if (rewardedCount >= 10) badges.push('referral_10')
  if (rewardedCount >= 25) badges.push('nexa_origin')

  for (const badge of badges) {
    await service.rpc('add_profile_badge', { p_user_id: referrerId, p_badge: badge }).then(() => null, () => null)
  }
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

  let service: ReturnType<typeof createServiceClient>
  try {
    service = createServiceClient()
  } catch (err) {
    console.warn('[Referral] Service client tidak tersedia (SUPABASE_SERVICE_ROLE_KEY belum diset):', err)
    return NextResponse.json({ status: 'skipped', reason: 'service_not_configured' })
  }

  const { data: referrer, error: referrerError } = await service
    .from('profiles')
    .select('id, plan, pulse_trial_until')
    .eq('referral_code', referralCode)
    .maybeSingle()

  if (referrerError) {
    console.error('[Referral] Error cek referrer:', referrerError.message)
    return NextResponse.json({ status: 'skipped', reason: 'lookup_failed' })
  }

  const typedReferrer = referrer as ReferrerProfile | null
  if (!typedReferrer || typedReferrer.id === user.id) {
    return NextResponse.json({ status: 'ignored' })
  }

  const { data: existingReferral } = await service
    .from('referrals')
    .select('id, rewarded')
    .eq('referred_id', user.id)
    .maybeSingle()

  if (existingReferral) {
    return NextResponse.json({
      status: (existingReferral as { rewarded?: boolean }).rewarded ? 'already_rewarded' : 'already_recorded',
    })
  }

  const { data: insertedReferral, error: insertError } = await service
    .from('referrals')
    .insert({
      referrer_id: typedReferrer.id,
      referred_id: user.id,
      rewarded: false,
      reward_days: REFERRER_REWARD_DAYS,
      reward_plan: 'pulse',
      source: 'onboarding',
    })
    .select('id')
    .maybeSingle()

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ status: 'already_recorded' })
    }
    console.error('[Referral] Insert error:', insertError.message)
    return NextResponse.json({ status: 'skipped', reason: 'insert_failed' })
  }

  const referralId = (insertedReferral as { id?: string } | null)?.id
  if (!referralId) {
    return NextResponse.json({ status: 'skipped', reason: 'insert_no_id' })
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
    console.error('[Referral] Reward error:', rewardError.message)
    return NextResponse.json({ status: 'recorded_reward_pending' })
  }

  await awardReferralPoints(service, referralId, typedReferrer.id, user.id)

  await service
    .from('referrals')
    .update({ rewarded: true, rewarded_at: new Date().toISOString() })
    .eq('id', referralId)
    .then(() => null, () => null)

  await unlockReferralBadges(service, typedReferrer.id)
  await service.rpc('add_profile_badge', { p_user_id: user.id, p_badge: 'daily_1' }).then(() => null, () => null)

  const { data: referredProfile } = await service
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()
  const referredName = (referredProfile as { full_name?: string | null } | null)?.full_name ?? 'Teman kamu'

  await safeNotify(service, {
    user_id: typedReferrer.id,
    type: 'achievement',
    title: '🎉 Referral berhasil!',
    message: `${referredName} selesai onboarding dari link kamu. Reward aktif: +30 hari Pulse dan +${REFERRER_POINTS} poin.`,
    link: '/dashboard#referral',
  })

  await safeNotify(service, {
    user_id: user.id,
    type: 'achievement',
    title: 'Bonus referral masuk',
    message: `Kamu join lewat referral dan dapat +${REFERRED_POINTS} poin awal. Selamat, sistem kecil ini berhasil memancing dopamin pertamamu.`,
    link: '/dashboard/achievements',
  })

  return NextResponse.json({
    status: 'rewarded',
    reward_until: rewardUntil,
    referrer_points: REFERRER_POINTS,
    referred_points: REFERRED_POINTS,
  })
}
