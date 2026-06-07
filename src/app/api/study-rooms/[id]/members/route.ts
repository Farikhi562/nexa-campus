import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: members, error } = await supabase
    .from('study_room_members').select('*').eq('room_id', id)
    .order('joined_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (members ?? []) as Array<{ user_id: string; role: string; joined_at: string; id: string }>
  const profileIds = rows.map((m) => m.user_id)
  let profiles: Record<string, unknown> = {}
  if (profileIds.length > 0) {
    const { data: p } = await supabase
      .from('profiles').select('id, full_name, avatar_url, campus_name, major, featured_badge, study_room_presence_visibility, dm_privacy')
      .in('id', profileIds)
    for (const profile of p ?? []) profiles[(profile as { id: string }).id] = profile
  }

  return NextResponse.json({
    data: rows.map((m) => ({ ...m, profile: profiles[m.user_id] ?? null }))
  })
}
