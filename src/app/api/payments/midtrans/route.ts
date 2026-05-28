import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const PLANS = {
  basic: { name: 'Basic', amount: 15000 },
  pro: { name: 'Pro', amount: 25000 },
} as const

type PlanId = keyof typeof PLANS

function isPlanId(value: string): value is PlanId {
  return value === 'basic' || value === 'pro'
}

function sanitizeText(value: unknown, maxLength: number) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : ''
}

export async function POST(request: Request) {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY
    if (!serverKey) {
      return NextResponse.json(
        { error: 'MIDTRANS_SERVER_KEY belum diisi di environment server.' },
        { status: 500 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Login dulu sebelum membuat pembayaran Midtrans.' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const planId = sanitizeText(body.plan, 20)

    if (!isPlanId(planId)) {
      return NextResponse.json({ error: 'Paket pembayaran tidak valid.' }, { status: 400 })
    }

    const plan = PLANS[planId]
    const metadata = user.user_metadata as { full_name?: unknown } | null
    const name = sanitizeText(body.name, 80) || sanitizeText(metadata?.full_name, 80) || 'NEXA User'
    const email = sanitizeText(body.email, 120) || user.email || ''
    const phone = sanitizeText(body.whatsapp, 30)
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const orderId = `NEXA-${planId.toUpperCase()}-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true'
    const snapBaseUrl = isProduction ? 'https://app.midtrans.com' : 'https://app.sandbox.midtrans.com'
    const auth = Buffer.from(`${serverKey}:`).toString('base64')

    const response = await fetch(`${snapBaseUrl}/snap/v1/transactions`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: plan.amount,
        },
        item_details: [
          {
            id: `nexa-${planId}`,
            price: plan.amount,
            quantity: 1,
            name: `NEXA ${plan.name} Plan`,
          },
        ],
        customer_details: {
          first_name: name,
          email,
          phone,
        },
        callbacks: {
          finish: `${origin}/dashboard/settings?payment=midtrans`,
        },
        custom_field1: user.id,
        custom_field2: planId,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('[Midtrans API] Error:', data)
      return NextResponse.json(
        { error: 'Gagal membuat transaksi Midtrans. Cek server key, mode sandbox/production, dan konfigurasi merchant.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      orderId,
      token: data.token,
      redirectUrl: data.redirect_url,
    })
  } catch (error) {
    console.error('[Midtrans Payment] Error:', error)
    return NextResponse.json(
      { error: 'Pembayaran Midtrans sedang bermasalah. Coba lagi sebentar lagi atau hubungi admin.' },
      { status: 500 }
    )
  }
}
