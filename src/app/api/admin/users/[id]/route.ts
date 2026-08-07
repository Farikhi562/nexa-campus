import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isAdminEmail } from '@/lib/admin'

type Params = { params: Promise<{ id: string }> }

const VALID_PLANS = ['radar', 'pulse', 'command']

function text(value: unknown, max = 500) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

/** PATCH /api/admin/users/[id] — ban, unban, atau ubah plan user. Admin only. */
export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: 'Admin only.' }, { status: 403 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const action = body.action
  if (action !== 'ban' && action !== 'unban' && action !== 'set_plan') {
    return NextResponse.json({ error: 'action harus "ban", "unban", atau "set_plan".' }, { status: 400 })
  }

  // Admin nggak boleh ban diri sendiri — jaga-jaga salah klik yang bisa mengunci diri sendiri dari dashboard.
  if (action === 'ban' && id === user.id) {
    return NextResponse.json({ error: 'Nggak bisa ban akun sendiri.' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data: target, error: findError } = await db
    .from('profiles')
    .select('id, full_name, email, plan, is_banned')
    .eq('id', id)
    .maybeSingle()
  if (findError) return NextResponse.json({ error: findError.message }, { status: 500 })
  if (!target) return NextResponse.json({ error: 'User tidak ditemukan.' }, { status: 404 })

  if (action === 'ban') {
    const reason = text(body.reason, 500) || 'Melanggar ketentuan penggunaan NEXA Campus.'
    const { error } = await db.from('profiles').update({
      is_banned: true,
      banned_reason: reason,
      banned_at: new Date().toISOString(),
      banned_by: user.id,
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await db.from('notifications').insert({
      user_id: id,
      type: 'system',
      title: 'Akun kamu dinonaktifkan',
      message: reason,
      link: null,
      is_read: false,
    }).then(undefined, () => null)

    return NextResponse.json({ ok: true, is_banned: true })
  }

  if (action === 'unban') {
    const { error } = await db.from('profiles').update({
      is_banned: false,
      banned_reason: null,
      banned_at: null,
      banned_by: null,
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await db.from('notifications').insert({
      user_id: id,
      type: 'system',
      title: 'Akun kamu aktif kembali',
      message: 'Kamu sudah bisa pakai NEXA Campus seperti biasa.',
      link: '/dashboard',
      is_read: false,
    }).then(undefined, () => null)

    return NextResponse.json({ ok: true, is_banned: false })
  }

  // set_plan
  const plan = body.plan
  if (typeof plan !== 'string' || !VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: 'plan harus salah satu dari: ' + VALID_PLANS.join(', ') }, { status: 400 })
  }

  // Kalau downgrade dari command/pulse, bersihin expiry lama juga biar getEffectivePlan
  // konsisten (lihat lib/plans.ts) — bukan cuma ganti label plan doang.
  const clearExpiries = plan === 'radar'
    ? { plan_expires_at: null, subscription_expires_at: null, command_expires_at: null, lifetime_command: false, pulse_trial_until: null }
    : {}

  const { error } = await db.from('profiles').update({ plan, ...clearExpiries }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await db.from('notifications').insert({
    user_id: id,
    type: 'system',
    title: 'Plan akun kamu diperbarui',
    message: `Plan kamu sekarang: ${plan === 'command' ? 'NEXA Command' : plan === 'pulse' ? 'NEXA Pulse' : 'NEXA Radar'}.`,
    link: '/dashboard/billing',
    is_read: false,
  }).then(undefined, () => null)

  return NextResponse.json({ ok: true, plan })
}
