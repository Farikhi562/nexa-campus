import Link from 'next/link'
import AvatarMenu from '@/components/AvatarMenu'
import MobileNavMenu from '@/components/MobileNavMenu'
import MobileBottomNav from '@/components/MobileBottomNav'
import CollapsibleSidebar from '@/components/dashboard/CollapsibleSidebar'
import NotificationBell from '@/components/NotificationBell'
import NexaLogo from '@/components/NexaLogo'
import { BRAND } from '@/lib/brand'
import { isAdminEmail } from '@/lib/admin'

type ShellProfile = {
  plan?: string | null
  full_name?: string | null
  avatar_url?: string | null
  email?: string | null
  nexa_id?: string | null
}

export default function AppShell({
  children,
  profile,
}: {
  children: React.ReactNode
  profile?: ShellProfile | null
}) {
  const isAdmin = isAdminEmail(profile?.email)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex min-w-0 items-center gap-2">
            <MobileNavMenu isAdmin={isAdmin} />
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
          <div className="flex items-center gap-1.5">
            <NotificationBell />
            <AvatarMenu
              avatarUrl={profile?.avatar_url ?? null}
              fullName={profile?.full_name ?? null}
              email={profile?.email ?? null}
              nexaId={profile?.nexa_id ?? null}
            />
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-5 px-3 py-4 pb-28 sm:px-4 sm:py-5 lg:pb-8">
        <CollapsibleSidebar isAdmin={isAdmin} />
        <main className="min-w-0 flex-1 space-y-4 sm:space-y-5">
          {children}
        </main>
      </div>

      <MobileBottomNav />
    </div>
  )
}
