import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const NEXA_FOUNDER_EMAIL = 'fauzanalfa36@gmail.com'
function founderVerified(email: unknown) { return String(email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL }

function dataClient<T>(fallback: T): T {
  try {
    return createServiceClient() as T
  } catch {
    return fallback
  }
}

// GET /api/friends — my friends list + sent + received requests
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: requests, error } = await supabase
    .from('friend_requests')
    .select('*')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (requests ?? []) as Array<{
    id: string; requester_id: string; receiver_id: string
    status: string; created_at: string; updated_at: string
  }>

  // Collect IDs of other users to fetch their public profiles
  const otherIds = rows.map((r) => r.requester_id === user.id ? r.receiver_id : r.requester_id)
  const uniqueIds = Array.from(new Set(otherIds))
  let profileMap: Record<string, unknown> = {}
  if (uniqueIds.length > 0) {
    const db = dataClient(supabase)
    const { data: profiles } = await db
      .from('profiles')
      .select('id, email, founder_verified, full_name, campus_name, major, avatar_url, plan, nexa_id, featured_badge, public_profile_headline, profile_skills, profile_skills_visibility, online_status_visibility, dm_privacy, created_at')
      .in('id', uniqueIds)
    for (const p of profiles ?? []) {
      const row = p as { id: string; profile_skills_visibility?: string | null; profile_skills?: string[] | null }
      profileMap[row.id] = {
        ...row,
        email: null,
        founder_verified: founderVerified((row as { email?: string | null }).email) || Boolean((row as { founder_verified?: boolean | null }).founder_verified),
        profile_skills: row.profile_skills_visibility === 'private' ? [] : row.profile_skills ?? [],
      }
    }
  }

  const enriched = rows.map((r) => {
    const otherId = r.requester_id === user.id ? r.receiver_id : r.requester_id
    return { ...r, other_user: profileMap[otherId] ?? null }
  })

  const friends = enriched.filter((r) => r.status === 'accepted')
  const sent = enriched.filter((r) => r.requester_id === user.id && r.status === 'pending')
  const received = enriched.filter((r) => r.receiver_id === user.id && r.status === 'pending')

  return NextResponse.json({ friends, sent, received })
}
