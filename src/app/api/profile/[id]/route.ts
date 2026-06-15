import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getEffectivePlan } from '@/lib/plans'
import { BADGES } from '@/lib/badges'
import { getArenaProfileVerification } from '@/lib/profile-verification'

const NEXA_FOUNDER_EMAIL = 'fauzanalfa36@gmail.com'
function founderVerified(email: unknown) { return String(email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL }

function dataClient<T>(fallback: T): T {
  try {
    return createServiceClient() as T
  } catch {
    return fallback
  }
}

type Params = { params: Promise<{ id: string }> }

const PROFILE_SELECT = `
  id,
  email,
  founder_verified,
  full_name,
  campus_name,
  province,
  major,
  semester,
  avatar_url,
  plan,
  pulse_trial_until,
  plan_expires_at,
  subscription_expires_at,
  command_expires_at,
  lifetime_command,
  nexa_id,
  is_public_profile,
  featured_badge,
  badges,
  public_profile_headline,
  profile_bio,
  profile_bio_visibility,
  profile_skills,
  profile_skills_visibility,
  profile_interests,
  profile_interests_visibility,
  portfolio_url,
  github_url,
  linkedin_url,
  online_status_visibility,
  study_room_presence_visibility,
  dm_privacy,
  created_at
`

function hidePrivate(profile: Record<string, unknown>, isOwnProfile: boolean) {
  if (isOwnProfile) return profile
  const copy = { ...profile }
  if (copy.profile_bio_visibility === 'private') copy.profile_bio = null
  if (copy.profile_skills_visibility === 'private') copy.profile_skills = []
  if (copy.profile_interests_visibility === 'private') copy.profile_interests = []
  copy.arena_profile_verification = null
  return copy
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const db = dataClient(supabase)
  const { data, error } = await db
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Profil tidak ditemukan.' }, { status: 404 })

  const isOwnProfile = data.id === user.id
  const [{ count: friendCount }] = await Promise.all([
    db
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${id},receiver_id.eq.${id}`),
  ])

  const founder = founderVerified((data as { email?: string | null }).email) || Boolean((data as { founder_verified?: boolean | null }).founder_verified)
  const arenaVerification = getArenaProfileVerification(data)
  const safeProfile = {
    ...(data as Record<string, unknown>),
    email: null,
    founder_verified: founder,
    plan: getEffectivePlan(data as never),
    badges: founder ? BADGES.map((badge) => badge.id) : ((data as { badges?: unknown }).badges ?? []),
    friend_count: friendCount ?? 0,
    arena_verified: arenaVerification.verified,
    arena_profile_verification: arenaVerification,
  }

  return NextResponse.json({ data: hidePrivate(safeProfile, isOwnProfile) })
}
