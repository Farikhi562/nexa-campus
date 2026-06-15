declare module 'web-push' {
  export interface PushSubscription {
    endpoint: string
    keys: {
      p256dh: string
      auth: string
    }
  }

  export interface RequestOptions {
    gcmAPIKey?: string
    vapidDetails?: VapidDetails
    timeout?: number
    TTL?: number
    headers?: Record<string, string | number>
    contentEncoding?: ContentEncoding
    proxy?: string | null
    agent?: unknown
  }

  export interface VapidDetails {
    subject: string
    publicKey: string
    privateKey: string
  }

  export type ContentEncoding = 'aesgcm' | 'aes128gcm'

  export interface SendResult {
    statusCode: number
    body: string
    headers: Record<string, string | string[]>
  }

  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void

  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: RequestOptions
  ): Promise<SendResult>

  export function generateVAPIDKeys(): { publicKey: string; privateKey: string }

  export function generateRequestDetails(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: RequestOptions
  ): unknown
}
