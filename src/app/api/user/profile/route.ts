import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error: getError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (getError) {
      return NextResponse.json({ error: getError.message }, { status: 500 })
    }

    if (!profile) {
      // Auto-create profile for new users (fixes new user bug)
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          plan: 'free',
          profile_completed: false,
        })
        .select()
        .single()

      if (createError) {
        // Profile might have been created by another concurrent request
        const { data: retryProfile } = await supabase
          .from('profiles').select('*').eq('id', user.id).single()
        if (retryProfile) return NextResponse.json(retryProfile)
        return NextResponse.json({ error: createError.message }, { status: 500 })
      }

      return NextResponse.json(newProfile)
    }

    return NextResponse.json(profile)
  } catch (err) {
    console.error('[Profile GET] Error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

/**
 * PUT /api/user/profile
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))

    const {
      full_name,
      whatsapp_number,
      avatar_url,
      jurusan,
      universitas,
      provinsi,
      profile_completed,
    } = body

    // Validate WhatsApp number if provided
    if (whatsapp_number) {
      const cleanNumber = whatsapp_number.replace(/\D/g, '')
      if (cleanNumber.length < 10) {
        return NextResponse.json(
          { error: 'Nomor WhatsApp tidak valid.' },
          { status: 400 }
        )
      }
    }

    // Validate avatar URL if provided
    if (avatar_url && typeof avatar_url === 'string') {
      if (!avatar_url.startsWith('https://')) {
        return NextResponse.json(
          { error: 'URL avatar tidak valid.' },
          { status: 400 }
        )
      }
    }

    const updates: Record<string, unknown> = {}
    if (full_name !== undefined) updates.full_name = full_name
    if (whatsapp_number !== undefined) updates.whatsapp_number = whatsapp_number
    if (avatar_url !== undefined) updates.avatar_url = avatar_url
    if (jurusan !== undefined) updates.jurusan = jurusan
    if (universitas !== undefined) updates.universitas = universitas
    if (provinsi !== undefined) updates.provinsi = provinsi
    if (profile_completed !== undefined) updates.profile_completed = profile_completed
    updates.updated_at = new Date().toISOString()

    const serviceClient = createServiceClient()
    const { data: profile, error } = await serviceClient
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email || '',
        plan: 'free',
        ...updates,
      }, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch (err) {
    console.error('[Profile PUT] Error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
