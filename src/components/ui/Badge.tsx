import clsx from 'clsx'
import type { Plan } from '@/types'

const PLAN_CONFIG: Record<Plan, { label: string; className: string }> = {
  free:  { label: 'Gratis',    className: 'bg-slate-100 text-slate-600 border-slate-200' },
  basic: { label: 'Basic',     className: 'bg-blue-50 text-blue-600 border-blue-200' },
  pro:   { label: 'Pro ✦',     className: 'bg-amber-50 text-amber-600 border-amber-300' },
}

export function PlanBadge({ plan, className }: { plan: Plan; className?: string }) {
  const cfg = PLAN_CONFIG[plan]
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold border',
        cfg.className,
        className
      )}
    >
      {cfg.label}
    </span>
  )
}

interface StatusBadgeProps {
  status: 'pending' | 'processing' | 'completed' | 'error'
  className?: string
}

const STATUS_CONFIG = {
  pending:    { label: 'Menunggu',   className: 'bg-slate-100 text-slate-500 border-slate-200' },
  processing: { label: 'Memproses…', className: 'bg-blue-50 text-blue-600 border-blue-200 animate-pulse' },
  completed:  { label: 'Siap',       className: 'bg-green-50 text-green-700 border-green-200' },
  error:      { label: 'Error',      className: 'bg-red-50 text-red-600 border-red-200' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border', cfg.className, className)}>
      {cfg.label}
    </span>
  )
}

export { PlanBadge as Badge }
export default PlanBadge
