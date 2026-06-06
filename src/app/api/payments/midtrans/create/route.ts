import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createSnapTransaction, getMidtransConfig } from '@/lib/payments/midtrans'
import { BRAND } from '@/lib/brand'

const PLAN_AMOUNTS: Record<'pulse' | 'command', number> = {
  pulse: 15000,
  command: 25000,
}

export async function POST(request: NextRequest) {
  const config = getMidtransConfig()
  if (!config) {
    return NextResponse.json(
      { error: 'Pembayaran online belum dikonfigurasi. Hubungi admin atau pakai metode manual.' },
      { status: 503 }
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: { plan?: unknown }
  try {
    body = (await request.json()) as { plan?: unknown }
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const plan = body.plan === 'pulse' || body.plan === 'command' ? body.plan : null
  if (!plan) return NextResponse.json({ error: 'Plan tidak valid.' }, { status: 400 })

  const amount = PLAN_AMOUNTS[plan]
  const orderId = `NEXA-${plan.toUpperCase()}-${user.id.slice(0, 8)}-${Date.now()}`

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  // Catat order pakai service client (RLS: user tidak boleh insert sendiri).
  try {
    const service = createServiceClient()
    await service.from('payment_orders').insert({
      order_id: orderId,
      user_id: user.id,
      plan,
      amount,
      status: 'pending',
      provider: 'midtrans',
    })
  } catch {
    return NextResponse.json(
      { error: 'Gagal menyiapkan order. Pastikan tabel payment_orders & SUPABASE_SERVICE_ROLE_KEY sudah diset.' },
      { status: 500 }
    )
  }

  try {
    const { token, redirectUrl } = await createSnapTransaction(config, {
      orderId,
      amount,
      itemName: `NEXA ${plan === 'pulse' ? 'Pulse' : 'Command'} (1 bulan)`,
      customer: { name: (profile as { full_name?: string | null } | null)?.full_name, email: user.email },
      finishUrl: `${BRAND.siteUrl}/dashboard/billing`,
    })
    return NextResponse.json({ token, redirectUrl, orderId })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal membuat transaksi.' },
      { status: 502 }
    )
  }
}
