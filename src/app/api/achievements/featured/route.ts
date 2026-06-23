import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { BADGES } from '@/lib/badges'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: { featured_badge?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid.' }, { status: 400 }) }

  const badgeId = body.featured_badge === null ? null
    : typeof body.featured_badge === 'string' ? body.featured_badge : undefined

  if (badgeId !== null && badgeId !== undefined && !BADGES.find(b => b.id === badgeId)) {
    return NextResponse.json({ error: 'Badge tidak valid.' }, { status: 400 })
  }

  const { error } = await supabase.from('profiles').update({ featured_badge: badgeId ?? null }).eq('id', user.id)
  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
