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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
