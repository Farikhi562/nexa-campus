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
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-200 p-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <NexaLogo className="h-10 w-10" />
              <div>
                <p className="font-black leading-5">NEXA Campus</p>
                <p className="text-xs font-bold text-brand-700">{PLAN_LABELS[activePlan]}</p>
              </div>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-brand-50 hover:text-brand-800">
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-slate-200 p-4">
            <div className="mb-3">
              <AuthStatusActions />
            </div>
            <div className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">{BRAND.disclaimer}</div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <NexaLogo className="h-9 w-9" />
              <span className="font-black">NEXA</span>
            </Link>
            <AuthStatusActions />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 lg:py-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white lg:hidden">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-2 py-2 text-[11px] font-bold text-slate-500">
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
