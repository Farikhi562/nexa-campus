'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Plus, Sword, UserRound, Users } from 'lucide-react'
import { useT, type TranslationKey } from '@/components/LanguageProvider'

const NAV: Array<{ labelKey: TranslationKey; href: string; icon: typeof Home }> = [
  { labelKey: 'bottom_home', href: '/dashboard', icon: Home },
  { labelKey: 'bottom_arena', href: '/dashboard/arena', icon: Sword },
  { labelKey: 'bottom_friends', href: '/dashboard/friends', icon: UserRound },
  { labelKey: 'bottom_study', href: '/dashboard/study-room', icon: Users },
  { labelKey: 'bottom_add', href: '/dashboard/deadlines/new', icon: Plus },
]

function NavItems() {
  const pathname = usePathname()
  const { t } = useT()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {NAV.map(({ labelKey, href, icon: Icon }) => {
        const active = isActive(href)
        const label = t(labelKey)

        return (
          <Link
            key={href}
            href={href}
            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-black transition active:scale-[0.98] ${
              active ? 'bg-teal-50 text-teal-700' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Icon className={`h-5 w-5 ${active ? 'text-teal-600' : ''}`} />
            <span className="truncate">{label}</span>
          </Link>
        )
      })}
    </>
  )
}

export default function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/97 px-2 pb-[calc(env(safe-area-inset-bottom)+0.25rem)] pt-1.5 shadow-lg backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-0.5">
        <Suspense
          fallback={NAV.map(({ labelKey, icon: Icon }) => (
            <div key={labelKey} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-black text-slate-400">
              <Icon className="h-5 w-5" />
            </div>
          ))}
        >
          <NavItems />
        </Suspense>
      </div>
    </nav>
  )
}
