'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Home, Plus, Sparkles, Users2 } from 'lucide-react'

const NAV = [
  { label: 'Home', href: '/dashboard', icon: Home },
  { label: 'Tambah', href: '/dashboard/deadlines/new', icon: Plus },
  { label: 'Teman', href: '/dashboard/friends', icon: Users2 },
  { label: 'Study', href: '/dashboard/study-room', icon: BookOpen },
  { label: 'AI', href: '/dashboard/deadlines/quick-add', icon: Sparkles },
]

function NavItems() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {NAV.map(({ label, href, icon: Icon }) => {
        const active = isActive(href)
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
        <Suspense fallback={
          NAV.map(({ label, icon: Icon }) => (
            <div key={label} className="flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-black text-slate-400">
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </div>
          ))
        }>
          <NavItems />
        </Suspense>
      </div>
    </nav>
  )
}
