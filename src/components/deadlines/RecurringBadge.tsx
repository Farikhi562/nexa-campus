import { RefreshCw } from 'lucide-react'

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

type Props = {
  dayOfWeek?: number | null
  compact?: boolean
}

/**
 * Badge kecil yang ditampilkan di samping nama deadline/jadwal yang bersifat
 * berulang mingguan. Compact=true untuk versi ikon saja (di mobile / list padat).
 */
export default function RecurringBadge({ dayOfWeek, compact = false }: Props) {
  const dayLabel = dayOfWeek != null ? DAY_NAMES[dayOfWeek] : null

  if (compact) {
    return (
      <span
        title={`Jadwal berulang${dayLabel ? ' setiap ' + dayLabel : ' mingguan'}`}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-600"
      >
        <RefreshCw className="h-3 w-3" />
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-black text-sky-700 ring-1 ring-sky-200">
      <RefreshCw className="h-3 w-3" />
      {dayLabel ? `Tiap ${dayLabel}` : 'Mingguan'}
    </span>
  )
}
