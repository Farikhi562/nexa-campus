import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  BILLING_PLANS,
  buildOrderCode,
  getManualPaymentMethod,
  isManualPaymentMethod,
  isPaidPlan,
  MANUAL_PAYMENT,
} from '@/lib/billing/plans'
import { notifyUser } from '@/lib/notifications/notify-user'

type CreateManualPaymentBody = {
  plan?: unknown
  payment_method?: unknown
  buyer_name?: unknown
  buyer_whatsapp?: unknown
  notes?: unknown
}

function cleanText(value: unknown, max = 500) {
  if (typeof value !== 'string') return null
  const text = value.trim().slice(0, max)
  return text || null
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message
  return 'Unknown error'
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Login dulu sebelum checkout. Bayar doang tanpa akun itu sedekah random, ANJJJ 😭' }, { status: 401 })
  }

  let body: CreateManualPaymentBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request checkout tidak valid.' }, { status: 400 })
  }

  if (!isPaidPlan(body.plan)) {
    return NextResponse.json({ error: 'Plan tidak valid. Pilih pulse atau command.' }, { status: 400 })
  }

  const requestedMethod = body.payment_method ?? 'bank_jago'
  if (!isManualPaymentMethod(requestedMethod)) {
    return NextResponse.json({ error: 'Metode pembayaran tidak valid. Pilih bank_jago atau bri_qris.' }, { status: 400 })
  }

  const plan = BILLING_PLANS[body.plan]
  const paymentMethod = getManualPaymentMethod(requestedMethod)

  const basePayload = {
    user_id: user.id,
    plan: plan.id,
    amount: plan.price,
    status: 'pending',
    payment_method: paymentMethod.id,
    bank_name: paymentMethod.bankName,
    account_number: paymentMethod.accountNumber,
    account_name: paymentMethod.accountName,
    buyer_name: cleanText(body.buyer_name, 120),
    buyer_whatsapp: cleanText(body.buyer_whatsapp, 40),
    notes: cleanText(body.notes, 500),
    metadata: {
      payment_label: paymentMethod.label,
      payment_type: paymentMethod.type,
      qr_image_url: paymentMethod.qrImageUrl || null,
      payment_bank_name: paymentMethod.bankName,
      payment_account_number: paymentMethod.accountNumber,
      payment_account_name: paymentMethod.accountName,
    },
  }

  let order = null
  let insertError: unknown = null

  // Retry kecil buat jaga-jaga order_code tabrakan. Kecil kemungkinannya, tapi database suka cari drama.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase
      .from('manual_payment_orders')
      .insert({ ...basePayload, order_code: buildOrderCode() })
      .select('id,order_code,plan,amount,status,payment_method,bank_name,account_number,account_name,metadata,created_at,expires_at')
      .single()

    if (!error) {
      order = data
      insertError = null
      break
    }

    insertError = error
    if (error.code !== '23505') break
  }

  if (!order) {
    console.error('[manual-payment] create order failed', insertError)
    return NextResponse.json(
      {
        error: 'Gagal bikin order manual payment. Cek migration manual_payment_orders.',
        detail: process.env.NODE_ENV === 'development' ? errorMessage(insertError) : undefined,
      },
      { status: 500 },
    )
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
