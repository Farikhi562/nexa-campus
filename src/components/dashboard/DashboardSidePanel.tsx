import Link from 'next/link'
import { BellRing, CheckCircle2, LockKeyhole, Plus, Settings, Sparkles } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { PLAN_LABELS } from '@/lib/nexa-data'
import type { Plan } from '@/types'

const planFeatures: Record<Plan, string[]> = {
  radar: [
    'Maksimal 5 active deadlines',
    'Dashboard basic',
    'Countdown deadline',
    'Manual input deadline',
    'AI Quick Add locked preview',
  ],
  pulse: [
    'Unlimited deadlines',
    'Reminder H-1 dan hari-H',
    'Weekly summary',
    'Kategori deadline lengkap',
    'Basic priority',
  ],
  command: [
    'Semua fitur Pulse',
    'Custom reminder H-7, H-3, H-1, hari-H',
    'Custom reminder time',
    'AI Quick Add beta',
    'Ask NEXA locked preview',
    'Beta feature access',
  ],
}

const quickActions = [
  {
    label: 'Tambah Deadline',
    href: '/dashboard/deadlines/new',
    icon: Plus,
  },
  {
    label: 'AI Quick Add',
    href: '/dashboard/deadlines/quick-add',
    icon: Sparkles,
  },
  {
    label: 'Pengaturan',
    href: '/dashboard/settings',
    icon: Settings,
  },
  {
    label: 'Reminder Telegram',
    href: '/dashboard/settings/reminders',
    icon: BellRing,
  },
]

export default function DashboardSidePanel({ userTier }: { userTier: Plan }) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-20">
      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Shortcut</p>
        <div className="mt-4 grid gap-2">
          {quickActions.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="focus-ring flex min-h-11 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700 transition hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/70 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand-700">Plan aktif</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">{PLAN_LABELS[userTier]}</h2>
          </div>
          <Badge tone="brand">{userTier.toUpperCase()}</Badge>
        </div>

        <ul className="mt-4 space-y-2">
          {planFeatures[userTier].map((feature) => (
            <li key={feature} className="flex gap-2 text-xs leading-5 text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {userTier === 'radar' && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
            <div className="flex gap-2">
              <LockKeyhole className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>Upgrade ke Pulse atau Command kalau mau unlimited deadline dan reminder.</p>
            </div>
            <Link href="/pricing" className="mt-3 inline-flex font-black text-amber-950 underline">
              Lihat pricing
            </Link>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-slate-950 p-4 text-white shadow-sm">
        <p className="text-sm font-black">Ringkas paket</p>
        <div className="mt-3 space-y-3 text-xs leading-5 text-slate-300">
          <p><span className="font-black text-white">Radar:</span> gratis buat mulai nyatet deadline.</p>
          <p><span className="font-black text-white">Pulse:</span> buat deadline yang perlu reminder dasar.</p>
          <p><span className="font-black text-white">Command:</span> buat kontrol reminder dan akses beta lebih lengkap.</p>
        </div>
      </section>
    </aside>
  )
}
