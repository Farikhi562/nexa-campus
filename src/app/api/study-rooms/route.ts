import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

function dataClient<T>(fallback: T): T {
  try { return createServiceClient() as T } catch { return fallback }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const category = request.nextUrl.searchParams.get('category') ?? ''
  const status = request.nextUrl.searchParams.get('status') ?? ''

  let query = supabase
    .from('study_rooms')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) query = query.ilike('title', `%${q}%`)
  if (category) query = query.eq('category', category)
  if (status) query = query.eq('status', status)

  const { data: rooms, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const roomList = (rooms ?? []) as Array<Record<string, unknown>>
  const roomIds = roomList.map((r) => r.id as string)
  const ownerIds = Array.from(new Set(roomList.map((r) => r.owner_id as string)))

  // Owner names (safe: only full_name, no email/phone)
  let ownerNames: Record<string, string | null> = {}
  if (ownerIds.length > 0) {
    const db = dataClient(supabase)
    const { data: owners } = await db
      .from('profiles')
      .select('id, full_name')
      .in('id', ownerIds)
    for (const o of (owners ?? []) as Array<{ id: string; full_name: string | null }>) {
      ownerNames[o.id] = o.full_name
    }
  }

  // User memberships in one query
  let memberships: Array<{ room_id: string; role: string }> = []
  if (roomIds.length > 0) {
    const { data } = await supabase
      .from('study_room_members')
      .select('room_id, role')
      .eq('user_id', user.id)
      .in('room_id', roomIds)
    memberships = (data ?? []) as typeof memberships
  }

  // Pending join requests for private rooms
  let pendingRequests: Set<string> = new Set()
  if (roomIds.length > 0) {
    const { data: reqs } = await supabase
      .from('study_room_join_requests')
      .select('room_id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .in('room_id', roomIds)
    for (const r of (reqs ?? []) as Array<{ room_id: string }>) {
      pendingRequests.add(r.room_id)
    }
  }

  const membershipMap = new Map(memberships.map((m) => [m.room_id, m.role]))
  const enriched = roomList.map((r) => ({
    ...r,
    owner_name: ownerNames[r.owner_id as string] ?? null,
    is_member: membershipMap.has(r.id as string),
    member_role: membershipMap.get(r.id as string) ?? null,
    has_pending_request: pendingRequests.has(r.id as string),
  }))

  return NextResponse.json({ data: enriched })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

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

  if (error || !room) return NextResponse.json({ error: error?.message ?? 'Gagal membuat room.' }, { status: 500 })

  // Insert owner as member (triggers update count to 1)
  await supabase.from('study_room_members').insert({ room_id: (room as { id: string }).id, user_id: user.id, role: 'owner' })

  return NextResponse.json({ data: room }, { status: 201 })
}
