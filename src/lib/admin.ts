/**
 * Admin security helper.
 * Cek server-side — JANGAN import di client component.
 *
 * Priority: ADMIN_EMAILS env variable → hardcoded fallback.
 * Untuk production, isi ADMIN_EMAILS di Vercel env:
 *   ADMIN_EMAILS=fauzanalfa36@gmail.com,nexatechlabs271@gmail.com
 */

const FALLBACK_ADMIN_EMAILS = [
  'fauzanalfa36@gmail.com',
  'nexatechlabs271@gmail.com',
]

export function getAdminEmails(): string[] {
  const env = process.env.ADMIN_EMAILS
  if (env && env.trim()) {
    const parsed = env
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    if (parsed.length > 0) return parsed
  }
  return FALLBACK_ADMIN_EMAILS.map((e) => e.toLowerCase())
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return getAdminEmails().includes(email.trim().toLowerCase())
}
