import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Tidak terautentikasi.' }, { status: 401 })

  const body = await req.json() as { badges?: string[] }
  const badges = Array.isArray(body.badges) ? body.badges.slice(0, 3) : []

  const { error } = await supabase
    .from('profiles')
    .update({ badges })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: 'Gagal menyimpan badge.' }, { status: 500 })
  return NextResponse.json({ ok: true, badges })
}
