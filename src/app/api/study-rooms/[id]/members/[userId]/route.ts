import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string; userId: string }> }
type RoomRole = 'owner' | 'admin' | 'moderator' | 'member'
type RoomMemberRow = { user_id: string; role: RoomRole; joined_at: string }

const ROLE_WEIGHT: Record<RoomRole, number> = { owner: 0, admin: 1, moderator: 2, member: 3 }

async function transferOwnerIfNeeded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  roomId: string,
  leavingUserId: string,
  leavingRole: string,
) {
  if (leavingRole !== 'owner') return { transferredTo: null as string | null }

  const { data: remaining, error } = await supabase
    .from('study_room_members')
    .select('user_id, role, joined_at')
    .eq('room_id', roomId)
    .neq('user_id', leavingUserId)
  if (error) throw new Error(error.message)

  const nextOwner = ((remaining ?? []) as RoomMemberRow[])
    .sort((a, b) => {
      const byRole = ROLE_WEIGHT[a.role] - ROLE_WEIGHT[b.role]
      if (byRole !== 0) return byRole
      return new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
    })[0]

  if (!nextOwner) {
    await supabase.from('study_rooms').update({ status: 'closed' }).eq('id', roomId)
    return { transferredTo: null }
  }

  await supabase.from('study_room_members').update({ role: 'owner' }).eq('room_id', roomId).eq('user_id', nextOwner.user_id)
  await supabase.from('study_rooms').update({ owner_id: nextOwner.user_id, status: 'open' }).eq('id', roomId)
  return { transferredTo: nextOwner.user_id }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, userId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: myMembership } = await supabase
    .from('study_room_members').select('role').eq('room_id', id).eq('user_id', user.id).maybeSingle()
  const myRole = (myMembership as { role: RoomRole } | null)?.role
  if (!myRole || !['owner','admin'].includes(myRole)) {
    return NextResponse.json({ error: 'Tidak punya izin.' }, { status: 403 })
  }

  let body: { role?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const newRole = body.role as RoomRole
  const allowedRoles: RoomRole[] = myRole === 'owner'
    ? ['owner','admin','moderator','member']
    : ['moderator','member']
  if (!allowedRoles.includes(newRole)) {
    return NextResponse.json({ error: `Role '${newRole}' tidak valid atau butuh izin owner.` }, { status: 400 })
  }
  if (userId === user.id && newRole !== 'owner') {
    return NextResponse.json({ error: 'Owner tidak bisa menurunkan dirinya sendiri dari menu role. Transfer owner ke anggota lain dulu atau keluar room.' }, { status: 400 })
  }

  const { data: targetMembership } = await supabase
    .from('study_room_members').select('role').eq('room_id', id).eq('user_id', userId).maybeSingle()
  if (!targetMembership) return NextResponse.json({ error: 'Anggota tidak ditemukan.' }, { status: 404 })

  if (newRole === 'owner') {
    // Single-owner rule: owner lama turun jadi admin, target jadi owner.
    // Jadi mantan owner bisa jadi owner lagi kalau dipromosikan. Drama kerajaan, tapi versi SQL.
    const { error: demoteError } = await supabase
      .from('study_room_members')
      .update({ role: 'admin' })
      .eq('room_id', id)
      .eq('role', 'owner')
      .neq('user_id', userId)
    if (demoteError) return NextResponse.json({ error: demoteError.message }, { status: 500 })

    const { error: promoteError } = await supabase
      .from('study_room_members')
      .update({ role: 'owner' })
      .eq('room_id', id)
      .eq('user_id', userId)
    if (promoteError) return NextResponse.json({ error: promoteError.message }, { status: 500 })

    await supabase.from('study_rooms').update({ owner_id: userId, status: 'open' }).eq('id', id)
    return NextResponse.json({ ok: true, owner_transferred_to: userId })
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
  const myRole = (myMembership as { role: RoomRole } | null)?.role

  const isSelf = userId === user.id
  if (!isSelf && (!myRole || !['owner','admin'].includes(myRole))) {
    return NextResponse.json({ error: 'Tidak punya izin mengeluarkan member ini.' }, { status: 403 })
  }

  const { data: targetMembership } = await supabase
    .from('study_room_members').select('role').eq('room_id', id).eq('user_id', userId).maybeSingle()
  const targetRole = (targetMembership as { role: RoomRole } | null)?.role
  if (!targetRole) return NextResponse.json({ error: 'Anggota tidak ditemukan.' }, { status: 404 })

  if (targetRole === 'owner' && !isSelf) {
    return NextResponse.json({ error: 'Owner tidak bisa dikeluarkan. Transfer owner dulu kalau perlu.' }, { status: 400 })
  }

  try {
    const transfer = await transferOwnerIfNeeded(supabase, id, userId, targetRole)
    const { error } = await supabase
      .from('study_room_members').delete().eq('room_id', id).eq('user_id', userId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, owner_transferred_to: transfer.transferredTo })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Gagal mengeluarkan member.' }, { status: 500 })
  }
}
