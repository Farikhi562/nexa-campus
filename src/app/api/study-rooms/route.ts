import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const category = request.nextUrl.searchParams.get('category') ?? ''
  const status = request.nextUrl.searchParams.get('status') ?? ''

  let query = supabase
    .from('study_rooms')
    .select('*')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) query = query.ilike('title', `%${q}%`)
  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)

  const { data: rooms, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get user memberships in one query
  const roomIds = (rooms ?? []).map((r: { id: string }) => r.id)
  let memberships: Array<{ room_id: string; role: string }> = []
  if (roomIds.length > 0) {
    const { data } = await supabase
      .from('study_room_members')
      .select('room_id, role')
      .eq('user_id', user.id)
      .in('room_id', roomIds)
    memberships = (data ?? []) as typeof memberships
  }

  const membershipMap = new Map(memberships.map((m) => [m.room_id, m.role]))
  const enriched = (rooms ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    is_member: membershipMap.has(r.id as string),
    member_role: membershipMap.get(r.id as string) ?? null,
  }))

  return NextResponse.json({ data: enriched })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'Judul room wajib diisi.' }, { status: 400 })

  const max = Number(body.max_members ?? 8)
  if (!Number.isFinite(max) || max < 2 || max > 50)
    return NextResponse.json({ error: 'Kapasitas anggota harus antara 2–50.' }, { status: 400 })

  const { data: room, error } = await supabase
    .from('study_rooms')
    .insert({
      owner_id: user.id,
      title,
      description: typeof body.description === 'string' ? body.description.trim() || null : null,
      topic: typeof body.topic === 'string' ? body.topic.trim() || null : null,
      category: typeof body.category === 'string' ? body.category : 'umum',
      max_members: max,
      visibility: body.visibility === 'private' ? 'private' : 'public',
      scheduled_at: typeof body.scheduled_at === 'string' ? body.scheduled_at || null : null,
    })
    .select('*')
    .single()

  if (error || !room)
    return NextResponse.json({ error: error?.message ?? 'Gagal membuat room.' }, { status: 500 })

  // Insert owner as member (triggers update count to 1)
  await supabase
    .from('study_room_members')
    .insert({ room_id: (room as { id: string }).id, user_id: user.id, role: 'owner' })

  return NextResponse.json({ data: room }, { status: 201 })
}
