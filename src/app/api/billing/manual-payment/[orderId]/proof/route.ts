import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyUser } from '@/lib/notifications/notify-user'

export const runtime = 'nodejs'

const BUCKET = 'payment-proofs'
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

type RouteContext = {
  params: { orderId: string }
}

function cleanText(value: FormDataEntryValue | null, max = 500) {
  if (typeof value !== 'string') return null
  const text = value.trim().slice(0, max)
  return text || null
}

function safeFileName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120) || 'payment-proof'
}

function extFromType(type: string) {
  if (type === 'image/jpeg') return 'jpg'
  if (type === 'image/png') return 'png'
  if (type === 'image/webp') return 'webp'
  if (type === 'application/pdf') return 'pdf'
  return 'bin'
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const supabaseUser = await createClient()
  const {
    data: { user },
  } = await supabaseUser.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Login dulu sebelum upload bukti bayar.' }, { status: 401 })
  }

  const orderId = params.orderId
  if (!orderId) {
    return NextResponse.json({ error: 'Order ID kosong.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: order, error: orderError } = await supabase
    .from('manual_payment_orders')
    .select('id,user_id,order_code,plan,amount,status,proof_url,metadata')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order tidak ditemukan.' }, { status: 404 })
  }

  if (order.user_id !== user.id) {
    return NextResponse.json({ error: 'Ini bukan order lu. Jangan jadi tuyul billing.' }, { status: 403 })
  }

  if (!['pending', 'under_review'].includes(order.status)) {
    return NextResponse.json({ error: `Order status ${order.status}, bukti bayar sudah tidak bisa diubah.` }, { status: 400 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Form upload tidak valid.' }, { status: 400 })
  }

  const proof = form.get('proof')
  const proofUrlFromForm = cleanText(form.get('proof_url'), 1000)
  let proofUrl = proofUrlFromForm
  let storagePath: string | null = null

  if (proof instanceof File && proof.size > 0) {
    if (proof.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File bukti maksimal 5MB. Jangan upload poster konser Taylor Swift sekalian.' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(proof.type)) {
      return NextResponse.json({ error: 'Format bukti harus JPG, PNG, WEBP, atau PDF.' }, { status: 400 })
    }

    const bytes = Buffer.from(await proof.arrayBuffer())
    const originalName = safeFileName(proof.name || `proof.${extFromType(proof.type)}`)
    storagePath = `${user.id}/${order.id}-${Date.now()}-${originalName}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
      contentType: proof.type,
      upsert: false,
    })

    if (uploadError) {
      console.error('[payment-proof] upload failed', uploadError)
      return NextResponse.json(
        { error: 'Gagal upload bukti. Cek bucket Supabase Storage payment-proofs dan migration v1.6.30.' },
        { status: 500 },
      )
    }

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
    proofUrl = publicUrlData.publicUrl
  }

  if (!proofUrl) {
    return NextResponse.json({ error: 'Upload file bukti atau isi proof_url dulu.' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const buyerName = cleanText(form.get('buyer_name'), 120)
  const buyerWhatsapp = cleanText(form.get('buyer_whatsapp'), 40)
  const notes = cleanText(form.get('notes'), 500)

  const { data: updated, error: updateError } = await supabase
    .from('manual_payment_orders')
    .update({
      proof_url: proofUrl,
      buyer_name: buyerName,
      buyer_whatsapp: buyerWhatsapp,
      notes,
      status: 'under_review',
      updated_at: now,
      metadata: {
        ...(typeof order.metadata === 'object' && order.metadata ? order.metadata : {}),
        proof_storage_path: storagePath,
        proof_uploaded_at: now,
      },
    })
    .eq('id', order.id)
    .eq('user_id', user.id)
    .in('status', ['pending', 'under_review'])
    .select('id,order_code,plan,amount,status,proof_url,buyer_name,buyer_whatsapp,notes,created_at,expires_at,approved_at,rejection_reason')
    .single()

  if (updateError) {
    console.error('[payment-proof] update failed', updateError)
    return NextResponse.json({ error: 'Bukti terupload, tapi gagal update order.' }, { status: 500 })
  }

  await notifyUser({
    supabase,
    userId: user.id,
    type: 'billing_proof_uploaded',
    title: 'Bukti pembayaran diterima',
    body: `Order ${order.order_code} sekarang under review. Admin tinggal approve, semoga adminnya nggak lagi ngopi tanpa sinyal.`,
    url: '/dashboard/billing',
    dedupeKey: `manual-payment-proof-${order.id}-${now.slice(0, 16)}`,
    metadata: { order_id: order.id, proof_url: proofUrl },
    channels: ['in_app', 'telegram'],
  }).catch((err) => console.error('[payment-proof] notify failed', err))

  return NextResponse.json({ order: updated })
}
