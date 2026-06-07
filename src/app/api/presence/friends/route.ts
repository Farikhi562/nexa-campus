import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: requests, error: reqError } = await supabase
    .from('friend_requests')
    .select('requester_id, receiver_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)

  if (reqError) return NextResponse.json({ error: reqError.message }, { status: 500 })

  const friendIds = Array.from(new Set((requests ?? []).map((r: { requester_id: string; receiver_id: string }) =>
    r.requester_id === user.id ? r.receiver_id : r.requester_id
  )))

  if (friendIds.length === 0) return NextResponse.json({ data: [] })

  const onlineSince = new Date(Date.now() - 90_000).toISOString()
  const { data: presence, error: presenceError } = await supabase
    .from('user_presence')
    .select('user_id, last_seen_at, current_path, current_room_id')
    .in('user_id', friendIds)
    .gte('last_seen_at', onlineSince)

  if (presenceError) return NextResponse.json({ error: presenceError.message }, { status: 500 })

  const onlineIds = Array.from(new Set((presence ?? []).map((p: { user_id: string }) => p.user_id)))
  if (onlineIds.length === 0) return NextResponse.json({ data: [] })

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, campus_name, major, featured_badge, online_status_visibility')
    .in('id', onlineIds)
    .neq('online_status_visibility', 'private')

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  const presenceMap = new Map((presence ?? []).map((p: Record<string, unknown>) => [String(p.user_id), p]))
  const data = (profiles ?? []).map((profile: Record<string, unknown>) => {
    const presenceRow = presenceMap.get(String(profile.id)) as { last_seen_at?: string | null } | undefined
    return {
      ...profile,
      last_seen_at: presenceRow?.last_seen_at ?? null,
    }
  })

  return NextResponse.json({ data })
}
