import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type Params = { params: Promise<{ id: string }> }

function getReadClient(fallback: Awaited<ReturnType<typeof createClient>>) {
  try { return createServiceClient() } catch { return fallback }
}

function cleanChecklist(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.slice(0, 30).map((item) => ({
    id: typeof item?.id === 'string' ? item.id.slice(0, 80) : crypto.randomUUID(),
    text: typeof item?.text === 'string' ? item.text.trim().slice(0, 220) : '',
    done: Boolean(item?.done),
  })).filter((item) => item.text)
}

async function loadPost(db: Awaited<ReturnType<typeof createClient>>, id: string) {
  const { data: post, error } = await db
    .from('nexa_arena_posts')
    .select('id, title, creator_id, status, current_team_size, team_size_max')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return post as { id: string; title: string; creator_id: string; status: string; current_team_size: number; team_size_max: number } | null
}

async function loadMembers(db: Awaited<ReturnType<typeof createClient>>, postId: string) {
  const { data: members } = await db
    .from('nexa_arena_team_members')
    .select('post_id, user_id, role, joined_at')
    .eq('post_id', postId)
    .order('joined_at', { ascending: true })
  const rows = (members ?? []) as Array<{ post_id: string; user_id: string; role: string; joined_at: string }>
  const ids = rows.map((item) => item.user_id)
  const profileMap: Record<string, { full_name: string | null; avatar_url: string | null; nexa_id: string | null; founder_verified?: boolean | null }> = {}
  if (ids.length > 0) {
    const { data: profiles } = await db.from('profiles').select('id, full_name, avatar_url, nexa_id, founder_verified').in('id', ids)
    for (const p of (profiles ?? []) as Array<{ id: string; full_name: string | null; avatar_url: string | null; nexa_id: string | null; founder_verified?: boolean | null }>) {
      profileMap[p.id] = p
    }
  }
  return rows.map((item) => ({ ...item, profile: profileMap[item.user_id] ?? null }))
}

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  const db = getReadClient(supabase)

  const post = await loadPost(db, id)
  if (!post) return NextResponse.json({ error: 'Postingan tidak ditemukan.' }, { status: 404 })
  const members = await loadMembers(db, id)
  if (!members.some((member) => member.user_id === user.id)) return NextResponse.json({ error: 'Workspace hanya untuk anggota tim approved.' }, { status: 403 })

  const { data: workspace } = await db.from('nexa_arena_workspaces').select('*').eq('post_id', id).maybeSingle()
  return NextResponse.json({ post: { ...post, team_members: members }, workspace: workspace ?? { post_id: id, owner_task: '', team_status: 'ready', checklist: [] } })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const post = await loadPost(supabase, id)
  if (!post) return NextResponse.json({ error: 'Postingan tidak ditemukan.' }, { status: 404 })
  if (post.creator_id !== user.id) return NextResponse.json({ error: 'Hanya pembuat Arena yang bisa edit workspace.' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body.' }, { status: 400 }) }

  const payload = {
    post_id: id,
    owner_task: typeof body.owner_task === 'string' ? body.owner_task.trim().slice(0, 2000) : null,
    team_status: ['ready', 'busy', 'needs_help'].includes(String(body.team_status)) ? String(body.team_status) : 'ready',
    checklist: cleanChecklist(body.checklist),
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('nexa_arena_workspaces')
    .upsert(payload, { onConflict: 'post_id' })
    .select('*')
    .single()

  if (error) {
    console.error('[arena/workspace]', error.message, error.code)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  return NextResponse.json({ workspace: data })
}
