import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string; requestId: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, requestId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: membership } = await supabase
    .from('study_room_members').select('role').eq('room_id', id).eq('user_id', user.id).maybeSingle()
  const role = (membership as { role: string } | null)?.role
  if (!role || !['owner','admin'].includes(role)) {
    return NextResponse.json({ error: 'Tidak punya izin.' }, { status: 403 })
  }

  let body: { action?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }
  const action = body.action === 'approve' ? 'approved' : 'rejected'

  const { data: req } = await supabase
    .from('study_room_join_requests').select('*').eq('id', requestId).eq('room_id', id).maybeSingle()
  if (!req) return NextResponse.json({ error: 'Request tidak ditemukan.' }, { status: 404 })

  await supabase
    .from('study_room_join_requests').update({ status: action }).eq('id', requestId)

  if (action === 'approved') {
    const reqRow = req as { user_id: string }
    const { error } = await supabase
      .from('study_room_members')
      .insert({ room_id: id, user_id: reqRow.user_id, role: 'member' })
    if (error && error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
