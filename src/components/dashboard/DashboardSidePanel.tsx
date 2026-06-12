'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BellRing, ChevronDown, ChevronUp, Plus, Settings, Sparkles } from 'lucide-react'
import { PLAN_LABELS } from '@/lib/nexa-data'
import type { Plan } from '@/types'

const planColors: Record<Plan, string> = {
  radar: 'bg-slate-100 text-slate-700',
  pulse: 'bg-blue-100 text-blue-700',
  command: 'bg-teal-100 text-teal-800',
}

const planFeatures: Record<Plan, string[]> = {
  radar: ['Maksimal 5 deadline aktif', 'Dashboard inti', 'Countdown deadline'],
  pulse: ['Deadline aktif tanpa batas', 'Reminder H-1 dan hari-H', 'Ringkasan mingguan'],
  command: ['Reminder H-7, H-3, H-1', 'AI Quick Add beta', 'Akses fitur lebih awal'],
}

const quickActions = [
  { label: 'Tambah Deadline', href: '/dashboard/deadlines/new', icon: Plus },
  { label: 'AI Quick Add', href: '/dashboard/deadlines/quick-add', icon: Sparkles },
  { label: 'Reminder', href: '/dashboard/settings/reminders', icon: BellRing },
  { label: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardSidePanel({ userTier }: { userTier: Plan }) {
  const [showFeatures, setShowFeatures] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="focus-ring flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-black text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0 text-teal-600" />
            <span className="truncate leading-tight">{label}</span>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Plan Aktif</p>
            <p className="mt-0.5 text-sm font-black text-slate-950">{PLAN_LABELS[userTier]}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${planColors[userTier]}`}>
            {PLAN_LABELS[userTier].toUpperCase()}
          </span>
        </div>

        <button
          onClick={() => setShowFeatures((value) => !value)}
          className="mt-2 flex w-full items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-700"
        >
          Fitur aktif
          {showFeatures ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showFeatures && (
          <ul className="mt-2 space-y-1">
            {planFeatures[userTier].map((feature) => (
              <li key={feature} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                <span className="mt-0.5 text-teal-500">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        )}

        {userTier === 'radar' && (
          <Link href="/dashboard/billing" className="mt-3 flex items-center justify-center rounded-xl bg-teal-500 px-3 py-2 text-xs font-black text-white hover:bg-teal-400">
            Lihat Pulse →
          </Link>
        )}
      </div>
    </div>
  )
}
