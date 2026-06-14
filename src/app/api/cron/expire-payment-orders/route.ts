import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/notifications/notify-user'

export const runtime = 'nodejs'

function authOk(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = request.headers.get('authorization')
  const query = request.nextUrl.searchParams.get('secret')
  return header === `Bearer ${secret}` || query === secret
}

export async function GET(request: NextRequest) {
  if (!authOk(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: candidates, error: selectError } = await supabase
    .from('manual_payment_orders')
    .select('id,order_code,user_id,plan,amount,status,expires_at')
    .in('status', ['pending', 'under_review'])
    .lt('expires_at', now)
    .limit(200)

  if (selectError) {
    console.error('[expire-payment-orders] select failed', selectError)
    return NextResponse.json({ error: 'Gagal cek order expired.' }, { status: 500 })
  }

  const ids = (candidates ?? []).map((order) => order.id)
  if (ids.length === 0) return NextResponse.json({ expired: 0 })

  const { error: updateError } = await supabase
    .from('manual_payment_orders')
    .update({ status: 'expired', updated_at: now })
    .in('id', ids)

  if (updateError) {
    console.error('[expire-payment-orders] update failed', updateError)
    return NextResponse.json({ error: 'Gagal expire payment orders.' }, { status: 500 })
  }

  await Promise.allSettled(
    (candidates ?? []).map((order) =>
      notifyUser({
        supabase,
        userId: order.user_id,
        type: 'billing_manual_payment_expired',
        title: 'Order pembayaran expired',
        body: `Order ${order.order_code} sudah expired. Bikin order baru kalau masih mau upgrade, karena waktu ternyata tetap jalan walau kita pura-pura sibuk.`,
        url: '/dashboard/billing',
        dedupeKey: `manual-payment-expired-${order.id}`,
        metadata: { order_id: order.id, plan: order.plan, amount: order.amount },
        channels: ['in_app', 'telegram'],
      }),
    ),
  )

  return NextResponse.json({ expired: ids.length })
}
