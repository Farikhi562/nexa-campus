import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest, { params }: { params: { orderId: string } }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Login dulu.' }, { status: 401 })
  }

  let body: { proof_url?: unknown; notes?: unknown; buyer_name?: unknown; buyer_whatsapp?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const updates = {
    proof_url: typeof body.proof_url === 'string' ? body.proof_url.slice(0, 1000) : null,
    notes: typeof body.notes === 'string' ? body.notes.slice(0, 500) : null,
    buyer_name: typeof body.buyer_name === 'string' ? body.buyer_name.slice(0, 120) : null,
    buyer_whatsapp: typeof body.buyer_whatsapp === 'string' ? body.buyer_whatsapp.slice(0, 40) : null,
    status: 'under_review',
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('manual_payment_orders')
    .update(updates)
    .eq('id', params.orderId)
    .eq('user_id', user.id)
    .in('status', ['pending', 'under_review'])
    .select('id,order_code,plan,amount,status,payment_method,bank_name,account_number,account_name,metadata,proof_url,updated_at')
    .single()

  if (error) {
    console.error('[manual-payment] submit proof failed', error)
    return NextResponse.json({ error: 'Gagal submit bukti pembayaran. Cek order/status lo.' }, { status: 500 })
  }

  return NextResponse.json({ order: data, message: 'Bukti pembayaran masuk. Tinggal admin approve, ritual manusiawi yang belum bisa dihindari.' })
}
