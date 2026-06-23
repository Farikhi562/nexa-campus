import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail } from '@/lib/admin'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: 'Admin only.' }, { status: 403 })

  const status = request.nextUrl.searchParams.get('status') || 'pending_review'
  const db = createServiceClient()

  let query = db
    .from('user_verifications')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(100)

  if (status !== 'all') query = query.eq('status', status)

  const { data: rows, error } = await query
  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  const userIds = Array.from(new Set((rows ?? []).map((r) => (r as { user_id: string }).user_id)))
  const profileMap: Record<string, unknown> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, full_name, avatar_url, campus_name, major, semester, nexa_id, profile_skills, portfolio_url, github_url')
      .in('id', userIds)

    for (const p of profiles ?? []) {
      profileMap[(p as { id: string }).id] = p
    }
  }

  return NextResponse.json({
    data: (rows ?? []).map((row) => ({ ...(row as object), profile: profileMap[(row as { user_id: string }).user_id] ?? null })),
  })
}
