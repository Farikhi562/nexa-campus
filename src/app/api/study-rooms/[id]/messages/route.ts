import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const NEXA_FOUNDER_EMAIL = 'fauzanalfa36@gmail.com'
function founderVerified(email: unknown) { return String(email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL }

type Params = { params: Promise<{ id: string }> }

async function checkMembership(supabase: Awaited<ReturnType<typeof createClient>>, roomId: string, userId: string) {
  const { data } = await supabase
    .from('study_room_members').select('role')
    .eq('room_id', roomId).eq('user_id', userId).maybeSingle()
  return (data as { role: string } | null)?.role ?? null
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  if (!await checkMembership(supabase, id, user.id)) {
    return NextResponse.json({ error: 'Kamu bukan member room ini.' }, { status: 403 })
  }

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 50), 100)
  const before = request.nextUrl.searchParams.get('before')

  let query = supabase
    .from('study_room_messages')
    .select('*')
    .eq('room_id', id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (before) query = query.lt('created_at', before)

  const { data: messages, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const msgs = (messages ?? []).reverse()

  // Enrich with sender profile (safe fields only)
  const senderIds = Array.from(new Set(msgs.map((m: { sender_id: string }) => m.sender_id)))
  let profiles: Record<string, unknown> = {}
  if (senderIds.length > 0) {
    const { data: p } = await supabase
      .from('profiles').select('id, email, full_name, avatar_url, featured_badge, study_room_presence_visibility, dm_privacy')
      .in('id', senderIds)
    for (const profile of p ?? []) {
      const row = profile as Record<string, unknown> & { id: string }
      profiles[row.id] = { ...row, email: null, founder_verified: founderVerified(row.email) }
    }
  }

  const enriched = msgs.map((m: Record<string, unknown>) => ({
    ...m,
    sender: profiles[m.sender_id as string] ?? null,
  }))

  return NextResponse.json({ data: enriched })
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  if (!await checkMembership(supabase, id, user.id)) {
    return NextResponse.json({ error: 'Kamu bukan member room ini.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const content = typeof body.content === 'string' ? body.content.trim() : ''
  const messageType = body.message_type === 'image' ? 'image' : body.message_type === 'video' ? 'video' : body.message_type === 'file' ? 'file' : 'text'

  if (!content && messageType === 'text') {
    return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('study_room_messages')
    .insert({
      room_id: id,
      sender_id: user.id,
      content: content || null,
      message_type: messageType,
      attachment_path: typeof body.attachment_path === 'string' ? body.attachment_path : null,
      attachment_name: typeof body.attachment_name === 'string' ? body.attachment_name : null,
      attachment_size: typeof body.attachment_size === 'number' ? body.attachment_size : null,
      attachment_mime: typeof body.attachment_mime === 'string' ? body.attachment_mime : null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
