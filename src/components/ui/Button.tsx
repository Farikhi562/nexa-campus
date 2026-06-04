import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-brand-600 to-cyan-500 text-white shadow-lg shadow-brand-500/20 hover:from-brand-700 hover:to-cyan-600',
  secondary: 'bg-slate-950 text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800',
  outline: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
  danger: 'bg-red-600 text-white shadow-lg shadow-red-500/15 hover:bg-red-700',
}

export default function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'focus-ring inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60',
        'duration-200 hover:-translate-y-0.5',
        variants[variant],
        className
      )}
      {...props}
    />
  )
}
