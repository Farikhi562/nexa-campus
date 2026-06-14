import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { BILLING_PLANS, isPaidPlan } from '@/lib/billing/plans'
import { notifyUser } from '@/lib/notifications/notify-user'

export const runtime = 'nodejs'

type AdminUser = {
  id: string
  email?: string | null
}

type ManualPaymentOrder = {
  id: string
  order_code: string
  user_id: string
  plan: string
  amount: number
  status: string
  payment_method?: string | null
  bank_name?: string | null
  account_number?: string | null
  account_name?: string | null
  buyer_name?: string | null
  buyer_whatsapp?: string | null
  proof_url?: string | null
  notes?: string | null
  rejection_reason?: string | null
  metadata?: Record<string, unknown> | null
  created_at?: string | null
  updated_at?: string | null
  expires_at?: string | null
  approved_at?: string | null
}

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
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Admin only. Masuk list ADMIN_EMAILS dulu, bos kecil.' }, { status: 403 }),
    }
  }

  return { ok: true as const, user: { id: user.id, email: user.email } as AdminUser }
}

function addOneMonth(date = new Date()) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + 1)
  return result.toISOString()
}

function cleanText(value: unknown, max = 500) {
  if (typeof value !== 'string') return null
  const text = value.trim().slice(0, max)
  return text || null
}

async function writeAuditLog(params: {
  supabase: ReturnType<typeof createAdminClient>
  orderId: string
  admin: AdminUser
  action: string
  notes?: string | null
  metadata?: Record<string, unknown>
}) {
  const { error } = await params.supabase.from('payment_audit_logs').insert({
    order_id: params.orderId,
    admin_user_id: params.admin.id,
    admin_email: params.admin.email || null,
    action: params.action,
    notes: params.notes || null,
    metadata: params.metadata || {},
  })

  if (error) console.error('[admin manual-payment] audit log failed', error)
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin.ok) return admin.response

  const supabase = createAdminClient()
  const status = request.nextUrl.searchParams.get('status')
  const limitParam = Number(request.nextUrl.searchParams.get('limit') || '80')
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 200) : 80

  let query = supabase
    .from('manual_payment_orders')
    .select('id,order_code,user_id,plan,amount,status,payment_method,bank_name,account_number,account_name,buyer_name,buyer_whatsapp,proof_url,notes,rejection_reason,metadata,created_at,updated_at,expires_at,approved_at')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status && status !== 'all') query = query.eq('status', status)

  const { data, error } = await query

  if (error) {
    console.error('[admin manual-payment] list failed', error)
    return NextResponse.json({ error: 'Gagal load pembayaran manual.' }, { status: 500 })
  }

  const orders = (data ?? []) as ManualPaymentOrder[]
  const userIds = Array.from(new Set(orders.map((order) => order.user_id).filter(Boolean)))
  const profileById: Record<string, unknown> = {}

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id,full_name,email,avatar_url,plan,plan_status,plan_expires_at')
      .in('id', userIds)

    if (profileError) {
      console.error('[admin manual-payment] profiles lookup failed', profileError)
    } else {
      for (const profile of profiles ?? []) {
        if (profile?.id) profileById[profile.id] = profile
      }
    }
  }

  const enriched = orders.map((order) => ({
    ...order,
    user_profile: profileById[order.user_id] || null,
  }))

  const stats = enriched.reduce(
    (acc, order) => {
      acc.total += 1
      acc.amount += typeof order.amount === 'number' ? order.amount : 0
      acc.by_status[order.status] = (acc.by_status[order.status] || 0) + 1
      return acc
    },
    { total: 0, amount: 0, by_status: {} as Record<string, number> },
  )

  return NextResponse.json({ orders: enriched, stats })
}

export async function PATCH(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin.ok) return admin.response

  let body: { order_id?: unknown; status?: unknown; rejection_reason?: unknown; notes?: unknown }
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
    .select('id,order_code,user_id,plan,amount,status,proof_url')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    console.error('[admin manual-payment] get order failed', orderError)
    return NextResponse.json({ error: 'Order tidak ditemukan.' }, { status: 404 })
  }

  if (!['pending', 'under_review'].includes(order.status)) {
    return NextResponse.json({ error: `Order status ${order.status}, tidak bisa diproses ulang.` }, { status: 409 })
  }

  if (status === 'approved') {
    if (!isPaidPlan(order.plan)) {
      return NextResponse.json({ error: 'Plan order tidak valid.' }, { status: 400 })
    }

    const plan = BILLING_PLANS[order.plan]
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
      .in('status', ['pending', 'under_review'])
      .select('id,order_code,user_id,plan,amount,status,payment_method,bank_name,account_number,account_name,buyer_name,buyer_whatsapp,proof_url,notes,rejection_reason,metadata,created_at,updated_at,expires_at,approved_at')
      .single()

    if (updateError) {
      console.error('[admin manual-payment] approve failed', updateError)
      return NextResponse.json({ error: 'Gagal approve order.' }, { status: 500 })
    }

    await writeAuditLog({
      supabase,
      orderId: order.id,
      admin: admin.user,
      action: 'approved',
      notes: cleanText(body.notes, 500),
      metadata: { plan: plan.id, amount: order.amount, expires_at: expiresAt },
    })

    await notifyUser({
      supabase,
      userId: order.user_id,
      type: 'billing_manual_payment_approved',
      title: 'Pembayaran NEXA disetujui ✅',
      body: `${plan.name} aktif sampai ${expiresAt.slice(0, 10)}. Silakan buka dashboard. Akhirnya teknologi dan transferan berdamai.`,
      url: '/dashboard',
      dedupeKey: `manual-payment-approved-${order.id}`,
      metadata: { order_id: order.id, plan: plan.id, expires_at: expiresAt },
      channels: ['in_app', 'telegram'],
    }).catch((err) => console.error('[admin manual-payment] notify approved failed', err))

    return NextResponse.json({ order: updated })
  }

  const reason = cleanText(body.rejection_reason, 500) || 'Bukti pembayaran belum valid.'
  const now = new Date().toISOString()
  const { data: rejected, error: rejectError } = await supabase
    .from('manual_payment_orders')
    .update({ status: 'rejected', rejection_reason: reason, updated_at: now })
    .eq('id', order.id)
    .in('status', ['pending', 'under_review'])
    .select('id,order_code,user_id,plan,amount,status,payment_method,bank_name,account_number,account_name,buyer_name,buyer_whatsapp,proof_url,notes,rejection_reason,metadata,created_at,updated_at,expires_at,approved_at')
    .single()

  if (rejectError) {
    console.error('[admin manual-payment] reject failed', rejectError)
    return NextResponse.json({ error: 'Gagal reject order.' }, { status: 500 })
  }

  await writeAuditLog({
    supabase,
    orderId: order.id,
    admin: admin.user,
    action: 'rejected',
    notes: reason,
    metadata: { amount: order.amount, old_status: order.status },
  })

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
