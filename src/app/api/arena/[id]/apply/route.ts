import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: post } = await supabase.from('nexa_arena_posts').select('creator_id, status, current_team_size, team_size_max').eq('id', id).maybeSingle()
  if (!post) return NextResponse.json({ error: 'Post tidak ditemukan.' }, { status: 404 })

  const p = post as { creator_id: string; status: string; current_team_size: number; team_size_max: number }
  if (p.creator_id === user.id) return NextResponse.json({ error: 'Tidak bisa melamar ke post sendiri.' }, { status: 400 })
  if (p.status !== 'open') return NextResponse.json({ error: 'Post sudah ditutup.' }, { status: 400 })
  if (p.current_team_size >= p.team_size_max) return NextResponse.json({ error: 'Tim sudah penuh.' }, { status: 400 })

  let body: { message?: unknown; skills_offered?: unknown } = {}
  try { body = await req.json() } catch { /* ok */ }

  const { data, error } = await supabase.from('nexa_arena_applications').insert({
    post_id: id, applicant_id: user.id,
    message: typeof body.message === 'string' ? body.message.trim() || null : null,
    skills_offered: Array.isArray(body.skills_offered) ? body.skills_offered : [],
  }).select('*').single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Kamu sudah melamar ke post ini.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 201 })
}
