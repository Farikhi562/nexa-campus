import Link from 'next/link'
import { BellRing, CalendarDays, CreditCard, HelpCircle, Home, Plus, Settings, ShieldCheck, Sparkles, UserRound } from 'lucide-react'

const navItems = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'Tambah Deadline', href: '/dashboard/deadlines/new', icon: Plus },
  { label: 'AI Quick Add', href: '/dashboard/deadlines/quick-add', icon: Sparkles },
  { label: 'Semua Deadline', href: '/dashboard/deadlines', icon: CalendarDays },
  { label: 'Reminder', href: '/dashboard/settings/reminders', icon: BellRing },
  { label: 'Profil', href: '/dashboard/settings/profile', icon: UserRound },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
  { label: 'Support', href: '/support', icon: HelpCircle },
  { label: 'Admin Beta', href: '/admin', icon: ShieldCheck },
]

export default function DashboardNavigation() {
  return (
    <nav className="rounded-3xl border border-white/80 bg-white/90 p-3 shadow-xl shadow-slate-200/70 ring-1 ring-slate-950/[0.03] backdrop-blur">
      <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.18em] text-brand-700">Navigasi</p>
      <div className="grid gap-1.5">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="focus-ring group flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-black text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950 hover:text-white"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-brand-700 transition group-hover:bg-cyan-300 group-hover:text-slate-950">
              <Icon className="h-4 w-4" />
            </span>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
