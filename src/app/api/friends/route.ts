import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, campus_name, major, avatar_url, plan, nexa_id, featured_badge, created_at')
      .in('id', uniqueIds)
    for (const p of profiles ?? []) profileMap[(p as { id: string }).id] = p
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
