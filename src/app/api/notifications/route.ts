import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MAX_LIMIT = 100

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const limitParam = Number(request.nextUrl.searchParams.get('limit') ?? 30)
  const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 30, 1), MAX_LIMIT)

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[notifications]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  const rows = data ?? []
  const unreadCount = rows.filter((n: { is_read: boolean }) => !n.is_read).length
  return NextResponse.json({ data: rows, unreadCount })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: { ids?: unknown; all?: unknown } = {}
  try { body = await request.json() } catch { /* ignore */ }

  if (body.all) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_read', false)
    if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    const ids = body.ids.map((id) => String(id)).filter(Boolean).slice(0, 100)
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', ids)
      .eq('user_id', user.id)
    if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  }

  return NextResponse.json({ ok: true })
}
