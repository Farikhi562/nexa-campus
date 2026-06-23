import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function notifyFriendRequest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  receiverId: string,
  requesterId: string
) {
  const { data: requester } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', requesterId)
    .maybeSingle()

  const requesterName = (requester as { full_name?: string | null } | null)?.full_name || 'Mahasiswa NEXA'

  await supabase.from('notifications').insert({
    user_id: receiverId,
    type: 'friend_request',
    title: 'Permintaan pertemanan baru',
    message: `${requesterName} ingin berteman dengan kamu di NEXA Campus.`,
    link: '/dashboard/friends',
    is_read: false,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: { receiver_id?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const receiverId = typeof body.receiver_id === 'string' ? body.receiver_id.trim() : ''
  if (!receiverId) return NextResponse.json({ error: 'receiver_id diperlukan.' }, { status: 400 })
  if (receiverId === user.id) return NextResponse.json({ error: 'Tidak bisa add diri sendiri.' }, { status: 400 })

  const { data, error } = await supabase
    .from('friend_requests')
    .insert({ requester_id: user.id, receiver_id: receiverId, status: 'pending' })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Permintaan sudah pernah dikirim.' }, { status: 409 })
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  // Notifikasi tidak boleh menggagalkan proses tambah teman. Jika tabel belum dimigrasi, request tetap berjalan.
  try { await notifyFriendRequest(supabase, receiverId, user.id) } catch (error) { console.error('[Friend Request Notification]', error) }

  return NextResponse.json({ data }, { status: 201 })
}
