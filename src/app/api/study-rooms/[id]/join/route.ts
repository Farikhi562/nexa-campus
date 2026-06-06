import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: room } = await supabase.from('study_rooms').select('*').eq('id', id).single()
  if (!room) return NextResponse.json({ error: 'Room tidak ditemukan.' }, { status: 404 })

  const r = room as { status: string; current_members_count: number; max_members: number }
  if (r.status === 'closed')
    return NextResponse.json({ error: 'Room sudah ditutup.' }, { status: 400 })
  if (r.status === 'full' || r.current_members_count >= r.max_members)
    return NextResponse.json({ error: 'Room sudah penuh.' }, { status: 400 })

  const { error } = await supabase
    .from('study_room_members')
    .insert({ room_id: id, user_id: user.id, role: 'member' })

  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: 'Kamu sudah ada di room ini.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
