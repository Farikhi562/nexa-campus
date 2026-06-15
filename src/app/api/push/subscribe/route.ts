import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type SubscribeBody = {
  endpoint?: unknown
  keys?: { p256dh?: unknown; auth?: unknown }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: SubscribeBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const endpoint = typeof body.endpoint === 'string' ? body.endpoint : ''
  const p256dh = typeof body.keys?.p256dh === 'string' ? body.keys.p256dh : ''
  const auth = typeof body.keys?.auth === 'string' ? body.keys.auth : ''

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Subscription tidak valid.' }, { status: 400 })
  }

  const userAgent = request.headers.get('user-agent')?.slice(0, 300) ?? null

  const { error: subError } = await supabase
    .from('push_subscriptions')
    .upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: userAgent,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    )

  if (subError) {
    return NextResponse.json({ error: subError.message }, { status: 500 })
  }

  // Pastikan ada preferensi reminder untuk channel 'push'. Default: H-1 & hari-H aktif
  // (selaras dengan default kolom h1_enabled/day_enabled di reminder_preferences).
  const { error: prefError } = await supabase
    .from('reminder_preferences')
    .upsert(
      { user_id: user.id, channel: 'push' },
      { onConflict: 'user_id,channel', ignoreDuplicates: true }
    )

  if (prefError) {
    console.error('[push/subscribe] gagal set preferensi push:', prefError.message)
    // Tidak fatal — subscription tetap tersimpan.
  }

  return NextResponse.json({ ok: true })
}
