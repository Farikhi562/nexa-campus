import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendTelegramMessage, buildTestMessage } from '@/lib/telegram'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('telegram_chat_id, full_name')
    .eq('id', user.id)
    .maybeSingle()

  const chatId = (profile as { telegram_chat_id?: string | null } | null)?.telegram_chat_id
  if (!chatId?.trim()) {
    return NextResponse.json({
      error: 'Kamu belum mengisi Telegram Chat ID di profil. Isi dulu di Pengaturan → Reminder.'
    }, { status: 400 })
  }

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    return NextResponse.json({
      error: 'Bot Telegram belum dikonfigurasi oleh admin. Pastikan TELEGRAM_BOT_TOKEN sudah diset di Vercel.'
    }, { status: 503 })
  }

  const result = await sendTelegramMessage(chatId.trim(), buildTestMessage())

  if (!result.ok) {
    return NextResponse.json({
      error: `Gagal mengirim tes Telegram: ${result.error}. Pastikan Chat ID benar dan kamu sudah pernah /start ke bot.`
    }, { status: 400 })
  }

  return NextResponse.json({ ok: true, message: 'Pesan tes berhasil dikirim ke Telegram kamu!' })
}
