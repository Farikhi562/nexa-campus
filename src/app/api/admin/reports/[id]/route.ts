import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail } from '@/lib/admin'

type Params = { params: Promise<{ id: string }> }

/** PATCH /api/admin/reports/[id] — tandai laporan reviewed/dismissed. Admin only. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: 'Admin only.' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const status = body.status
  if (status !== 'reviewed' && status !== 'dismissed') {
    return NextResponse.json({ error: 'status harus "reviewed" atau "dismissed".' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db.from('user_reports').update({
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  }).eq('id', id).select('*').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
