import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: { receiver_id?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const receiverId = typeof body.receiver_id === 'string' ? body.receiver_id.trim() : ''
  if (!receiverId) return NextResponse.json({ error: 'receiver_id diperlukan.' }, { status: 400 })
  if (receiverId === user.id)
    return NextResponse.json({ error: 'Tidak bisa add diri sendiri.' }, { status: 400 })

  const { data, error } = await supabase
    .from('friend_requests')
    .insert({ requester_id: user.id, receiver_id: receiverId, status: 'pending' })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505')
      return NextResponse.json({ error: 'Permintaan sudah pernah dikirim.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
