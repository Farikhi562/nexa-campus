import 'server-only'

type TelegramSendResult =
  | { ok: true }
  | { ok: false; reason: 'missing_token' | 'missing_chat_id' | 'provider_error' }

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN)
}

export async function sendTelegramMessage(
  chatId: string | null | undefined,
  text: string
): Promise<TelegramSendResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN

  if (!token) return { ok: false, reason: 'missing_token' }
  if (!chatId) return { ok: false, reason: 'missing_chat_id' }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })

  if (!response.ok) return { ok: false, reason: 'provider_error' }
  return { ok: true }
}
