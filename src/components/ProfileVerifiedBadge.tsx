import { CheckCircle2 } from 'lucide-react'

export default function ProfileVerifiedBadge({
  verified,
  compact = false,
}: {
  verified?: boolean | null
  compact?: boolean
}) {
  if (!verified) return null

  if (compact) {
    return (
      <span
        title="Profil Arena terverifikasi"
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white ring-2 ring-blue-100"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
      </span>
    )
  }

  return (
    <span
      title="Profil Arena terverifikasi"
      className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700 ring-1 ring-blue-200"
    >
      <CheckCircle2 className="h-3.5 w-3.5" />
      Profil verified
    </span>
  )
}
