import 'server-only'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'

export const MAX_AI_INPUT_CHARS = 12_000
export const MAX_GEMINI_PDF_SIZE = 5 * 1024 * 1024

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>()

export function isPdfBytes(bytes: Buffer) {
  return bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-'
}

export function publicError(message = 'Request tidak dapat diproses.') {
  return { error: message }
}

export function normalizeRoomCode(value: unknown) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)
}

export function clampText(value: unknown, max = MAX_AI_INPUT_CHARS) {
  return String(value || '').trim().slice(0, max)
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return (
    forwarded ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = rateLimitBuckets.get(key)

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true as const, remaining: limit - 1, retryAfter: 0 }
  }

  if (current.count >= limit) {
    return {
      ok: false as const,
      remaining: 0,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    }
  }

  current.count += 1
  rateLimitBuckets.set(key, current)
  return {
    ok: true as const,
    remaining: Math.max(limit - current.count, 0),
    retryAfter: 0,
  }
}

export function hashSecret(secret: string) {
  const salt = randomBytes(16).toString('hex')
  const hash = createHash('sha256').update(`${salt}:${secret}`).digest('hex')
  return `${salt}:${hash}`
}

export function verifySecret(secret: string, stored: string) {
  const [salt, expected] = stored.split(':')
  if (!salt || !expected) return false
  const actual = createHash('sha256').update(`${salt}:${secret}`).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'hex')
  const actualBuffer = Buffer.from(actual, 'hex')
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer)
}
