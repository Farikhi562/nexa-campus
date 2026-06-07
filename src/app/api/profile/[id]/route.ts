import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

const PROFILE_SELECT = `
  id,
  full_name,
  campus_name,
  province,
  major,
  semester,
  avatar_url,
  plan,
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

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Profil tidak ditemukan.' }, { status: 404 })

  const isOwnProfile = data.id === user.id
  if (!isOwnProfile && data.is_public_profile === false) {
    return NextResponse.json({ data: { id: data.id, full_name: data.full_name, avatar_url: data.avatar_url, is_public_profile: false } })
  }

  return NextResponse.json({ data: hidePrivate(data as Record<string, unknown>, isOwnProfile) })
}
