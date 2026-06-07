export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/Card'
import PublicUserProfileView from '@/components/profile/PublicUserProfileView'
import { createClient } from '@/lib/supabase/server'

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

type Params = { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Params) {
  const { id } = await params
  return { title: `Profil User · ${id.slice(0, 8)} · NEXA Campus` }
}

export default async function UserProfilePage({ params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-sm leading-6 text-red-700">
          Profil gagal dibuka: {error.message}. Jalankan SQL v7 public profile dulu di Supabase. Ya, database lagi minta sesajen berupa migration.
        </CardContent>
      </Card>
    )
  }

  if (!profile) notFound()

  let canMessage = false
  if (profile.id !== user.id) {
    const { data: friendship } = await supabase
      .from('friend_requests')
      .select('id')
      .eq('status', 'accepted')
      .or(`and(requester_id.eq.${user.id},receiver_id.eq.${profile.id}),and(requester_id.eq.${profile.id},receiver_id.eq.${user.id})`)
      .maybeSingle()
    canMessage = Boolean(friendship) && (profile as { dm_privacy?: string | null }).dm_privacy !== 'none'
  }

  return <PublicUserProfileView profile={profile as never} isOwnProfile={profile.id === user.id} canMessage={canMessage} />
}
