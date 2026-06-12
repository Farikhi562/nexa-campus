'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, BellRing, Infinity as InfinityIcon, LockKeyhole, Sparkles, Timer, Zap } from 'lucide-react'
import type { Plan } from '@/types'

function nextWeeklyDeadline() {
  // Countdown ke Minggu 23:59 waktu lokal.
  const now = new Date()
  const end = new Date(now)
  const daysUntilSunday = (7 - now.getDay()) % 7
  end.setDate(now.getDate() + daysUntilSunday)
  end.setHours(23, 59, 59, 999)
  if (end.getTime() <= now.getTime()) end.setDate(end.getDate() + 7)
  return end
}

function useCountdown() {
  const [target] = useState(nextWeeklyDeadline)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const diff = Math.max(0, target.getTime() - now)
  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return { days, hours, minutes, seconds }
}

function Segment({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-[2.6rem] rounded-xl bg-white/10 px-2 py-1.5 text-center text-lg font-black tabular-nums text-white">
        {String(value).padStart(2, '0')}
      </span>
      <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</span>
    </div>
  )
}

const lockedForRadar = [
  { icon: InfinityIcon, text: 'Deadline aktif lebih dari 5 item' },
  { icon: BellRing, text: 'Reminder H-1 dan hari-H' },
  { icon: Sparkles, text: 'AI Quick Add untuk bikin draft, tetap kamu yang cek' },
]

const lockedForPulse = [
  { icon: Zap, text: 'Rencana fokus harian untuk deadline yang paling dekat' },
  { icon: BellRing, text: 'Reminder H-7, H-3, H-1, dan jam pilihan' },
  { icon: Sparkles, text: 'Akses fitur beta lebih awal' },
]

export default function UpgradeCountdownCard({ userTier }: { userTier: Plan }) {
  const { days, hours, minutes, seconds } = useCountdown()

  if (userTier === 'command') return null

  const isRadar = userTier === 'radar'
  const targetPlan = isRadar ? 'Pulse' : 'Command'
  const lockedItems = isRadar ? lockedForRadar : lockedForPulse

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(45,212,191,0.22),transparent_18rem),radial-gradient(circle_at_90%_80%,rgba(56,189,248,0.16),transparent_16rem)]" />
      <div className="relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-200 animate-pulse-glow">
              <Timer className="h-3.5 w-3.5" />
              Yang masih terkunci
            </span>
            <h2 className="mt-3 text-xl font-black tracking-tight sm:text-2xl">
              NEXA {targetPlan} bikin deadline lebih susah kelewat.
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-300">
              {isRadar
                ? 'Radar cukup buat mulai rapi. Kalau deadline mulai numpuk, Pulse bantu ngingetin lebih aktif.'
                : 'Command cocok kalau jadwalmu padat dan reminder standar mulai kurang.'}
            </p>
          </div>
          <div className="flex gap-2">
            <Segment value={days} label="Hari" />
            <Segment value={hours} label="Jam" />
            <Segment value={minutes} label="Min" />
            <Segment value={seconds} label="Dtk" />
          </div>
        </div>

        <ul className="mt-5 grid gap-2.5 sm:grid-cols-3">
          {lockedItems.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
              <span className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-white/10">
                <Icon className="h-4 w-4 text-slate-300" />
                <LockKeyhole className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-slate-950 p-0.5 text-amber-300" />
              </span>
              <span className="text-xs font-bold leading-5 text-slate-200">{text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link
            href="/dashboard/billing"
            className="focus-ring inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-teal-900/30 transition hover:-translate-y-0.5 hover:bg-teal-300"
          >
            Lihat upgrade {targetPlan}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="focus-ring inline-flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/15"
          >
            Lihat semua fitur
          </Link>
        </div>
      </div>
    </section>
  )
}
