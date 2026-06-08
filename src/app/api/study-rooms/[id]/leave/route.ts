import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

type RoomMemberRow = {
  user_id: string
  role: 'owner' | 'admin' | 'moderator' | 'member'
  joined_at: string
}

const ROLE_WEIGHT: Record<RoomMemberRow['role'], number> = {
  owner: 0,
  admin: 1,
  moderator: 2,
  member: 3,
}

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

  await supabase
    .from('study_room_members')
    .update({ role: 'owner' })
    .eq('room_id', roomId)
    .eq('user_id', nextOwner.user_id)

  await supabase
    .from('study_rooms')
    .update({ owner_id: nextOwner.user_id, status: 'open' })
    .eq('id', roomId)

  return { transferredTo: nextOwner.user_id }
}

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: membership } = await supabase
    .from('study_room_members')
    .select('role')
    .eq('room_id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!membership) return NextResponse.json({ error: 'Kamu tidak ada di room ini.' }, { status: 404 })

  const role = (membership as { role: string }).role

  try {
    const transfer = await transferOwnerIfNeeded(supabase, id, user.id, role)

    const { error } = await supabase
      .from('study_room_members')
      .delete()
      .eq('room_id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, owner_transferred_to: transfer.transferredTo })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Gagal keluar room.' }, { status: 500 })
  }
}
