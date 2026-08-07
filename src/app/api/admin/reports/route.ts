import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail } from '@/lib/admin'

/** GET /api/admin/reports — list laporan akun (default: yang pending dulu). Admin only. */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: 'Admin only.' }, { status: 403 })

  const status = request.nextUrl.searchParams.get('status')
  const db = createServiceClient()

  let query = db.from('user_reports').select('*').order('created_at', { ascending: false }).limit(100)
  if (status && ['pending', 'reviewed', 'dismissed'].includes(status)) {
    query = query.eq('status', status)
  }
  const { data: reports, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = Array.from(new Set((reports ?? []).flatMap((r) => [r.reporter_id, r.reported_user_id])))
  const { data: profiles } = ids.length > 0
    ? await db.from('profiles').select('id, full_name, email, avatar_url, is_banned').in('id', ids)
    : { data: [] }

  const profileById: Record<string, { id: string; full_name: string | null; email: string; avatar_url: string | null; is_banned: boolean | null }> = {}
  for (const p of profiles ?? []) profileById[p.id] = p

  const data = (reports ?? []).map((r) => ({
    ...r,
    reporter: profileById[r.reporter_id] ?? null,
    reported: profileById[r.reported_user_id] ?? null,
  }))

  return NextResponse.json({ data })
}
