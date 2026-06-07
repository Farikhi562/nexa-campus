import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

function text(value: unknown, max = 2000) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function skills(value: unknown) {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean))).slice(0, 12)
}

async function notifyOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  creatorId: string,
  applicantId: string,
  postTitle: string
) {
  const { data: applicant } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', applicantId)
    .maybeSingle()

  const applicantName = (applicant as { full_name?: string | null } | null)?.full_name || 'Mahasiswa NEXA'
  await supabase.from('notifications').insert({
    user_id: creatorId,
    type: 'arena_application',
    title: 'Pelamar baru di NEXA Arena',
    message: `${applicantName} melamar ke postingan "${postTitle}". Cek latar belakang dan skill-nya dulu.`,
    link: '/dashboard/arena',
    is_read: false,
  })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: post } = await supabase
    .from('nexa_arena_posts')
    .select('creator_id, title, status, current_team_size, team_size_max')
    .eq('id', id)
    .maybeSingle()

  if (!post) return NextResponse.json({ error: 'Post tidak ditemukan.' }, { status: 404 })

  const arenaPost = post as { creator_id: string; title: string; status: string; current_team_size: number; team_size_max: number }
  if (arenaPost.creator_id === user.id) return NextResponse.json({ error: 'Tidak bisa melamar ke post sendiri.' }, { status: 400 })
  if (arenaPost.status !== 'open') return NextResponse.json({ error: 'Post sudah ditutup.' }, { status: 400 })
  if (arenaPost.current_team_size >= arenaPost.team_size_max) return NextResponse.json({ error: 'Tim sudah penuh.' }, { status: 400 })

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* tetap bisa fallback */ }

  const applicantBackground = text(body.applicant_background, 2500)
  const skillsOffered = skills(body.skills_offered)
  const portfolioUrl = text(body.portfolio_url, 500)

  if (!applicantBackground) {
    return NextResponse.json({ error: 'Latar belakang wajib diisi supaya owner bisa menilai kamu.' }, { status: 400 })
  }
  if (skillsOffered.length === 0) {
    return NextResponse.json({ error: 'Minimal isi 1 skill yang kamu tawarkan.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('nexa_arena_applications')
    .insert({
      post_id: id,
      applicant_id: user.id,
      message: text(body.message, 1500) || null,
      applicant_background: applicantBackground,
      skills_offered: skillsOffered,
      portfolio_url: portfolioUrl || null,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Kamu sudah melamar ke post ini.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  try { await notifyOwner(supabase, arenaPost.creator_id, user.id, arenaPost.title) } catch (error) { console.error('[Arena Application Notification]', error) }

  return NextResponse.json({ data }, { status: 201 })
}
