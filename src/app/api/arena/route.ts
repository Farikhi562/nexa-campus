import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const type = req.nextUrl.searchParams.get('type') ?? ''

  let query = supabase.from('nexa_arena_posts').select('*').order('created_at', { ascending: false }).limit(50)
  if (q) query = query.or(`title.ilike.%${q}%,competition_name.ilike.%${q}%`)
  if (type) query = query.eq('competition_type', type)

  const { data: posts, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (posts ?? []) as Array<Record<string, unknown>>
  const creatorIds = Array.from(new Set(rows.map(r => r.creator_id as string)))

  let creatorNames: Record<string, string> = {}
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', creatorIds)
    for (const p of (profiles ?? []) as Array<{id:string;full_name:string|null}>) creatorNames[p.id] = p.full_name ?? 'User'
  }

  const { data: myApps } = await supabase.from('nexa_arena_applications').select('post_id').eq('applicant_id', user.id)
  const appliedSet = new Set((myApps ?? []).map((a: {post_id: string}) => a.post_id))

  return NextResponse.json({ data: rows.map(r => ({ ...r, creator_name: creatorNames[r.creator_id as string] ?? null, has_applied: appliedSet.has(r.id as string) })) })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid.' }, { status: 400 }) }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 })

  const { data, error } = await supabase.from('nexa_arena_posts').insert({
    creator_id: user.id, title,
    competition_name: typeof body.competition_name === 'string' ? body.competition_name.trim() || null : null,
    competition_type: typeof body.competition_type === 'string' ? body.competition_type : 'lainnya',
    description: typeof body.description === 'string' ? body.description.trim() || null : null,
    skills_needed: Array.isArray(body.skills_needed) ? body.skills_needed : [],
    team_size_max: typeof body.team_size_max === 'number' ? Math.min(20, Math.max(2, body.team_size_max)) : 4,
    deadline_registration: typeof body.deadline_registration === 'string' && body.deadline_registration ? body.deadline_registration : null,
    prize: typeof body.prize === 'string' ? body.prize.trim() || null : null,
    link_info: typeof body.link_info === 'string' ? body.link_info.trim() || null : null,
  }).select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
