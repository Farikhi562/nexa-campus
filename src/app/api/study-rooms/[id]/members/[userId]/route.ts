import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string; userId: string }> }

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: myMembership } = await supabase
    .from('study_room_members').select('role').eq('room_id', id).eq('user_id', user.id).maybeSingle()
  const myRole = (myMembership as { role: string } | null)?.role
  if (!myRole || !['owner','admin'].includes(myRole)) {
    return NextResponse.json({ error: 'Tidak punya izin.' }, { status: 403 })
  }

  let body: { role?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const newRole = body.role as string
  const allowedRoles = myRole === 'owner'
    ? ['admin','moderator','member']
    : ['moderator','member']
  if (!allowedRoles.includes(newRole)) {
    return NextResponse.json({ error: `Role '${newRole}' tidak valid atau butuh izin owner.` }, { status: 400 })
  }

  const { error } = await supabase
    .from('study_room_members').update({ role: newRole })
    .eq('room_id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id, userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: myMembership } = await supabase
    .from('study_room_members').select('role').eq('room_id', id).eq('user_id', user.id).maybeSingle()
  const myRole = (myMembership as { role: string } | null)?.role

  const isSelf = userId === user.id
  if (!isSelf && (!myRole || !['owner','admin'].includes(myRole))) {
    return NextResponse.json({ error: 'Tidak punya izin mengeluarkan member ini.' }, { status: 403 })
  }

  const { data: targetMembership } = await supabase
    .from('study_room_members').select('role').eq('room_id', id).eq('user_id', userId).maybeSingle()
  const targetRole = (targetMembership as { role: string } | null)?.role
  if (targetRole === 'owner' && !isSelf) {
    return NextResponse.json({ error: 'Owner tidak bisa dikeluarkan oleh admin.' }, { status: 400 })
  }
  if (targetRole === 'owner' && isSelf) {
    await supabase.from('study_rooms').update({ status: 'closed' }).eq('id', id)
  }

  const { error } = await supabase
    .from('study_room_members').delete().eq('room_id', id).eq('user_id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
