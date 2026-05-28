import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/profile
 * Get current user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to fetch existing profile
    const { data: profile, error: getError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (getError && getError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine
      return NextResponse.json({ error: getError.message }, { status: 500 })
    }

    // If no profile, create default one
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          avatar_url: user.user_metadata?.avatar_url || null,
          plan: 'free',
        })
        .select()
        .single()

      if (createError) {
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
 * Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const {
      full_name,
      whatsapp_number,
      avatar_url,
      jurusan,
      universitas,
      provinsi,
      profile_completed,
    } = await request.json()

    // Validate WhatsApp number format if provided
    if (whatsapp_number) {
      // Simple validation: should start with + or digits, minimal 10 chars
      const cleanNumber = whatsapp_number.replace(/\D/g, '')
      if (cleanNumber.length < 10) {
        return NextResponse.json(
          { error: 'Nomor WhatsApp tidak valid.' },
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
