import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string; messageId: string }> }

async function getMembership(supabase: Awaited<ReturnType<typeof createClient>>, roomId: string, userId: string) {
  const { data } = await supabase
    .from('study_room_members')
    .select('role')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle()
  return (data as { role: string } | null)?.role ?? null
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id, messageId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const role = await getMembership(supabase, id, user.id)
  if (!role) return NextResponse.json({ error: 'Kamu bukan member room ini.' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }
  const content = typeof body.content === 'string' ? body.content.trim().slice(0, 2000) : ''
  if (!content) return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 })

  const { data: msg, error: readError } = await supabase
    .from('study_room_messages')
    .select('id, sender_id, message_type, deleted_at')
    .eq('id', messageId)
    .eq('room_id', id)
    .maybeSingle()

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
  if (!msg) return NextResponse.json({ error: 'Pesan tidak ditemukan.' }, { status: 404 })
  if ((msg as { sender_id: string }).sender_id !== user.id) return NextResponse.json({ error: 'Hanya pengirim yang bisa edit pesan.' }, { status: 403 })
  if ((msg as { message_type: string }).message_type !== 'text') return NextResponse.json({ error: 'File/foto/video tidak bisa diedit. Hapus lalu kirim ulang.' }, { status: 400 })
  if ((msg as { deleted_at?: string | null }).deleted_at) return NextResponse.json({ error: 'Pesan sudah dihapus.' }, { status: 400 })

  const { data, error } = await supabase
    .from('study_room_messages')
    .update({ content, edited_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('room_id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { id, messageId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const role = await getMembership(supabase, id, user.id)
  if (!role) return NextResponse.json({ error: 'Kamu bukan member room ini.' }, { status: 403 })

  const { data: msg, error: readError } = await supabase
    .from('study_room_messages')
    .select('*')
    .eq('id', messageId)
    .eq('room_id', id)
    .maybeSingle()

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
  if (!msg) return NextResponse.json({ error: 'Pesan tidak ditemukan.' }, { status: 404 })

  const row = msg as { sender_id: string; attachment_path?: string | null }
  const canDelete = row.sender_id === user.id || role === 'owner' || role === 'admin' || role === 'moderator'
  if (!canDelete) return NextResponse.json({ error: 'Tidak punya akses menghapus pesan ini.' }, { status: 403 })

  if (row.attachment_path) {
    await supabase.storage.from('room-attachments').remove([row.attachment_path])
  }

  const { data, error } = await supabase
    .from('study_room_messages')
    .update({
      content: null,
      message_type: 'text',
      attachment_path: null,
      attachment_name: null,
      attachment_size: null,
      attachment_mime: null,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .eq('room_id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
