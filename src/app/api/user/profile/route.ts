import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function optionalServiceClient() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null
    return createServiceClient()
  } catch (error) {
    console.error('[Profile API] Service client unavailable:', error)
    return null
  }
}

function nullableText(value: unknown) {
  if (value === undefined) return undefined
  if (value === null) return null
  const text = String(value).trim()
  return text.length ? text : null
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  return { supabase, user, error }
}

export async function GET() {
  try {
    const { supabase, user, error: userError } = await getAuthenticatedUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const authUser = user

    const admin = optionalServiceClient()
    const db = admin ?? supabase

    const { data: profile, error: getError } = await db
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (getError) {
      console.error('[Profile GET] Fetch error:', getError)
      return NextResponse.json({ error: getError.message }, { status: 500 })
    }

    if (profile) return NextResponse.json(profile)

    const { data: newProfile, error: createError } = await db
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        jurusan: null,
        universitas: null,
        provinsi: null,
        plan: 'free',
        telegram_chat_id: null,
        profile_completed: false,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('[Profile GET] Create error:', createError)
      return NextResponse.json({ error: createError.message }, { status: 500 })
    }

    return NextResponse.json(newProfile)
  } catch (error) {
    console.error('[Profile GET] Error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { supabase, user, error: userError } = await getAuthenticatedUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const authUser = user

    const body = await request.json().catch(() => ({}))

    const telegramChatId = nullableText(body.telegram_chat_id)
    if (typeof telegramChatId === 'string' && !/^-?\d{5,20}$/.test(telegramChatId)) {
      return NextResponse.json(
        { error: 'Telegram chat_id tidak valid. Chat /start ke @NEXATchBot lalu masukkan chat_id angka.' },
        { status: 400 }
      )
    }

    const avatarUrl = nullableText(body.avatar_url)
    if (typeof avatarUrl === 'string' && !avatarUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'URL avatar tidak valid.' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    const fullName = nullableText(body.full_name)
    const jurusan = nullableText(body.jurusan)
    const universitas = nullableText(body.universitas)
    const provinsi = nullableText(body.provinsi)

    if (fullName !== undefined) updates.full_name = fullName
    if (telegramChatId !== undefined) updates.telegram_chat_id = telegramChatId
    if (avatarUrl !== undefined) updates.avatar_url = avatarUrl
    if (jurusan !== undefined) updates.jurusan = jurusan
    if (universitas !== undefined) updates.universitas = universitas
    if (provinsi !== undefined) updates.provinsi = provinsi
    if (body.profile_completed !== undefined) updates.profile_completed = Boolean(body.profile_completed)

    const admin = optionalServiceClient()

    const saveWith = async (db: typeof supabase) => {
      const { data: existing, error: existingError } = await db
        .from('profiles')
        .select('id, plan')
        .eq('id', authUser.id)
        .maybeSingle()

      if (existingError) return { data: null, error: existingError }

      if (existing) {
        return db
          .from('profiles')
          .update(updates)
          .eq('id', authUser.id)
          .select()
          .single()
      }

      return db
        .from('profiles')
        .insert({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
          avatar_url: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
          jurusan: null,
          universitas: null,
          provinsi: null,
          plan: 'free',
          telegram_chat_id: null,
          profile_completed: false,
          ...updates,
        })
        .select()
        .single()
    }

    let result = await saveWith(supabase)

    if (result.error && admin) {
      console.error('[Profile PUT] User client save failed, retrying admin:', result.error)
      result = await saveWith(admin)
    }

    if (result.error) {
      console.error('[Profile PUT] Save error:', result.error)
      return NextResponse.json(
        {
          error: result.error.message,
          hint: 'Pastikan SUPABASE_SERVICE_ROLE_KEY terisi di production, atau RLS profiles mengizinkan user update baris miliknya sendiri.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('[Profile PUT] Error:', error)
    const message = error instanceof Error ? error.message : 'Terjadi kesalahan server.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
