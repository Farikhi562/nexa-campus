import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: membership } = await supabase
    .from('study_room_members').select('role').eq('room_id', id).eq('user_id', user.id).maybeSingle()
  const role = (membership as { role: string } | null)?.role
  if (!role || !['owner','admin'].includes(role)) {
    return NextResponse.json({ error: 'Hanya owner/admin room yang bisa melihat join requests.' }, { status: 403 })
  }

  const { data: requests, error } = await supabase
    .from('study_room_join_requests').select('*').eq('room_id', id).eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (requests ?? []) as Array<{ user_id: string } & Record<string, unknown>>
  const userIds = rows.map((r) => r.user_id)
  let profiles: Record<string, unknown> = {}
  if (userIds.length > 0) {
    const { data: p } = await supabase
      .from('profiles').select('id, full_name, avatar_url, campus_name, major').in('id', userIds)
    for (const profile of p ?? []) profiles[(profile as { id: string }).id] = profile
  }

  return NextResponse.json({ data: rows.map((r) => ({ ...r, user: profiles[r.user_id] ?? null })) })
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: room } = await supabase.from('study_rooms').select('visibility,status').eq('id', id).single()
  if (!room) return NextResponse.json({ error: 'Room tidak ditemukan.' }, { status: 404 })

  const r = room as { visibility: string; status: string }
  if (r.status === 'closed') return NextResponse.json({ error: 'Room sudah ditutup.' }, { status: 400 })
  if (r.visibility !== 'private') return NextResponse.json({ error: 'Room publik bisa langsung join, tidak perlu request.' }, { status: 400 })

  const { data: existing } = await supabase
    .from('study_room_members').select('id').eq('room_id', id).eq('user_id', user.id).maybeSingle()
  if (existing) return NextResponse.json({ error: 'Kamu sudah member room ini.' }, { status: 409 })

  let body: { message?: unknown } = {}
  try { body = await request.json() } catch { /* no body is fine */ }

  const { data, error } = await supabase
    .from('study_room_join_requests')
    .insert({ room_id: id, user_id: user.id, message: typeof body.message === 'string' ? body.message.trim() || null : null })
    .select('*').single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Kamu sudah pernah request join room ini.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 201 })
}
