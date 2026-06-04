import Link from 'next/link'
import { BellRing, CalendarDays, CreditCard, HelpCircle, Home, Plus, Settings, Sparkles, UserRound } from 'lucide-react'

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
]

export default function DashboardNavigation() {
  return (
    <nav className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.18em] text-brand-700">Navigasi</p>
      <div className="grid gap-1">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="focus-ring flex min-h-10 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-black text-slate-700 transition hover:bg-brand-50 hover:text-brand-800"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
