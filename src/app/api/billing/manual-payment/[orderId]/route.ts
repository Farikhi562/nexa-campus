import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type RouteContext = {
  params: { orderId: string } | Promise<{ orderId: string }>
}

function cleanText(value: unknown, max = 500) {
  if (typeof value !== 'string') return undefined
  const text = value.trim().slice(0, max)
  return text || null
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { orderId } = await context.params
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

  const updates: Record<string, string | null> = {}

  const proofUrl = cleanText(body.proof_url, 1000)
  const notes = cleanText(body.notes, 500)
  const buyerName = cleanText(body.buyer_name, 120)
  const buyerWhatsapp = cleanText(body.buyer_whatsapp, 40)

  if (proofUrl !== undefined) updates.proof_url = proofUrl
  if (notes !== undefined) updates.notes = notes
  if (buyerName !== undefined) updates.buyer_name = buyerName
  if (buyerWhatsapp !== undefined) updates.buyer_whatsapp = buyerWhatsapp

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Isi minimal proof_url, notes, buyer_name, atau buyer_whatsapp.' }, { status: 400 })
  }

  updates.status = 'under_review'
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('manual_payment_orders')
    .update(updates)
    .eq('id', orderId)
    .eq('user_id', user.id)
    .in('status', ['pending', 'under_review'])
    .select('id,order_code,plan,amount,status,payment_method,bank_name,account_number,account_name,metadata,proof_url,buyer_name,buyer_whatsapp,notes,updated_at')
    .maybeSingle()

  if (error) {
    console.error('[manual-payment] submit proof failed', error)
    return NextResponse.json({ error: 'Gagal submit bukti pembayaran. Cek order/status lo.' }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Order tidak ditemukan atau statusnya sudah tidak bisa diubah.' }, { status: 404 })
  }

  return NextResponse.json({ order: data, message: 'Bukti pembayaran masuk. Tinggal admin approve, ritual manusiawi yang belum bisa dihindari.' })
}
