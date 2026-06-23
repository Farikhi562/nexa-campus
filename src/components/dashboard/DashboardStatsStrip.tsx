import { CalendarClock, CheckCircle2, Flame, Target } from 'lucide-react'
import type { AcademicDeadline } from '@/types'

function daysBetween(dateStr: string) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86400000)
}

function getStreak(deadlines: AcademicDeadline[]): number {
  // Hitung berapa hari berturut-turut user menyelesaikan minimal 1 deadline
  const completedDays = new Set<string>()
  for (const d of deadlines) {
    if (d.status === 'completed' && d.updated_at) {
      completedDays.add(d.updated_at.slice(0, 10))
    }
  }
  if (completedDays.size === 0) return 0

  let streak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (completedDays.has(key)) streak++
    else if (i > 0) break // streak putus
  }
  return streak
}

type Stat = {
  label: string
  value: string | number
  sub: string
  icon: typeof Target
  color: string
  bg: string
}

export default function DashboardStatsStrip({ deadlines }: { deadlines: AcademicDeadline[] }) {
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 86400000)

  const active = deadlines.filter((d) => d.status !== 'completed').length
  const dueSoon = deadlines.filter((d) => {
    if (d.status === 'completed') return false
    const days = daysBetween(d.deadline_date)
    return days >= 0 && days <= 3
  }).length
  const doneThisWeek = deadlines.filter(
    (d) => d.status === 'completed' && d.updated_at && new Date(d.updated_at) >= weekAgo
  ).length
  const total = deadlines.length
  const rate = total > 0 ? Math.round((deadlines.filter((d) => d.status === 'completed').length / total) * 100) : 0
  const streak = getStreak(deadlines)

  const stats: Stat[] = [
    {
      label: 'Aktif',
      value: active,
      sub: 'deadline belum selesai',
      icon: Target,
      color: 'text-brand-700',
      bg: 'bg-brand-50',
    },
    {
      label: '≤ 3 hari',
      value: dueSoon,
      sub: dueSoon === 0 ? 'tidak ada yang mepet' : 'deadline mepet — cek sekarang',
      icon: CalendarClock,
      color: dueSoon > 0 ? 'text-red-700' : 'text-slate-600',
      bg: dueSoon > 0 ? 'bg-red-50' : 'bg-slate-50',
    },
    {
      label: 'Minggu ini',
      value: doneThisWeek,
      sub: 'selesai 7 hari terakhir',
      icon: CheckCircle2,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
    },
    {
      label: streak > 0 ? `${streak}🔥 Streak` : 'Streak',
      value: `${rate}%`,
      sub: `completion rate · ${streak > 0 ? `${streak} hari berturut` : 'mulai sekarang'}`,
      icon: Flame,
      color: streak >= 3 ? 'text-amber-700' : 'text-slate-600',
      bg: streak >= 3 ? 'bg-amber-50' : 'bg-slate-50',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-xl shadow-slate-200/70"
          >
            <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-2xl ${stat.bg}`}>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-black leading-none ${stat.color}`}>{stat.value}</p>
            <p className="mt-1 text-xs font-black text-slate-500">{stat.label}</p>
            <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{stat.sub}</p>
          </div>
        )
      })}
    </div>
  )
}
