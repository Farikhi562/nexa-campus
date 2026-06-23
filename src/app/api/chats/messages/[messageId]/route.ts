import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type Params = { params: Promise<{ messageId: string }> }
type SupabaseClient = Awaited<ReturnType<typeof createClient>>

function getDataClient(fallback: SupabaseClient): SupabaseClient {
  try {
    return createServiceClient() as unknown as SupabaseClient
  } catch {
    return fallback
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { messageId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  const db = getDataClient(supabase)

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }
  const content = typeof body.content === 'string' ? body.content.trim().slice(0, 2000) : ''
  if (!content) return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 })

  const { data: msg, error: readError } = await db
    .from('private_messages')
    .select('id, sender_id, message_type, deleted_at')
    .eq('id', messageId)
    .maybeSingle()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
  if (!msg) return NextResponse.json({ error: 'Pesan tidak ditemukan.' }, { status: 404 })
  if ((msg as { sender_id: string }).sender_id !== user.id) return NextResponse.json({ error: 'Hanya pengirim yang bisa edit pesan.' }, { status: 403 })
  if ((msg as { message_type: string }).message_type !== 'text') return NextResponse.json({ error: 'Media/file tidak bisa diedit.' }, { status: 400 })
  if ((msg as { deleted_at?: string | null }).deleted_at) return NextResponse.json({ error: 'Pesan sudah dihapus.' }, { status: 400 })

  const { data, error } = await db
    .from('private_messages')
    .update({ content, edited_at: new Date().toISOString() })
    .eq('id', messageId)
    .select('*')
    .single()
  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const { messageId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  const db = getDataClient(supabase)

  const { data: msg, error: readError } = await db
    .from('private_messages')
    .select('*')
    .eq('id', messageId)
    .maybeSingle()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 })
  if (!msg) return NextResponse.json({ error: 'Pesan tidak ditemukan.' }, { status: 404 })

  const row = msg as { sender_id: string; attachment_path?: string | null }
  if (row.sender_id !== user.id) return NextResponse.json({ error: 'Hanya pengirim yang bisa hapus pesan.' }, { status: 403 })

  if (row.attachment_path) await db.storage.from('private-chat-attachments').remove([row.attachment_path])

  const { data, error } = await db
    .from('private_messages')
    .update({
      content: '[Pesan dihapus]',
      message_type: 'text',
      attachment_path: null,
      attachment_name: null,
      attachment_size: null,
      attachment_type: null,
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq('id', messageId)
    .select('*')
    .single()
  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  return NextResponse.json({ data })
}
