import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const NEXA_FOUNDER_EMAIL = 'fauzanalfa36@gmail.com'
const MAX_LIMIT = 100
const DEFAULT_LIMIT = 60
const MAX_TEXT_LENGTH = 2000

type Params = {
  params: Promise<{ friendId: string }> | { friendId: string }
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type SupabaseErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

type PrivateMessageRow = {
  id: string
  sender_id: string
  receiver_id: string
  content: string | null
  message_type: 'text' | 'emoji' | 'image' | 'video' | 'file'
  attachment_url?: string | null
  attachment_path?: string | null
  attachment_name?: string | null
  attachment_type?: string | null
  attachment_size?: number | null
  is_edited?: boolean | null
  edited_at?: string | null
  is_deleted?: boolean | null
  deleted_at?: string | null
  deleted_by?: string | null
  created_at: string
  updated_at?: string | null
}

function founderVerified(email: unknown) {
  return String(email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function getDataClient(fallback: SupabaseClient): SupabaseClient {
  try {
    return createServiceClient() as unknown as SupabaseClient
  } catch {
    return fallback
  }
}

function normalizeMessage(row: PrivateMessageRow) {
  return {
    ...row,

    // Backward compatibility buat frontend lama yang masih baca attachment_mime.
    // Di database yang benar kolomnya attachment_type.
    attachment_mime: row.attachment_type ?? null,
  }
}

function isMissingPrivateMessagesError(error: SupabaseErrorLike | null | undefined) {
  const code = String(error?.code ?? '')
  const message = String(error?.message ?? '').toLowerCase()
  const details = String(error?.details ?? '').toLowerCase()
  const hint = String(error?.hint ?? '').toLowerCase()

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    message.includes('private_messages') ||
    details.includes('private_messages') ||
    hint.includes('private_messages')
  )
}

function errorResponse(label: string, error: SupabaseErrorLike, status = 500) {
  console.error(label, {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint,
  })

  if (isMissingPrivateMessagesError(error)) {
    return NextResponse.json(
      {
        error:
          'Tabel private_messages belum kebaca Supabase REST. Pastikan tabel public.private_messages ada, lalu jalankan notify pgrst, reload schema.',
        code: error.code,
        details: error.details,
        hint: error.hint,
      },
      { status: 503 },
    )
  }

  return NextResponse.json(
    {
      error: error.message || 'Terjadi kesalahan database.',
      code: error.code,
      details: error.details,
      hint: error.hint,
    },
    { status },
  )
}

async function areFriends(db: SupabaseClient, userId: string, friendId: string) {
  const { data, error } = await db
    .from('friend_requests')
    .select('id')
    .eq('status', 'accepted')
    .or(
      `and(requester_id.eq.${userId},receiver_id.eq.${friendId}),and(requester_id.eq.${friendId},receiver_id.eq.${userId})`,
    )
    .maybeSingle()

  if (error) {
    console.error('[PrivateChat] friend check error', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    })

    throw error
  }

  return Boolean(data)
}

async function getCurrentUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, error }
  }

  return { user, error: null }
}

function cleanMessageType(value: unknown): 'text' | 'emoji' | 'image' | 'video' | 'file' {
  if (value === 'emoji') return 'emoji'
  if (value === 'image') return 'image'
  if (value === 'video') return 'video'
  if (value === 'file') return 'file'
  return 'text'
}

export async function GET(request: NextRequest, context: Params) {
  try {
    const { friendId } = await context.params

    if (!isValidUuid(friendId)) {
      return NextResponse.json({ error: 'friendId tidak valid.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { user, error: userError } = await getCurrentUser(supabase)

    if (userError || !user) {
      return NextResponse.json({ error: 'Login required.' }, { status: 401 })
    }

    if (friendId === user.id) {
      return NextResponse.json(
        {
          error:
            'Tidak bisa chat diri sendiri. Itu namanya catatan pribadi, bukan fitur sosial.',
        },
        { status: 400 },
      )
    }

    const db = getDataClient(supabase)

    const isFriend = await areFriends(db, user.id, friendId)

    if (!isFriend) {
      return NextResponse.json(
        { error: 'Chat pribadi hanya untuk teman yang sudah accepted.' },
        { status: 403 },
      )
    }

    const { data: friend, error: friendError } = await db
      .from('profiles')
      .select(
        `
        id,
        email,
        founder_verified,
        full_name,
        avatar_url,
        campus_name,
        major,
        semester,
        nexa_id,
        featured_badge,
        badges,
        dm_privacy
      `,
      )
      .eq('id', friendId)
      .maybeSingle()

    if (friendError) {
      return errorResponse('[PrivateChat] friend profile error', friendError)
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

    const rawLimit = Number(request.nextUrl.searchParams.get('limit') ?? DEFAULT_LIMIT)
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : DEFAULT_LIMIT, 1), MAX_LIMIT)

    const { data: messages, error } = await db
      .from('private_messages')
      .select(
        `
        id,
        sender_id,
        receiver_id,
        content,
        message_type,
        attachment_url,
        attachment_path,
        attachment_name,
        attachment_type,
        attachment_size,
        is_edited,
        edited_at,
        is_deleted,
        deleted_at,
        deleted_by,
        created_at,
        updated_at
      `,
      )
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`,
      )
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return errorResponse('[PrivateChat] private_messages select error', error)
    }

    const normalizedMessages = ((messages ?? []) as PrivateMessageRow[])
      .reverse()
      .map(normalizeMessage)

    return NextResponse.json({
      friend: safeFriend,
      data: normalizedMessages,
      messages: normalizedMessages,
    })
  } catch (error) {
    console.error('[PrivateChat] GET fatal error', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Chat gagal dibuka.',
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, context: Params) {
  try {
    const { friendId } = await context.params

    if (!isValidUuid(friendId)) {
      return NextResponse.json({ error: 'friendId tidak valid.' }, { status: 400 })
    }

    const supabase = await createClient()
    const { user, error: userError } = await getCurrentUser(supabase)

    if (userError || !user) {
      return NextResponse.json({ error: 'Login required.' }, { status: 401 })
    }

    if (friendId === user.id) {
      return NextResponse.json({ error: 'Tidak bisa chat diri sendiri.' }, { status: 400 })
    }

    const db = getDataClient(supabase)

    const isFriend = await areFriends(db, user.id, friendId)

    if (!isFriend) {
      return NextResponse.json(
        { error: 'Chat pribadi hanya untuk teman yang sudah accepted.' },
        { status: 403 },
      )
    }

    const { data: friend, error: friendError } = await db
      .from('profiles')
      .select('id, dm_privacy')
      .eq('id', friendId)
      .maybeSingle()

    if (friendError) {
      return errorResponse('[PrivateChat] friend dm_privacy error', friendError)
    }

    if (!friend) {
      return NextResponse.json({ error: 'Teman tidak ditemukan.' }, { status: 404 })
    }

    if ((friend as { dm_privacy?: string | null }).dm_privacy === 'none') {
      return NextResponse.json({ error: 'User ini mematikan chat pribadi.' }, { status: 403 })
    }

    let body: Record<string, unknown>

    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const content =
      typeof body.content === 'string'
        ? body.content.trim().slice(0, MAX_TEXT_LENGTH)
        : ''

    const messageType = cleanMessageType(body.message_type)

    const attachmentPath =
      typeof body.attachment_path === 'string' && body.attachment_path.trim()
        ? body.attachment_path.trim()
        : null

    const attachmentUrl =
      typeof body.attachment_url === 'string' && body.attachment_url.trim()
        ? body.attachment_url.trim()
        : typeof body.public_url === 'string' && body.public_url.trim()
          ? body.public_url.trim()
          : null

    const attachmentName =
      typeof body.attachment_name === 'string' && body.attachment_name.trim()
        ? body.attachment_name.trim().slice(0, 255)
        : null

    const attachmentType =
      typeof body.attachment_type === 'string' && body.attachment_type.trim()
        ? body.attachment_type.trim().slice(0, 255)
        : typeof body.attachment_mime === 'string' && body.attachment_mime.trim()
          ? body.attachment_mime.trim().slice(0, 255)
          : typeof body.mime_type === 'string' && body.mime_type.trim()
            ? body.mime_type.trim().slice(0, 255)
            : null

    const attachmentSize =
      typeof body.attachment_size === 'number' && Number.isFinite(body.attachment_size)
        ? body.attachment_size
        : typeof body.file_size === 'number' && Number.isFinite(body.file_size)
          ? body.file_size
          : null

    const hasAttachment = Boolean(attachmentPath || attachmentUrl)

    if ((messageType === 'text' || messageType === 'emoji') && !content) {
      return NextResponse.json({ error: 'Pesan tidak boleh kosong.' }, { status: 400 })
    }

    if ((messageType === 'image' || messageType === 'video' || messageType === 'file') && !hasAttachment) {
      return NextResponse.json(
        { error: 'Attachment belum ada. Upload file dulu sebelum kirim media.' },
        { status: 400 },
      )
    }

    const payload = {
      sender_id: user.id,
      receiver_id: friendId,
      content: content || attachmentName || null,
      message_type: messageType,
      attachment_url: attachmentUrl,
      attachment_path: attachmentPath,
      attachment_name: attachmentName,
      attachment_type: attachmentType,
      attachment_size: attachmentSize,
    }

    const { data, error } = await db
      .from('private_messages')
      .insert(payload)
      .select(
        `
        id,
        sender_id,
        receiver_id,
        content,
        message_type,
        attachment_url,
        attachment_path,
        attachment_name,
        attachment_type,
        attachment_size,
        is_edited,
        edited_at,
        is_deleted,
        deleted_at,
        deleted_by,
        created_at,
        updated_at
      `,
      )
      .single()

    if (error) {
      return errorResponse('[PrivateChat] private_messages insert error', error)
    }

    const normalizedMessage = normalizeMessage(data as PrivateMessageRow)

    try {
      await db.from('notifications').insert({
        user_id: friendId,
        type: 'direct_message',
        title: 'Chat pribadi baru',
        message: 'Ada pesan baru dari temanmu.',
        link: `/dashboard/messages/${user.id}`,
        is_read: false,
        metadata: {
          sender_id: user.id,
          message_id: normalizedMessage.id,
        },
      })
    } catch (notificationError) {
      console.error('[PrivateChat] notification insert ignored', notificationError)
    }

    return NextResponse.json(
      {
        data: normalizedMessage,
        message: normalizedMessage,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[PrivateChat] POST fatal error', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Gagal mengirim chat.',
      },
      { status: 500 },
    )
  }
}