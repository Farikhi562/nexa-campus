import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function cleanChatId(value: unknown) {
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

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN belum tersedia di server. Cek .env.local lalu restart dev server.' },
      { status: 400 }
    )
  }

  let body: { telegramChatId?: unknown }
  try {
    body = (await request.json()) as { telegramChatId?: unknown }
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const telegramChatId = cleanChatId(body.telegramChatId)
  if (!telegramChatId) {
    return NextResponse.json({ error: 'Telegram chat ID wajib diisi dulu.' }, { status: 400 })
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramChatId,
      text:
        'Halo dari NEXA Campus. Telegram reminder kamu sudah terhubung. Kamu akan mendapat pengingat sesuai pengaturan yang dipilih.',
      disable_web_page_preview: true,
    }),
  })

  const result = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null

  if (!response.ok || !result?.ok) {
    return NextResponse.json(
      { error: result?.description || 'Telegram menolak pesan test. Cek chat ID dan pastikan sudah start bot.' },
      { status: 502 }
    )
  }

  await supabase
    .from('profiles')
    .update({ telegram_chat_id: telegramChatId })
    .eq('id', user.id)

  return NextResponse.json({ message: 'Test Telegram terkirim. Cek chat kamu.' })
}
