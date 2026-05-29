import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/server-security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLANS = {
  basic: { label: 'NEXA Basic', amount: 19000 },
  pro: { label: 'NEXA Pro', amount: 39000 },
} as const

type PlanKey = keyof typeof PLANS

function midtransBaseUrl() {
  return process.env.MIDTRANS_IS_PRODUCTION === 'true'
    ? 'https://app.midtrans.com'
    : 'https://app.sandbox.midtrans.com'
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = checkRateLimit(`midtrans:create:${user.id}`, 5, 60 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan checkout. Coba lagi nanti.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      )
    }

    const body = await request.json().catch(() => ({}))
    const plan = body.plan === 'pro' ? 'pro' : body.plan === 'basic' ? 'basic' : null
    if (!plan) {
      return NextResponse.json({ error: 'Paket tidak valid.' }, { status: 400 })
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY
    if (!serverKey) {
      return NextResponse.json({ error: 'MIDTRANS_SERVER_KEY belum diisi di server.' }, { status: 500 })
    }

    const selected = PLANS[plan as PlanKey]
    const orderId = `NEXA-${plan}-${Date.now()}-${user.id.slice(0, 8)}`
    const service = createServiceClient()

    await service.from('payments').insert({
      order_id: orderId,
      user_id: user.id,
      plan,
      amount: selected.amount,
      provider: 'midtrans',
      status: 'pending',
    })

    const response = await fetch(`${midtransBaseUrl()}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: selected.amount,
        },
        item_details: [
          {
            id: plan,
            price: selected.amount,
            quantity: 1,
            name: selected.label,
          },
        ],
        customer_details: {
          email: user.email,
          first_name: user.user_metadata?.full_name || user.user_metadata?.name || 'NEXA User',
        },
        custom_field1: user.id,
        custom_field2: plan,
        callbacks: {
          finish: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://campus.nexatechlabs.my.id'}/dashboard/settings`,
        },
      }),
    })

    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      await service.from('payments').update({
        status: 'error',
        raw_response: payload,
        updated_at: new Date().toISOString(),
      }).eq('order_id', orderId).eq('user_id', user.id)

      return NextResponse.json(
        { error: payload?.error_messages?.[0] || 'Gagal membuat transaksi Midtrans.' },
        { status: 502 }
      )
    }

    await service.from('payments').update({
      snap_token: payload?.token ?? null,
      redirect_url: payload?.redirect_url ?? null,
      raw_response: payload,
      updated_at: new Date().toISOString(),
    }).eq('order_id', orderId).eq('user_id', user.id)

    return NextResponse.json({
      orderId,
      token: payload?.token,
      redirectUrl: payload?.redirect_url,
    })
  } catch (error) {
    console.error('[Midtrans create] Error:', error)
    return NextResponse.json({ error: 'Gagal membuat checkout Midtrans.' }, { status: 500 })
  }
}
