import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BILLING_PLANS } from '@/lib/billing/plans'
import { notifyUser } from '@/lib/notifications/notify-user'

function parseAdmins() {
  return (process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const admins = parseAdmins()
  const email = user?.email?.toLowerCase() || ''

  if (!user || !email || !admins.includes(email)) {
    return { ok: false as const, response: NextResponse.json({ error: 'Admin only. Jangan jadi admin dadakan, nanti chaos.' }, { status: 403 }) }
  }

  return { ok: true as const, user }
}

function addOneMonth(date = new Date()) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + 1)
  return result.toISOString()
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin.ok) return admin.response

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('manual_payment_orders')
    .select('id,order_code,user_id,plan,amount,status,payment_method,bank_name,account_number,account_name,buyer_name,buyer_whatsapp,proof_url,notes,rejection_reason,metadata,created_at,expires_at,approved_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[admin manual-payment] list failed', error)
    return NextResponse.json({ error: 'Gagal load pembayaran manual.' }, { status: 500 })
  }

  return NextResponse.json({ orders: data ?? [] })
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin.ok) return admin.response

  let body: { order_id?: unknown; status?: unknown; rejection_reason?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const orderId = typeof body.order_id === 'string' ? body.order_id : ''
  const status = body.status === 'approved' || body.status === 'rejected' ? body.status : null

  if (!orderId || !status) {
    return NextResponse.json({ error: 'order_id dan status approved/rejected wajib ada.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: order, error: orderError } = await supabase
    .from('manual_payment_orders')
    .select('id,order_code,user_id,plan,amount,status')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('[admin manual-payment] get order failed', orderError)
    return NextResponse.json({ error: 'Order tidak ditemukan.' }, { status: 404 })
  }

  if (status === 'approved') {
    const plan = BILLING_PLANS[order.plan as 'pulse' | 'command']
    if (!plan || plan.id === 'radar') {
      return NextResponse.json({ error: 'Plan order tidak valid.' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const expiresAt = addOneMonth()

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        plan: plan.id,
        plan_status: 'active',
        plan_started_at: now,
        plan_expires_at: expiresAt,
        updated_at: now,
      })
      .eq('id', order.user_id)

    if (profileError) {
      console.error('[admin manual-payment] profile update failed', profileError)
      return NextResponse.json({ error: 'Pembayaran valid, tapi gagal update plan user. Cek kolom profiles plan_*.' }, { status: 500 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('manual_payment_orders')
      .update({ status: 'approved', approved_at: now, updated_at: now, rejection_reason: null })
      .eq('id', order.id)
      .select('id,order_code,plan,amount,status,approved_at')
      .single()

    if (updateError) {
      console.error('[admin manual-payment] approve failed', updateError)
      return NextResponse.json({ error: 'Gagal approve order.' }, { status: 500 })
    }

    await notifyUser({
      supabase,
      userId: order.user_id,
      type: 'billing_manual_payment_approved',
      title: 'Pembayaran NEXA disetujui ✅',
      body: `${plan.name} aktif sampai ${expiresAt.slice(0, 10)}. Silakan buka dashboard, jangan cuma dibayar terus ditinggal kayak niat belajar Januari.`,
      url: '/dashboard',
      dedupeKey: `manual-payment-approved-${order.id}`,
      metadata: { order_id: order.id, plan: plan.id, expires_at: expiresAt },
      channels: ['in_app', 'telegram'],
    }).catch((err) => console.error('[admin manual-payment] notify approved failed', err))

    return NextResponse.json({ order: updated })
  }

  const reason = typeof body.rejection_reason === 'string' ? body.rejection_reason.slice(0, 500) : 'Bukti pembayaran belum valid.'
  const { data: rejected, error: rejectError } = await supabase
    .from('manual_payment_orders')
    .update({ status: 'rejected', rejection_reason: reason, updated_at: new Date().toISOString() })
    .eq('id', order.id)
    .select('id,order_code,plan,amount,status,rejection_reason')
    .single()

  if (rejectError) {
    console.error('[admin manual-payment] reject failed', rejectError)
    return NextResponse.json({ error: 'Gagal reject order.' }, { status: 500 })
  }

  await notifyUser({
    supabase,
    userId: order.user_id,
    type: 'billing_manual_payment_rejected',
    title: 'Pembayaran NEXA perlu dicek ulang',
    body: reason,
    url: '/dashboard/billing',
    dedupeKey: `manual-payment-rejected-${order.id}`,
    metadata: { order_id: order.id, reason },
    channels: ['in_app', 'telegram'],
  }).catch((err) => console.error('[admin manual-payment] notify rejected failed', err))

  return NextResponse.json({ order: rejected })
}
