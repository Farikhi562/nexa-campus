import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  BILLING_PLANS,
  buildOrderCode,
  getManualPaymentMethod,
  isPaidPlan,
  MANUAL_PAYMENT,
} from '@/lib/billing/plans'
import { notifyUser } from '@/lib/notifications/notify-user'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Login dulu sebelum checkout. Bayar doang tanpa akun itu sedekah random, ANJJJ 😭' }, { status: 401 })
  }

  let body: { plan?: unknown; payment_method?: unknown; buyer_name?: unknown; buyer_whatsapp?: unknown; notes?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request checkout tidak valid.' }, { status: 400 })
  }

  if (!isPaidPlan(body.plan)) {
    return NextResponse.json({ error: 'Plan tidak valid. Pilih pulse atau command.' }, { status: 400 })
  }

  const plan = BILLING_PLANS[body.plan]
  const paymentMethod = getManualPaymentMethod(body.payment_method)
  const orderCode = buildOrderCode()

  const payload = {
    user_id: user.id,
    order_code: orderCode,
    plan: plan.id,
    amount: plan.price,
    status: 'pending',
    payment_method: paymentMethod.id,
    bank_name: paymentMethod.bankName,
    account_number: paymentMethod.accountNumber,
    account_name: paymentMethod.accountName,
    buyer_name: typeof body.buyer_name === 'string' ? body.buyer_name.slice(0, 120) : null,
    buyer_whatsapp: typeof body.buyer_whatsapp === 'string' ? body.buyer_whatsapp.slice(0, 40) : null,
    notes: typeof body.notes === 'string' ? body.notes.slice(0, 500) : null,
    metadata: {
      payment_label: paymentMethod.label,
      payment_type: paymentMethod.type,
      qr_image_url: paymentMethod.qrImageUrl || null,
    },
  }

  const { data: order, error } = await supabase
    .from('manual_payment_orders')
    .insert(payload)
    .select('id,order_code,plan,amount,status,payment_method,bank_name,account_number,account_name,metadata,created_at,expires_at')
    .single()

  if (error) {
    console.error('[manual-payment] create order failed', error)
    return NextResponse.json({ error: 'Gagal bikin order manual payment. Cek migration manual_payment_orders.' }, { status: 500 })
  }

  await notifyUser({
    supabase,
    userId: user.id,
    type: 'billing_manual_payment_created',
    title: 'Instruksi pembayaran NEXA dibuat',
    body: `Order ${order.order_code} untuk ${plan.name} sebesar Rp${plan.price.toLocaleString('id-ID')}. Metode: ${paymentMethod.label} (${paymentMethod.accountNumber}).`,
    url: '/dashboard/billing',
    dedupeKey: `manual-payment-created-${order.id}`,
    metadata: { order_id: order.id, plan: plan.id, amount: plan.price, payment_method: paymentMethod.id },
    channels: ['in_app', 'telegram'],
  }).catch((err) => console.error('[manual-payment] notify failed', err))

  return NextResponse.json({
    order,
    payment: {
      method: paymentMethod.id,
      label: paymentMethod.label,
      type: paymentMethod.type,
      bank_name: paymentMethod.bankName,
      account_number: paymentMethod.accountNumber,
      account_name: paymentMethod.accountName,
      qr_image_url: paymentMethod.qrImageUrl || null,
      confirmation_whatsapp: MANUAL_PAYMENT.confirmationWhatsapp || null,
    },
    message: 'Order dibuat. Bayar manual dulu, nanti admin approve. Startup mode hemat, hidup memang begitu.',
  })
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Login dulu.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('manual_payment_orders')
    .select('id,order_code,plan,amount,status,payment_method,bank_name,account_number,account_name,metadata,proof_url,rejection_reason,created_at,expires_at,approved_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('[manual-payment] list orders failed', error)
    return NextResponse.json({ error: 'Gagal mengambil riwayat pembayaran.' }, { status: 500 })
  }

  return NextResponse.json({ orders: data ?? [] })
}
