import 'server-only'
import webpush from 'web-push'

export type PushSubscriptionJSON = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export type PushPayload = {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
}

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@nexatechlabs.my.id'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export function pushConfigured(): boolean {
  return ensureConfigured()
}

export type SendPushResult =
  | { ok: true }
  | { ok: false; gone: boolean; statusCode?: number; error: string }

/**
 * Kirim 1 notifikasi push ke 1 subscription.
 * `gone: true` artinya subscription sudah tidak valid (404/410) → hapus dari DB.
 */
export async function sendWebPush(
  subscription: PushSubscriptionJSON,
  payload: PushPayload
): Promise<SendPushResult> {
  if (!ensureConfigured()) {
    return { ok: false, gone: false, error: 'VAPID belum dikonfigurasi (NEXT_PUBLIC_VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY).' }
  }

  try {
    await webpush.sendNotification(
      subscription as unknown as Parameters<typeof webpush.sendNotification>[0],
      JSON.stringify(payload)
    )
    return { ok: true }
  } catch (err) {
    const statusCode = (err as { statusCode?: number } | undefined)?.statusCode
    const gone = statusCode === 404 || statusCode === 410
    return {
      ok: false,
      gone,
      statusCode,
      error: err instanceof Error ? err.message : 'Push gagal terkirim.',
    }
  }
}
