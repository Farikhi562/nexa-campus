import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const NEXA_FOUNDER_EMAIL = 'fauzanalfa36@gmail.com'

function founderVerified(email: unknown) {
  return String(email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL
}

function dataClient<T>(fallback: T): T {
  try {
    return createServiceClient() as T
  } catch {
    return fallback
  }
}

function isMissingPrivateMessagesError(error: { message?: string; code?: string } | null | undefined) {
  const message = String(error?.message ?? '').toLowerCase()
  const code = String(error?.code ?? '')
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.includes('private_messages') &&
    (message.includes('schema cache') || message.includes('could not find') || message.includes('does not exist'))
  )
}

type Params = { params: Promise<{ friendId: string }> }

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

async function areFriends(supabase: SupabaseClient, userId: string, friendId: string) {
  const { data, error } = await supabase
    .from('friend_requests')
    .select('id')
    .eq('status', 'accepted')
    .or(`and(requester_id.eq.${userId},receiver_id.eq.${friendId}),and(requester_id.eq.${friendId},receiver_id.eq.${userId})`)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { friendId } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Login required.' }, { status: 401 })
    }

    if (friendId === user.id) {
      return NextResponse.json(
        { error: 'Tidak bisa chat diri sendiri. Itu namanya catatan pribadi, bukan fitur sosial.' },
        { status: 400 },
      )
    }

    const isFriend = await areFriends(supabase, user.id, friendId)
    if (!isFriend) {
      return NextResponse.json({ error: 'Chat pribadi hanya untuk teman yang sudah accepted.' }, { status: 403 })
    }

    const db = dataClient(supabase)
    const { data: friend, error: friendError } = await db
      .from('profiles')
      .select('id, email, founder_verified, full_name, avatar_url, campus_name, major, nexa_id, featured_badge, dm_privacy')
      .eq('id', friendId)
      .maybeSingle()

    if (friendError) {
      return NextResponse.json({ error: friendError.message }, { status: 500 })
    }

    if (!friend) {
      return NextResponse.json({ error: 'Teman tidak ditemukan.' }, { status: 404 })
    }

    const safeFriend = {
      ...(friend as Record<string, unknown>),
      email: null,
      founder_verified:
        founderVerified((friend as { email?: string | null }).email) ||
        Boolean((friend as { founder_verified?: boolean | null }).founder_verified),
    }

    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get('limit') ?? 60), 1), 100)
    const { data: messages, error } = await db
      .from('private_messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      if (isMissingPrivateMessagesError(error)) {
        return NextResponse.json(
          {
            error:
              'Tabel private_messages belum ada / belum kebaca schema cache. Jalankan SQL fix_chat_500_private_messages_repair.sql di Supabase, lalu reload schema.',
            code: error.code,
          },
          { status: 503 },
        )
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ friend: safeFriend, data: (messages ?? []).reverse() })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Chat gagal dibuka.' },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { friendId } = await params
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
    if (friendId === user.id) return NextResponse.json({ error: 'Tidak bisa chat diri sendiri.' }, { status: 400 })
    if (!await areFriends(supabase, user.id, friendId)) return NextResponse.json({ error: 'Chat pribadi hanya untuk teman.' }, { status: 403 })

    const db = dataClient(supabase)
    const { data: friend, error: friendError } = await db.from('profiles').select('dm_privacy').eq('id', friendId).maybeSingle()
    if (friendError) return NextResponse.json({ error: friendError.message }, { status: 500 })
    if ((friend as { dm_privacy?: string } | null)?.dm_privacy === 'none') {
      return NextResponse.json({ error: 'User ini mematikan chat pribadi.' }, { status: 403 })
    }

    let body: Record<string, unknown>
    try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }
    const content = typeof body.content === 'string' ? body.content.trim().slice(0, 2000) : ''
    const messageType = body.message_type === 'image' ? 'image' : body.message_type === 'video' ? 'video' : body.message_type === 'file' ? 'file' : 'text'
    if (!content && messageType === 'text') return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 })

    const { data, error } = await db
      .from('private_messages')
      .insert({
        sender_id: user.id,
        receiver_id: friendId,
        content: content || null,
        message_type: messageType,
        attachment_path: typeof body.attachment_path === 'string' ? body.attachment_path : null,
        attachment_name: typeof body.attachment_name === 'string' ? body.attachment_name : null,
        attachment_size: typeof body.attachment_size === 'number' ? body.attachment_size : null,
        attachment_mime: typeof body.attachment_mime === 'string' ? body.attachment_mime : null,
      })
      .select('*')
      .single()

    if (error) {
      if (isMissingPrivateMessagesError(error)) {
        return NextResponse.json(
          { error: 'Tabel private_messages belum siap. Jalankan SQL fix_chat_500_private_messages_repair.sql di Supabase.' },
          { status: 503 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await db.from('notifications').insert({
      user_id: friendId,
      type: 'direct_message',
      title: 'Chat pribadi baru',
      message: 'Ada pesan baru dari temanmu.',
      link: `/dashboard/messages/${user.id}`,
    })

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal mengirim chat.' },
      { status: 500 },
    )
  }
}
