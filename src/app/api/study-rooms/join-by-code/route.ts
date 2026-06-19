import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitMessage } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  // Rate limit ketat (10/5 menit) — endpoint ini rawan brute-force kode room
  // (lihat docs/MIGRATION_security_hardening.sql untuk perluasan alfabet kode).
  const rl = await checkRateLimit(supabase, 'study-room-join-code', 10, 300)
  if (!rl.allowed) return NextResponse.json({ error: rateLimitMessage(rl.retryAfterSeconds) }, { status: 429 })

  let body: { code?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
  if (!code) return NextResponse.json({ error: 'Kode room wajib diisi.' }, { status: 400 })

  const { data: room } = await supabase
    .from('study_rooms').select('id, title, status, visibility, current_members_count, max_members')
    .eq('room_code', code).maybeSingle()
  if (!room) return NextResponse.json({ error: 'Kode room tidak ditemukan.' }, { status: 404 })

  const r = room as { id: string; title: string; status: string; visibility: string; current_members_count: number; max_members: number }
  if (r.status === 'closed') return NextResponse.json({ error: 'Room sudah ditutup.' }, { status: 400 })

  const { data: existing } = await supabase
    .from('study_room_members').select('id').eq('room_id', r.id).eq('user_id', user.id).maybeSingle()
  if (existing) return NextResponse.json({ data: { room_id: r.id, already_member: true } })

  if (r.visibility === 'private') {
    const { data: reqData, error } = await supabase
      .from('study_room_join_requests')
      .insert({ room_id: r.id, user_id: user.id })
      .select('*').single()
    if (error && error.code === '23505') {
      return NextResponse.json({ data: { room_id: r.id, pending: true, message: 'Kamu sudah pernah request join room ini.' } })
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: { room_id: r.id, pending: true, message: `Request join "${r.title}" terkirim.`, reqData } }, { status: 201 })
  }

  if (r.current_members_count >= r.max_members) {
    return NextResponse.json({ error: 'Room sudah penuh.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('study_room_members').insert({ room_id: r.id, user_id: user.id, role: 'member' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: { room_id: r.id, joined: true, title: r.title } }, { status: 201 })
}
