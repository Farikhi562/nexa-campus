import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import AuthStatusActions from '@/components/AuthStatusActions'
import DashboardNavigation from '@/components/dashboard/DashboardNavigation'
import NexaLogo from '@/components/NexaLogo'
import { BRAND } from '@/lib/brand'
import { PLAN_LABELS } from '@/lib/nexa-data'
import type { Profile } from '@/types'

export default function AppShell({
  profile,
  children,
}: {
  profile?: Pick<Profile, 'plan'> | null
  children: React.ReactNode
}) {
  const activePlan = profile?.plan ?? 'radar'

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 text-white shadow-xl shadow-slate-900/15 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl p-1 transition hover:bg-white/5">
            <NexaLogo className="h-11 w-11" />
            <div>
              <p className="text-base font-black leading-5 tracking-tight">NEXA Campus</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200">{PLAN_LABELS[activePlan]}</p>
            </div>
          </Link>
          <AuthStatusActions variant="dark" />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[290px_minmax(0,1fr)] lg:py-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <DashboardNavigation />
            <div className="rounded-3xl border border-white/80 bg-white/90 p-4 text-xs leading-5 text-slate-600 shadow-xl shadow-slate-200/70 ring-1 ring-slate-950/[0.03]">
              <div className="flex gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-700" />
                <p>{BRAND.disclaimer}</p>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <nav className="scrollbar-hide flex gap-2 overflow-x-auto rounded-3xl border border-white/80 bg-white/90 p-2 shadow-xl shadow-slate-200/70 backdrop-blur lg:hidden">
            <Link href="/dashboard" className="whitespace-nowrap rounded-2xl bg-slate-950 px-3 py-2 text-xs font-black text-white">Dashboard</Link>
            <Link href="/dashboard/deadlines/new" className="whitespace-nowrap rounded-2xl bg-brand-50 px-3 py-2 text-xs font-black text-brand-800 ring-1 ring-brand-100">Tambah</Link>
            <Link href="/dashboard/deadlines/quick-add" className="whitespace-nowrap rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">AI Quick Add</Link>
            <Link href="/dashboard/settings/reminders" className="whitespace-nowrap rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">Reminder</Link>
            <Link href="/dashboard/settings/profile" className="whitespace-nowrap rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">Profil</Link>
            <Link href="/dashboard/settings" className="whitespace-nowrap rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">Settings</Link>
          </nav>
          {children}
        </div>
      </div>
    </div>
  )
}
