import { NextRequest, NextResponse } from 'next/server'
import { sendTelegramMessage } from '@/lib/reminders/telegram'

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number | string
    }
    text?: string
    from?: {
      first_name?: string
    }
  }
}

export async function GET() {
  return NextResponse.json({
    status: process.env.TELEGRAM_BOT_TOKEN ? 'ready' : 'locked',
    message: process.env.TELEGRAM_BOT_TOKEN
      ? 'Telegram bot token tersedia.'
      : 'Telegram bot belum aktif karena TELEGRAM_BOT_TOKEN belum diisi.',
  })
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET

  // CATATAN KEAMANAN: SEBELUMNYA, kalau TELEGRAM_WEBHOOK_SECRET belum diset,
  // pengecekan ini dilewati sepenuhnya (fail-open) — siapa pun bisa POST ke
  // endpoint ini dengan chat.id sembarang dan membuat bot mengirim pesan ke
  // chat Telegram mana pun (open relay/spam memakai bot project ini).
  // Sekarang fail-CLOSED: kalau secret belum diset, endpoint ditolak sampai
  // diisi. Set TELEGRAM_WEBHOOK_SECRET di env, lalu daftarkan secret yang
  // sama saat memanggil Telegram setWebhook (parameter secret_token).
  if (!expectedSecret) {
    console.error('[telegram/webhook] TELEGRAM_WEBHOOK_SECRET belum diset di environment — webhook ditolak demi keamanan.')
    return NextResponse.json(
      { error: 'Webhook belum dikonfigurasi. Set TELEGRAM_WEBHOOK_SECRET di environment.' },
      { status: 503 }
    )
  }

  const incomingSecret = request.headers.get('x-telegram-bot-api-secret-token')
  if (incomingSecret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized webhook.' }, { status: 401 })
  }

  let update: TelegramUpdate
  try {
    update = (await request.json()) as TelegramUpdate
  } catch {
    return NextResponse.json({ error: 'Invalid Telegram update.' }, { status: 400 })
  }

  const chatId = update.message?.chat?.id?.toString()
  const name = update.message?.from?.first_name || 'teman NEXA'

  if (!chatId) {
    return NextResponse.json({ ok: true, ignored: true })
  }

  await sendTelegramMessage(
    chatId,
    [
      `Halo ${name}, ini NEXA Campus.`,
      '',
      `Chat ID Telegram kamu: <code>${chatId}</code>`,
      '',
      'Masukkan Chat ID ini di Settings Reminder NEXA Campus.',
      'NEXA tidak meminta password kampus dan hanya mengingatkan deadline yang kamu input sendiri.',
    ].join('\n')
  )

  return NextResponse.json({ ok: true })
}
