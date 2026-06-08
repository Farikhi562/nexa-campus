import { CheckCircle2, Sparkles } from 'lucide-react'

export const NEXA_FOUNDER_EMAIL = 'fauzanalfa36@gmail.com'

export function isNexaFounder(profile?: { email?: string | null; founder_verified?: boolean | null } | null) {
  return Boolean(profile?.founder_verified) || (profile?.email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL
}

export default function FounderVerifiedBadge({ email, founderVerified, compact = false }: { email?: string | null; founderVerified?: boolean | null; compact?: boolean }) {
  if (!founderVerified && (email ?? '').trim().toLowerCase() !== NEXA_FOUNDER_EMAIL) return null

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
