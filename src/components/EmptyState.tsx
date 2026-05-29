import Link from 'next/link'
import Button from '@/components/ui/Button'

type EmptyStateProps = {
  title: string
  description?: string
  actionLabel: string
  href?: string
  onAction?: () => void
  variant?: 'documents' | 'reminders' | 'marketplace' | 'study' | 'search'
}

function Illustration({ variant = 'documents' }: { variant?: EmptyStateProps['variant'] }) {
  const accent =
    variant === 'marketplace' ? '#10b981' :
    variant === 'reminders' ? '#f59e0b' :
    variant === 'study' ? '#8b5cf6' :
    variant === 'search' ? '#64748b' :
    '#2563eb'

  return (
    <svg viewBox="0 0 220 150" className="mx-auto h-32 w-48" role="img" aria-hidden="true">
      <rect x="22" y="28" width="176" height="96" rx="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
      <circle cx="70" cy="76" r="24" fill={accent} opacity="0.15" />
      <rect x="104" y="56" width="62" height="8" rx="4" fill={accent} opacity="0.45" />
      <rect x="104" y="74" width="44" height="8" rx="4" fill="#cbd5e1" />
      <rect x="54" y="100" width="112" height="10" rx="5" fill="#e2e8f0" />
      <path d="M62 76h16l-8-14 22 21H76l8 15-22-22Z" fill={accent} />
      <circle cx="177" cy="38" r="12" fill={accent} opacity="0.25" />
      <circle cx="42" cy="120" r="8" fill={accent} opacity="0.18" />
    </svg>
  )
}

export default function EmptyState({
  title,
  description,
  actionLabel,
  href,
  onAction,
  variant,
}: EmptyStateProps) {
  const button = (
    <Button type="button" size="lg" onClick={onAction} className="mx-auto">
      {actionLabel}
    </Button>
  )

  return (
    <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-8 text-center">
      <Illustration variant={variant} />
      <h3 className="mt-3 text-lg font-black text-slate-950">{title}</h3>
      {description && <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
      <div className="mt-6">
        {href ? <Link href={href}>{button}</Link> : button}
      </div>
    </div>
  )
}
