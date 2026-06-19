import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getEffectivePlan } from '@/lib/plans'
import { BADGES } from '@/lib/badges'

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
  return copy
}

async function isFriendOf(
  db: ReturnType<typeof dataClient<Awaited<ReturnType<typeof createClient>>>>,
  viewerId: string,
  targetId: string
) {
  const { data } = await db
    .from('friend_requests')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(requester_id.eq.${viewerId},receiver_id.eq.${targetId}),and(requester_id.eq.${targetId},receiver_id.eq.${viewerId})`)
    .maybeSingle()
  return Boolean(data)
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

  // CATATAN KEAMANAN: SEBELUMNYA, field is_public_profile diambil dari DB
  // tapi TIDAK PERNAH dicek di sini — siapa pun yang login tetap melihat
  // nama/kampus/jurusan/badge dkk meskipun user men-set profilnya privat.
  // Sekarang ditegakkan: kalau bukan pemilik profil DAN bukan teman DAN
  // is_public_profile eksplisit false, hanya kembalikan data minimal.
  // (is_public_profile null/undefined dianggap PUBLIC by default, supaya
  // tidak mematahkan profil lama yang belum pernah set nilai eksplisit.)
  const isPublic = (data as { is_public_profile?: boolean | null }).is_public_profile !== false

  if (!isOwnProfile && !isPublic) {
    const friend = await isFriendOf(db, user.id, id)
    if (!friend) {
      return NextResponse.json({
        data: {
          id: data.id,
          full_name: (data as { full_name?: string | null }).full_name ?? null,
          avatar_url: (data as { avatar_url?: string | null }).avatar_url ?? null,
          is_public_profile: false,
          private: true,
        },
      })
    }
  }

  const [{ count: friendCount }] = await Promise.all([
    db
      .from('friend_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${id},receiver_id.eq.${id}`),
  ])

  const founder = founderVerified((data as { email?: string | null }).email) || Boolean((data as { founder_verified?: boolean | null }).founder_verified)
  const safeProfile = {
    ...(data as Record<string, unknown>),
    email: null,
    founder_verified: founder,
    plan: getEffectivePlan(data as never),
    badges: founder ? BADGES.map((badge) => badge.id) : ((data as { badges?: unknown }).badges ?? []),
    friend_count: friendCount ?? 0,
  }

  return NextResponse.json({ data: hidePrivate(safeProfile, isOwnProfile) })
}
