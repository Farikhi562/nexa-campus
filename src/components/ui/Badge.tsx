import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone
}

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100/80 text-slate-700 ring-1 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  danger: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  info: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
}

export default function Badge({ className, tone = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-black leading-none',
        tones[tone],
        className
      )}
      {...props}
    />
  )
}
