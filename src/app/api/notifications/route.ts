import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const unreadCount = (data ?? []).filter((n: { read: boolean }) => !n.read).length
  return NextResponse.json({ data: data ?? [], unreadCount })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: { ids?: unknown; all?: unknown } = {}
  try { body = await request.json() } catch { /* ignore */ }

  if (body.all) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  } else if (Array.isArray(body.ids)) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .in('id', body.ids as string[])
      .eq('user_id', user.id)
  }

  return NextResponse.json({ ok: true })
}
