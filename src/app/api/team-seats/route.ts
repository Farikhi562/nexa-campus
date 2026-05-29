import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hasProAccess } from '@/lib/plans'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login dulu.' }, { status: 401 })

  const service = createServiceClient()
  const { data: seats } = await service
    .from('profiles')
    .select('id, email, full_name, plan, created_at')
    .eq('seat_owner_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ data: seats || [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login dulu.' }, { status: 401 })

  const service = createServiceClient()
  const { email } = await request.json().catch(() => ({}))
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) return NextResponse.json({ error: 'Email wajib diisi.' }, { status: 400 })

  const { data: owner } = await service.from('profiles').select('plan, seat_owner_id').eq('id', user.id).single()
  if (!hasProAccess(owner as Pick<Profile, 'plan' | 'seat_owner_id'> | null) || owner?.seat_owner_id) {
    return NextResponse.json({ error: 'Team seat hanya bisa dikelola owner Pro, bukan seat member.' }, { status: 403 })
  }

  const { count } = await service.from('profiles').select('id', { count: 'exact', head: true }).eq('seat_owner_id', user.id)
  if ((count ?? 0) >= 3) return NextResponse.json({ error: 'Maksimal 3 team seat untuk paket Pro.' }, { status: 422 })

  const { data: target } = await service.from('profiles').select('id, email').eq('email', normalizedEmail).single()
  if (!target) return NextResponse.json({ error: 'Akun dengan email itu belum ditemukan. Minta dia daftar dulu.' }, { status: 404 })
  if (target.id === user.id) return NextResponse.json({ error: 'Tidak bisa invite akun sendiri.' }, { status: 422 })

  const { error } = await service.from('profiles').update({ seat_owner_id: user.id }).eq('id', target.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login dulu.' }, { status: 401 })

  const { id } = await request.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'ID seat wajib diisi.' }, { status: 400 })

  const service = createServiceClient()
  const { error } = await service.from('profiles').update({ seat_owner_id: null }).eq('id', id).eq('seat_owner_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
