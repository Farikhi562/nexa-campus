import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { normalizeRoomCode, verifySecret } from '@/lib/server-security'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomCode, password } = await request.json()
    const normalizedRoomCode = normalizeRoomCode(roomCode)

    if (!normalizedRoomCode) {
      return NextResponse.json({ error: 'Kode room wajib diisi.' }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Find room by code in a trusted server context. RLS should not expose all room codes.
    const { data: room } = await serviceClient
      .from('study_rooms')
      .select('*')
      .eq('room_code', normalizedRoomCode)
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

    if (room.is_private) {
      const passwordText = String(password || '').trim()
      const validHash = room.room_password_hash
        ? verifySecret(passwordText, String(room.room_password_hash))
        : false
      const validLegacy = !room.room_password_hash && String(room.room_password || '') === passwordText
      if (!validHash && !validLegacy) {
        return NextResponse.json({ error: 'Password room private salah.' }, { status: 403 })
      }
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
