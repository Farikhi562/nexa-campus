import { CheckCircle2, Sparkles } from 'lucide-react'

export const NEXA_FOUNDER_EMAIL = 'fauzanalfa36@gmail.com'

export function isNexaFounder(profile?: { email?: string | null; founder_verified?: boolean | null } | null) {
  return Boolean(profile?.founder_verified) || (profile?.email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL
}

/**
 * Centang biru "Verified by NEXA" — BUKAN hiasan, jadi cuma tampil kalau
 * `profiles.is_nexa_verified = true` (disetel admin lewat alur review di
 * /api/admin/verifications, setelah user memenuhi syarat & diajukan).
 * Lihat docs/MIGRATION_arena_trust_verification.sql untuk skema lengkap.
 *
 * Prioritas tampilan: Founder (emas, animasi) > NEXA Verified (biru, tenang)
 * > tidak ada apa-apa. Props baru (`verified`) bersifat opsional supaya
 * ~10 tempat yang sudah memanggil komponen ini sebelumnya tetap jalan tanpa
 * perubahan — cukup tambahkan prop `verified={...}` di tempat yang mau ikut
 * menampilkan centang biru (lihat README Batch 7.1 untuk daftar tempatnya).
 */
export default function FounderVerifiedBadge({
  email,
  founderVerified,
  verified = false,
  compact = false,
}: {
  email?: string | null
  founderVerified?: boolean | null
  verified?: boolean | null
  compact?: boolean
}) {
  const isFounder = Boolean(founderVerified) || (email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL
  const isVerified = !isFounder && Boolean(verified)

  if (!isFounder && !isVerified) return null

  if (isFounder) {
    if (compact) {
      return (
        <span
          title="Founder & pencipta NEXA Campus"
          className="nexa-founder-check inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
        >
          <CheckCircle2 className="h-4 w-4" />
        </span>
      )
    }
    return (
      <span
        title="Founder & pencipta NEXA Campus"
        className="nexa-founder-verified inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Founder
        <Sparkles className="h-3 w-3" />
      </span>
    )
  }

  if (compact) {
    return (
      <span
        title="Verified by NEXA"
        className="nexa-verified-check inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-blue-600"
      >
        <CheckCircle2 className="h-4 w-4" />
      </span>
    )
  }
  return (
    <span
      title="Verified by NEXA"
      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-black text-blue-700 ring-1 ring-blue-200"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      Verified by NEXA
    </span>
  )
}
