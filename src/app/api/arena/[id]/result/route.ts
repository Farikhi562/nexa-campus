import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PLACEMENTS = ['juara_1', 'juara_2', 'juara_3', 'finalist', 'participant']

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  // Pastikan user adalah creator post ini.
  const { data: post } = await supabase
    .from('nexa_arena_posts')
    .select('id, creator_id')
    .eq('id', id)
    .maybeSingle()

  if (!post) return NextResponse.json({ error: 'Tim/kompetisi tidak ditemukan.' }, { status: 404 })
  if (post.creator_id !== user.id) {
    return NextResponse.json({ error: 'Hanya pembuat tim yang bisa mencatat hasil.' }, { status: 403 })
  }

  let body: { placement?: unknown; note?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const placement = typeof body.placement === 'string' ? body.placement : ''
  if (!PLACEMENTS.includes(placement)) {
    return NextResponse.json({ error: 'Placement tidak valid.' }, { status: 400 })
  }
  const note = typeof body.note === 'string' ? body.note.slice(0, 300) : null

  const { data, error } = await supabase
    .from('nexa_arena_results')
    .upsert(
      {
        post_id: id,
        placement,
        note,
        recorded_by: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'post_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 200 })
}
