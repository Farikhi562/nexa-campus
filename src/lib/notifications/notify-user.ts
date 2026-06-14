import 'server-only'
import { BRAND } from '@/lib/brand'

type SupabaseLike = {
  from: (table: string) => any
}

export type NotifyUserInput = {
  supabase: SupabaseLike
  userId: string
  type: string
  title: string
  body: string
  url?: string | null
  dedupeKey?: string | null
  metadata?: Record<string, unknown>
  channels?: Array<'in_app' | 'telegram'>
}

function appUrl(path?: string | null) {
  if (!path) return BRAND.siteUrl
  if (/^https?:\/\//i.test(path)) return path
  return `${BRAND.siteUrl}${path.startsWith('/') ? path : `/${path}`}`
}

async function sendTelegramMessage(chatId: string, title: string, body: string, url?: string | null) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return { ok: false, reason: 'missing_token' }

  const text = [`*${title}*`, '', body].join('\n')
  const replyMarkup = url
    ? {
        inline_keyboard: [[{ text: 'Buka NEXA Campus', url: appUrl(url) }]],
      }
    : undefined

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
      disable_web_page_preview: true,
      reply_markup: replyMarkup,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    console.error('[notifyUser] Telegram send failed', response.status, errorText)
    return { ok: false, reason: 'telegram_failed' }
  }

  return { ok: true }
}

export async function notifyUser(input: NotifyUserInput) {
  const channels = input.channels ?? ['in_app', 'telegram']
  const url = input.url ?? '/dashboard'

  let notificationId: string | null = null

  if (channels.includes('in_app')) {
    const { data, error } = await input.supabase
      .from('notifications')
      .insert({
        user_id: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        url,
        channels,
        dedupe_key: input.dedupeKey ?? null,
        metadata: input.metadata ?? {},
      })
      .select('id')
      .single()

    if (error) {
      // 23505 = unique violation. Artinya notif duplicate, bukan kiamat nasional.
      if (error.code !== '23505') console.error('[notifyUser] insert notification failed', error)
    } else {
      notificationId = data?.id ?? null
    }
  }

  if (channels.includes('telegram')) {
    const { data: profile, error } = await input.supabase
      .from('profiles')
      .select('telegram_chat_id')
      .eq('id', input.userId)
      .maybeSingle()

    if (!error && profile?.telegram_chat_id) {
      await sendTelegramMessage(profile.telegram_chat_id, input.title, input.body, url)
    }
  }

  return { notificationId }
}
