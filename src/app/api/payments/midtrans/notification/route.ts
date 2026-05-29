import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLAN_AMOUNTS = {
  basic: 19000,
  pro: 39000,
} as const

type PaidPlan = keyof typeof PLAN_AMOUNTS

function signatureFor(payload: {
  order_id?: string
  status_code?: string
  gross_amount?: string
}, serverKey: string) {
  return createHash('sha512')
    .update(`${payload.order_id || ''}${payload.status_code || ''}${payload.gross_amount || ''}${serverKey}`)
    .digest('hex')
}

function planFromPayload(payload: Record<string, unknown>): PaidPlan | null {
  const customPlan = payload.custom_field2
  if (customPlan === 'basic' || customPlan === 'pro') return customPlan

  const orderId = String(payload.order_id || '')
  if (orderId.startsWith('NEXA-basic-')) return 'basic'
  if (orderId.startsWith('NEXA-pro-')) return 'pro'
  return null
}

export async function POST(request: Request) {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY
    if (!serverKey) {
      return NextResponse.json({ error: 'MIDTRANS_SERVER_KEY belum diisi.' }, { status: 500 })
    }

    const payload = await request.json().catch(() => null)
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const body = payload as Record<string, unknown>
    const orderId = String(body.order_id || '')
    const statusCode = String(body.status_code || '')
    const grossAmount = String(body.gross_amount || '')
    const receivedSignature = String(body.signature_key || '')
    const expectedSignature = signatureFor({ order_id: orderId, status_code: statusCode, gross_amount: grossAmount }, serverKey)

    if (!orderId || !receivedSignature || receivedSignature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid Midtrans signature' }, { status: 401 })
    }

    const plan = planFromPayload(body)
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const numericGross = Number(grossAmount)
    if (numericGross !== PLAN_AMOUNTS[plan]) {
      return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
    }

    const transactionStatus = String(body.transaction_status || '')
    const fraudStatus = String(body.fraud_status || '')
    const isPaid =
      transactionStatus === 'settlement' ||
      (transactionStatus === 'capture' && (fraudStatus === 'accept' || fraudStatus === ''))

    const service = createServiceClient()
    const { data: payment } = await service
      .from('payments')
      .select('user_id, plan, amount')
      .eq('order_id', orderId)
      .maybeSingle()

    if (!payment || payment.plan !== plan || Number(payment.amount) !== PLAN_AMOUNTS[plan]) {
      return NextResponse.json({ error: 'Payment record mismatch' }, { status: 409 })
    }

    await service.from('payments').update({
      status: isPaid ? 'paid' : transactionStatus || 'updated',
      transaction_status: transactionStatus,
      fraud_status: fraudStatus || null,
      raw_response: body,
      paid_at: isPaid ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('order_id', orderId)

    if (isPaid) {
      await service
        .from('profiles')
        .update({ plan })
        .eq('id', payment.user_id)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Midtrans notification] Error:', error)
    return NextResponse.json({ error: 'Gagal memproses notifikasi Midtrans.' }, { status: 500 })
  }
}
