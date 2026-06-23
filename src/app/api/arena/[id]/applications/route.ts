import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const NEXA_FOUNDER_EMAIL = 'fauzanalfa36@gmail.com'
function founderVerified(email: unknown) { return String(email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL }

function dataClient<T>(fallback: T): T {
  try { return createServiceClient() as T } catch { return fallback }
}

type Params = { params: Promise<{ id: string }> }
type ApplicationRow = Record<string, unknown> & { applicant_id: string }

type ProfileRow = {
  id: string
  email?: string | null
  founder_verified?: boolean | null
  full_name: string | null
  campus_name: string | null
  major: string | null
  semester: number | null
  avatar_url: string | null
  plan: string | null
  nexa_id: string | null
  featured_badge: string | null
  is_nexa_verified: boolean | null
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: post, error: postError } = await supabase
    .from('nexa_arena_posts')
    .select('id, creator_id')
    .eq('id', id)
    .maybeSingle()

  if (postError) return NextResponse.json({ error: postError.message }, { status: 500 })
  if (!post) return NextResponse.json({ error: 'Postingan tidak ditemukan.' }, { status: 404 })
  if ((post as { creator_id: string }).creator_id !== user.id) {
    return NextResponse.json({ error: 'Hanya pembuat postingan yang bisa melihat pelamar.' }, { status: 403 })
  }

  const { data: applications, error } = await supabase
    .from('nexa_arena_applications')
    .select('*')
    .eq('post_id', id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  const rows = (applications ?? []) as ApplicationRow[]
  const applicantIds = Array.from(new Set(rows.map((row) => row.applicant_id)))
  const profileMap: Record<string, ProfileRow> = {}

  if (applicantIds.length > 0) {
    const db = dataClient(supabase)
    const { data: profiles, error: profileError } = await db
      .from('profiles')
      .select('id, email, founder_verified, full_name, campus_name, major, semester, avatar_url, plan, nexa_id, featured_badge, is_nexa_verified')
      .in('id', applicantIds)

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
    for (const profile of (profiles ?? []) as ProfileRow[]) {
      profileMap[profile.id] = { ...profile, email: null, founder_verified: founderVerified(profile.email) || Boolean(profile.founder_verified) }
    }
  }

  return NextResponse.json({ data: rows.map((row) => ({ ...row, applicant: profileMap[row.applicant_id] ?? null })) })
}
