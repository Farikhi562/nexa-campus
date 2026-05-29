import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS, type Plan, type Profile } from '@/types'
import { hasProAccess } from '@/lib/plans'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

/**
 * GET /api/study-rooms
 * List all rooms created by user + rooms user has joined
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get rooms created by user
    const { data: createdRooms } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })

    // Get rooms user has joined
    const { data: joinedRooms } = await supabase
      .from('room_participants')
      .select('study_rooms(*)')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false })

    const allRooms = [
      ...(createdRooms || []),
      ...(joinedRooms?.map((p: any) => p.study_rooms).filter(Boolean) || []),
    ]

    // Remove duplicates
    const uniqueRooms = Array.from(
      new Map(allRooms.map((r: any) => [r.id, r])).values()
    )

    return NextResponse.json(uniqueRooms)
  } catch (err) {
    console.error('[StudyRooms GET] Error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, documentId, isPrivate, roomPassword, maxMembers, bannerUrl, welcomeMessage, customName } = await request.json()

    if (!title?.trim() || !documentId) {
      return NextResponse.json({ error: 'title dan documentId wajib diisi.' }, { status: 400 })
    }

    // Basic can create public rooms. Private/custom rooms are Pro only.
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, seat_owner_id')
      .eq('id', user.id)
      .single()

    const plan = (profile?.plan ?? 'free') as Plan
    if (!PLAN_LIMITS[plan]?.canStudyRoom) {
      return NextResponse.json({ error: 'Buat Study Room tersedia mulai paket Basic.' }, { status: 403 })
    }

    const isPro = hasProAccess(profile as Pick<Profile, 'plan' | 'seat_owner_id'> | null)
    const requestedPrivate = Boolean(isPrivate)
    const requestedCustom = Boolean(String(bannerUrl || '').trim() || String(welcomeMessage || '').trim() || String(customName || '').trim())
    const normalizedMaxMembers = maxMembers === 'unlimited' ? 9999 : Number(maxMembers || 5)

    if ((requestedPrivate || requestedCustom || normalizedMaxMembers !== 5) && !isPro) {
      return NextResponse.json({ error: 'Room private, custom branding, dan pilihan max members khusus Pro.' }, { status: 403 })
    }

    if (requestedPrivate && !String(roomPassword || '').trim()) {
      return NextResponse.json({ error: 'Password wajib diisi untuk room private.' }, { status: 400 })
    }

    const { data: doc } = await supabase
      .from('documents')
      .select('id, status')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan atau belum selesai diproses.' }, { status: 404 })
    }

    // Generate unique room code (retry on collision)
    let roomCode = ''
    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateRoomCode()
      const { data: existing } = await supabase
        .from('study_rooms')
        .select('id')
        .eq('room_code', code)
        .single()

      if (!existing) { roomCode = code; break }
    }

    if (!roomCode) {
      return NextResponse.json({ error: 'Gagal membuat kode room unik. Coba lagi.' }, { status: 500 })
    }

    const { data: room, error } = await supabase
      .from('study_rooms')
      .insert({
        creator_id:  user.id,
        document_id: documentId,
        room_code:   roomCode,
        title:       title.trim(),
        is_private:  requestedPrivate,
        room_password: requestedPrivate ? String(roomPassword).trim() : null,
        max_members: isPro ? normalizedMaxMembers : 5,
        banner_url: isPro ? String(bannerUrl || '').trim() || null : null,
        welcome_message: isPro ? String(welcomeMessage || '').trim() || null : null,
        custom_name: isPro ? String(customName || '').trim() || null : null,
      })
      .select()
      .single()

    if (error || !room) {
      return NextResponse.json({ error: error?.message ?? 'Gagal membuat room.' }, { status: 500 })
    }

    // Auto-add creator as participant
    await supabase.from('room_participants').insert({
      room_id: room.id,
      user_id: user.id,
    })

    return NextResponse.json({ data: { roomId: room.id, roomCode } })
  } catch (err) {
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
