import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

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

  // If owner leaves → close the room
  if ((membership as { role: string }).role === 'owner') {
    await supabase.from('study_rooms').update({ status: 'closed' }).eq('id', id)
  }

  const { error } = await supabase
    .from('study_room_members')
    .delete()
    .eq('room_id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
