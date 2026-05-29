import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomCode, password } = await request.json()

    if (!roomCode?.trim()) {
      return NextResponse.json({ error: 'Kode room wajib diisi.' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Find room by code in a trusted server context. RLS should not expose all room codes.
    const { data: room } = await serviceClient
      .from('study_rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase().trim())
      .single()

    if (!room) {
      return NextResponse.json({ error: 'Kode room tidak ditemukan. Periksa kembali.' }, { status: 404 })
    }

    if (!room.is_active) {
      return NextResponse.json({ error: 'Room ini sudah tidak aktif.' }, { status: 422 })
    }

    if (new Date(room.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Room sudah kadaluarsa.' }, { status: 422 })
    }

    if (room.is_private && String(room.room_password || '') !== String(password || '').trim()) {
      return NextResponse.json({ error: 'Password room private salah.' }, { status: 403 })
    }

    const { count } = await serviceClient
      .from('room_participants')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', room.id)

    if ((room.max_members ?? 5) < 9999 && (count ?? 0) >= (room.max_members ?? 5)) {
      return NextResponse.json({ error: 'Room sudah penuh.' }, { status: 422 })
    }

    // Add participant (upsert = ignore if already joined)
    await serviceClient.from('room_participants').upsert(
      { room_id: room.id, user_id: user.id },
      { onConflict: 'room_id,user_id' }
    )

    return NextResponse.json({ data: { roomId: room.id } })
  } catch (err) {
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
