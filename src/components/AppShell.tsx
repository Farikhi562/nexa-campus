import Link from 'next/link'
import { BellRing, Home, Plus, Sparkles, Trophy, UserRound } from 'lucide-react'
import AvatarMenu from '@/components/AvatarMenu'
import MobileNavMenu from '@/components/MobileNavMenu'
import DashboardNavigation from '@/components/dashboard/DashboardNavigation'
import NexaLogo from '@/components/NexaLogo'
import { BRAND } from '@/lib/brand'

type ShellProfile = {
  plan?: string | null
  full_name?: string | null
  avatar_url?: string | null
  email?: string | null
}

const mobileNavItems = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Tambah', href: '/dashboard/deadlines/new', icon: Plus },
  { label: 'Ranking', href: '/dashboard/leaderboard', icon: Trophy },
  { label: 'AI', href: '/dashboard/deadlines/quick-add', icon: Sparkles },
  { label: 'Profil', href: '/dashboard/settings/profile', icon: UserRound },
]

export default function AppShell({
  children,
  profile,
}: {
  children: React.ReactNode
  profile?: ShellProfile | null
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <MobileNavMenu />
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
              <NexaLogo className="h-9 w-9 flex-shrink-0 sm:h-10 sm:w-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-black leading-5 text-slate-950 sm:text-base">NEXA Campus</p>
                <p className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-brand-700 sm:text-[10px]">
                  Deadline Radar · v{BRAND.version}
                </p>
              </div>
            </Link>
          </div>
          <AvatarMenu
            avatarUrl={profile?.avatar_url ?? null}
            fullName={profile?.full_name ?? null}
            email={profile?.email ?? null}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-3 py-4 pb-28 sm:px-4 sm:py-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:pb-8">
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <DashboardNavigation />
            <div className="rounded-3xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600 shadow-sm">
              {BRAND.disclaimer}
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-4 sm:space-y-5">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-2xl shadow-slate-950/10 backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {mobileNavItems.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-black text-slate-600 transition active:scale-[0.98] active:bg-brand-50 active:text-brand-800"
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  )
}
