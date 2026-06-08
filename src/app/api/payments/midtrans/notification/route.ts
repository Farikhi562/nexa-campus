import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getMidtransConfig, verifyMidtransSignature } from '@/lib/payments/midtrans'

type Notification = {
  order_id?: string
  status_code?: string
  gross_amount?: string
  signature_key?: string
  transaction_status?: string
  fraud_status?: string
}

export async function POST(request: NextRequest) {
  const config = getMidtransConfig()
  if (!config) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  let body: Notification
  try {
    body = (await request.json()) as Notification
  } catch {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = body
  if (!order_id || !status_code || !gross_amount || !signature_key) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  const valid = verifyMidtransSignature({
    orderId: order_id,
    statusCode: status_code,
    grossAmount: gross_amount,
    signatureKey: signature_key,
    serverKey: config.serverKey,
  })
  if (!valid) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 403 })
  }

  let service
  try {
    service = createServiceClient()
  } catch {
    return NextResponse.json({ error: 'service_unavailable' }, { status: 500 })
  }

  const { data: order } = await service
    .from('payment_orders')
    .select('*')
    .eq('order_id', order_id)
    .maybeSingle()

  if (!order) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 })
  }

  const isPaid =
    (transaction_status === 'settlement' || transaction_status === 'capture') &&
    fraud_status !== 'deny'

  let status: 'paid' | 'failed' | 'pending' | 'expired' | 'cancelled' = 'pending'
  if (isPaid) status = 'paid'
  else if (transaction_status === 'expire') status = 'expired'
  else if (transaction_status === 'cancel' || transaction_status === 'deny') status = 'cancelled'
  else if (transaction_status === 'failure') status = 'failed'

  await service
    .from('payment_orders')
    .update({ status, raw_status: transaction_status ?? null })
    .eq('order_id', order_id)

  // Hanya upgrade kalau benar-benar dibayar dan belum pernah diproses.
  if (isPaid && order.status !== 'paid') {
    const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    await service.from('profiles').update({
      plan: order.plan,
      plan_expires_at: planExpiresAt,
      subscription_expires_at: planExpiresAt,
      subscription_status: 'active',
      updated_at: new Date().toISOString(),
    }).eq('id', order.user_id)
    await service
      .from('subscription_intents')
      .insert({
        user_id: order.user_id,
        requested_plan: order.plan,
        payment_method: 'qris',
        status: 'confirmed',
        contact_note: `Midtrans auto: ${order_id}`,
      })
      .then(undefined, () => null)
  }

  return NextResponse.json({ received: true })
}
