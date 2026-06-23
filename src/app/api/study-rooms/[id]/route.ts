import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: room, error } = await supabase
    .from('study_rooms').select('*').eq('id', id).single()
  if (error || !room) return NextResponse.json({ error: 'Room tidak ditemukan.' }, { status: 404 })

  const r = room as { visibility: string }
  const { data: membership } = await supabase
    .from('study_room_members').select('role')
    .eq('room_id', id).eq('user_id', user.id).maybeSingle()

  if (r.visibility === 'private' && !membership) {
    const { data: req } = await supabase
      .from('study_room_join_requests').select('status')
      .eq('room_id', id).eq('user_id', user.id).maybeSingle()
    return NextResponse.json({
      data: { ...room, is_member: false, member_role: null, has_pending_request: req?.status === 'pending' }
    })
  }

  return NextResponse.json({
    data: {
      ...room,
      is_member: !!membership,
      member_role: (membership as { role: string } | null)?.role ?? null,
      has_pending_request: false,
    }
  })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: membership } = await supabase
    .from('study_room_members').select('role')
    .eq('room_id', id).eq('user_id', user.id).maybeSingle()
  const role = (membership as { role: string } | null)?.role
  if (!role || !['owner', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Hanya owner/admin room yang bisa mengubah detail room.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const allowed = ['title','description','topic','category','max_members','visibility','status','cover_url','scheduled_at']
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Tidak ada field yang diubah.' }, { status: 400 })
  }
  if (role === 'admin') {
    delete updates['status']
    delete updates['visibility']
    delete updates['max_members']
  }

  const { data, error } = await supabase
    .from('study_rooms').update(updates).eq('id', id).select('*').single()
  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: membership } = await supabase
    .from('study_room_members').select('role')
    .eq('room_id', id).eq('user_id', user.id).maybeSingle()
  if ((membership as { role: string } | null)?.role !== 'owner') {
    return NextResponse.json({ error: 'Hanya owner yang bisa menghapus room.' }, { status: 403 })
  }

  const { error } = await supabase.from('study_rooms').delete().eq('id', id)
  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
