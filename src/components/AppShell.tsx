import Link from 'next/link'
import { BellRing, CreditCard, LayoutDashboard, ListChecks, Settings } from 'lucide-react'
import AuthStatusActions from '@/components/AuthStatusActions'
import NexaLogo from '@/components/NexaLogo'
import { BRAND } from '@/lib/brand'
import { PLAN_LABELS } from '@/lib/nexa-data'
import type { Profile } from '@/types'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/deadlines', label: 'Deadlines', icon: ListChecks },
  { href: '/dashboard/settings/reminders', label: 'Reminders', icon: Settings },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
]

export default function AppShell({
  profile,
  children,
}: {
  profile: Pick<Profile, 'plan'> | null
  children: React.ReactNode
}) {
  const activePlan = profile?.plan ?? 'radar'

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-white/10 bg-slate-950 text-white shadow-2xl shadow-slate-950/20 lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-white/10 p-5">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-white/5">
              <NexaLogo className="h-11 w-11" />
              <div>
                <p className="font-black leading-5 tracking-tight">NEXA Campus</p>
                <p className="text-xs font-bold text-cyan-200">{PLAN_LABELS[activePlan]}</p>
              </div>
            </Link>
          </div>
          <nav className="flex-1 space-y-2 p-4">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold text-slate-300 transition duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-cyan-100 ring-1 ring-white/10 transition group-hover:bg-cyan-300 group-hover:text-slate-950">
                  <Icon className="h-4 w-4" />
                </span>
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4">
            <div className="mb-4 rounded-3xl border border-cyan-200/15 bg-white/[0.06] p-4 shadow-xl shadow-black/10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                  <BellRing className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-black">Study flow aktif</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-300">Pantau deadline, reminder, dan upgrade dari satu tempat.</p>
                </div>
              </div>
            </div>
            <div className="mb-3">
              <AuthStatusActions variant="dark" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-slate-400">{BRAND.disclaimer}</div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 shadow-sm shadow-slate-200/60 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <NexaLogo className="h-9 w-9" />
              <span className="font-black tracking-tight">NEXA</span>
            </Link>
            <AuthStatusActions />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-5 pb-28 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-3xl border border-white/80 bg-white/90 p-2 shadow-2xl shadow-slate-900/15 backdrop-blur-xl lg:hidden">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-black text-slate-500 transition hover:bg-brand-50 hover:text-brand-700">
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
