import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWebPush, pushConfigured } from '@/lib/push/web-push'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  if (!pushConfigured()) {
    return NextResponse.json(
      { error: 'Web Push belum dikonfigurasi di server (VAPID key kosong).' },
      { status: 503 }
    )
  }

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!subs?.length) {
    return NextResponse.json({ error: 'Belum ada device yang terdaftar untuk notifikasi.' }, { status: 404 })
  }

  let sent = 0
  let removed = 0
  for (const sub of subs) {
    const result = await sendWebPush(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      {
        title: '🔔 NEXA Campus',
        body: 'Notifikasi tes berhasil! Reminder deadline akan muncul seperti ini.',
        url: '/dashboard',
        tag: 'test',
      }
    )
    if (result.ok) {
      sent++
    } else if (result.gone) {
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      removed++
    }
  }

  return NextResponse.json({ ok: true, sent, removed, total: subs.length })
}
