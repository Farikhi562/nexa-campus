import { ALL_BADGE_KEYS } from './catalog'

export function normalizeEmail(email?: string | null) {
  return (email || '').trim().toLowerCase()
}

export function envEmailList(value?: string) {
  return (value || '')
    .split(',')
    .map((item) => normalizeEmail(item))
    .filter(Boolean)
}

export function ownerEmails() {
  return Array.from(
    new Set([
      ...envEmailList(process.env.NEXA_OWNER_EMAILS),
      ...envEmailList(process.env.COMMAND_LIFETIME_EMAILS),
      ...envEmailList(process.env.ADMIN_EMAILS),
      // safety fallback buat owner project. Jangan hapus kecuali akun owner berubah.
      'fauzanalfa36@gmail.com',
    ])
  )
}

export function isOwnerEmail(email?: string | null) {
  return ownerEmails().includes(normalizeEmail(email))
}

export function getOwnerAutoBadges(email?: string | null) {
  return isOwnerEmail(email) ? ALL_BADGE_KEYS : []
}

export function autoBadgesForPlan(plan?: string | null, email?: string | null) {
  const ownerBadges = getOwnerAutoBadges(email)
  if (ownerBadges.length) return ownerBadges

  const badges = new Set<string>()
  if (plan === 'command') {
    badges.add('command_spark')
    badges.add('command_elite')
  }
  if (plan === 'pulse') badges.add('pulse_spark')

  return Array.from(badges)
}
