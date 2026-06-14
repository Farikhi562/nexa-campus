import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: Record<string, unknown> = {}
  try { body = await request.json() } catch {}

  const currentPath = typeof body.current_path === 'string' ? body.current_path.slice(0, 300) : null
  const currentRoomId = typeof body.current_room_id === 'string' ? body.current_room_id : null

  const { error } = await supabase
    .from('user_presence')
    .upsert({
      user_id: user.id,
      last_seen_at: new Date().toISOString(),
      current_path: currentPath,
      current_room_id: currentRoomId,
    }, { onConflict: 'user_id' })

  // BUG-002 fix: jangan balas 500. Heartbeat itu fitur "nice to have" (presence/online status).
  // Kalau tabel/RLS bermasalah, balas 200 dengan ok:false supaya:
  //   1) Console tidak dibanjiri error 500 berulang tiap beberapa detik.
  //   2) Client tidak retry agresif / nge-spam.
  // Error tetap dicatat di server log untuk diinvestigasi (kemungkinan tabel user_presence
  // belum dibuat atau RLS belum mengizinkan upsert — lihat migration di docs).
  if (error) {
    console.error('[presence/heartbeat] upsert failed (soft):', error.message)
    return NextResponse.json({ ok: false, soft_error: 'presence_unavailable' }, { status: 200 })
  }

  return NextResponse.json({ ok: true })
}
