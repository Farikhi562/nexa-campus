import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage, buildWhatsAppTestMessage, waConfigured, normalizeIndonesianPhone } from '@/lib/whatsapp'

function cleanPhone(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })
  }

  if (!waConfigured()) {
    return NextResponse.json(
      { error: 'WABLAS_API_URL / WABLAS_TOKEN belum tersedia di server. Cek .env.local lalu restart dev server.' },
      { status: 400 }
    )
  }

  let body: { whatsappNumber?: unknown }
  try {
    body = (await request.json()) as { whatsappNumber?: unknown }
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const whatsappNumber = cleanPhone(body.whatsappNumber)
  if (!whatsappNumber) {
    return NextResponse.json({ error: 'Nomor WhatsApp wajib diisi dulu.' }, { status: 400 })
  }
  if (!normalizeIndonesianPhone(whatsappNumber)) {
    return NextResponse.json({ error: 'Format nomor WhatsApp tidak dikenali.' }, { status: 400 })
  }

  const result = await sendWhatsAppMessage(whatsappNumber, buildWhatsAppTestMessage())

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error || 'WhatsApp menolak pesan test. Cek nomor dan pastikan device Wablas online.' },
      { status: 502 }
    )
  }

  await supabase
    .from('profiles')
    .update({ whatsapp_number: whatsappNumber })
    .eq('id', user.id)

  return NextResponse.json({ message: 'Test WhatsApp terkirim. Cek chat kamu.' })
}
