import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_TYPES = new Set(['hackathon', 'bisnis', 'saintek', 'desain', 'akademik', 'seni', 'esport', 'olahraga', 'lainnya'])

function text(value: unknown, max = 2000) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function skills(value: unknown) {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean))).slice(0, 12)
}

function optionalDate(value: unknown) {
  const raw = text(value, 20)
  return raw ? raw : null
}

function buildPatchPayload(body: Record<string, unknown>) {
  const payload: Record<string, unknown> = {}

  if ('title' in body) payload.title = text(body.title, 160)
  if ('competition_name' in body) payload.competition_name = text(body.competition_name, 160) || null
  if ('competition_type' in body) {
    const value = text(body.competition_type, 30)
    payload.competition_type = ALLOWED_TYPES.has(value) ? value : 'lainnya'
  }
  if ('description' in body) payload.description = text(body.description, 3000) || null
  if ('skills_needed' in body) payload.skills_needed = skills(body.skills_needed)
  if ('team_size_max' in body) {
    const max = typeof body.team_size_max === 'number' ? Math.floor(body.team_size_max) : Number(body.team_size_max)
    if (Number.isFinite(max)) payload.team_size_max = Math.min(20, Math.max(2, max))
  }
  if ('deadline_registration' in body) payload.deadline_registration = optionalDate(body.deadline_registration)
  if ('event_date' in body) payload.event_date = optionalDate(body.event_date)
  if ('prize' in body) payload.prize = text(body.prize, 200) || null
  if ('link_info' in body) payload.link_info = text(body.link_info, 500) || null
  if ('status' in body) {
    const status = text(body.status, 20)
    if (['open', 'full', 'closed'].includes(status)) payload.status = status
  }

  payload.updated_at = new Date().toISOString()
  return payload
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid.' }, { status: 400 }) }

  const payload = buildPatchPayload(body)
  if ('title' in payload && !payload.title) {
    return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('nexa_arena_posts')
    .update(payload)
    .eq('id', id)
    .eq('creator_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Postingan tidak ditemukan atau bukan milik kamu.' }, { status: 404 })

  return NextResponse.json({ data })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { error, count } = await supabase
    .from('nexa_arena_posts')
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('creator_id', user.id)

  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  if (!count) return NextResponse.json({ error: 'Postingan tidak ditemukan atau bukan milik kamu.' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
