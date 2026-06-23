import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

async function notifyFriendAccepted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  requesterId: string,
  receiverId: string
) {
  const { data: receiver } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', receiverId)
    .maybeSingle()

  const receiverName = (receiver as { full_name?: string | null } | null)?.full_name || 'Mahasiswa NEXA'

  await supabase.from('notifications').insert({
    user_id: requesterId,
    type: 'friend_accepted',
    title: 'Permintaan pertemanan diterima',
    message: `${receiverName} menerima permintaan pertemanan kamu.`,
    link: '/dashboard/friends',
    is_read: false,
  })
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: { action?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const action = typeof body.action === 'string' ? body.action : ''
  if (!['accept', 'reject'].includes(action))
    return NextResponse.json({ error: 'action harus "accept" atau "reject".' }, { status: 400 })

  // Only receiver can accept/reject
  const { data, error } = await supabase
    .from('friend_requests')
    .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
    .eq('id', id)
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .select('id, requester_id, receiver_id, status')
    .maybeSingle()

  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  if (action === 'accept' && data?.requester_id) {
    try { await notifyFriendAccepted(supabase, data.requester_id as string, user.id) } catch (error) { console.error('[Friend Accepted Notification]', error) }
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { error } = await supabase
    .from('friend_requests')
    .delete()
    .eq('id', id)
    .eq('requester_id', user.id)

  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
