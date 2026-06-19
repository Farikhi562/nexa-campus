import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  // Poin fokus dibatasi 1x per hari (ref = tanggal) supaya tidak bisa di-spam.
  const today = new Date().toISOString().slice(0, 10)
  await supabase
    .rpc('award_points', { p_kind: 'focus_session', p_ref: `focus-${today}` })
    .then(undefined, () => null)

  return NextResponse.json({ ok: true })
}
