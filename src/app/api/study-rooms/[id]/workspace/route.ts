import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

function cleanChecklist(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.slice(0, 20).map((item) => ({
    id: typeof item?.id === 'string' ? item.id.slice(0, 80) : crypto.randomUUID(),
    text: typeof item?.text === 'string' ? item.text.trim().slice(0, 180) : '',
    done: Boolean(item?.done),
  })).filter((item) => item.text)
}

async function getMembership(supabase: Awaited<ReturnType<typeof createClient>>, roomId: string, userId: string) {
  const { data, error } = await supabase
    .from('study_room_members')
    .select('role')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as { role: string } | null
}

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const membership = await getMembership(supabase, id, user.id)
  if (!membership) return NextResponse.json({ error: 'Kamu bukan anggota room ini.' }, { status: 403 })

  const { data, error } = await supabase
    .from('study_room_workspaces')
    .select('*')
    .eq('room_id', id)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })

  return NextResponse.json({
    data: data ?? { room_id: id, pinned_note: '', group_goal: '', material_link: '', next_session_at: null, checklist: [] },
    role: membership.role,
  })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const membership = await getMembership(supabase, id, user.id)
  if (!membership || !['owner', 'admin', 'moderator'].includes(membership.role)) {
    return NextResponse.json({ error: 'Hanya owner/admin/moderator yang bisa edit workspace.' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }) }

  const payload = {
    room_id: id,
    pinned_note: typeof body.pinned_note === 'string' ? body.pinned_note.trim().slice(0, 1200) : null,
    group_goal: typeof body.group_goal === 'string' ? body.group_goal.trim().slice(0, 300) : null,
    material_link: typeof body.material_link === 'string' ? body.material_link.trim().slice(0, 500) : null,
    next_session_at: typeof body.next_session_at === 'string' && body.next_session_at ? body.next_session_at : null,
    checklist: cleanChecklist(body.checklist),
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('study_room_workspaces')
    .upsert(payload, { onConflict: 'room_id' })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  return NextResponse.json({ data })
}
