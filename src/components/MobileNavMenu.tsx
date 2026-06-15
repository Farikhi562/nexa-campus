'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { DASHBOARD_NAV } from '@/components/dashboard/nav-items'
import NexaLogo from '@/components/NexaLogo'

const MOBILE_PRIORITY_HREFS = new Set([
  '/dashboard/nexa-assistant',
  '/dashboard/arena',
  '/dashboard/friends',
  '/dashboard/study-room',
])

function NavList({
  isAdmin,
  isCommand,
  onClose,
}: {
  isAdmin: boolean
  isCommand: boolean
  onClose: () => void
}) {
  const pathname = usePathname()

  const items = useMemo(() => {
    return DASHBOARD_NAV.filter((item) => {
      if (item.href === '/admin' && !isAdmin) return false
      // Item khusus Command disembunyikan untuk non-Command.
      if (item.command && !isCommand) return false
      return true
    })
  }, [isAdmin, isCommand])

  const priorityItems = items.filter((item) => MOBILE_PRIORITY_HREFS.has(item.href))
  const mainItems = items.filter((item) => !MOBILE_PRIORITY_HREFS.has(item.href))

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  function renderItem({ label, href, icon: Icon, hot, soon, command }: (typeof DASHBOARD_NAV)[number]) {
    const active = isActive(href)

    return (
      <Link
        key={href}
        href={href}
        onClick={onClose}
        className={`flex min-h-[48px] items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors active:scale-[0.99] ${
          active ? 'bg-slate-950 text-white' : 'text-slate-800 hover:bg-slate-100'
        }`}
      >
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
            active ? 'bg-teal-400 text-slate-950' : 'bg-slate-100 text-teal-700'
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 truncate">{label}</span>
        {command && (
          <span className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-2 py-0.5 text-[10px] font-black text-amber-950">
            Command
          </span>
        )}
        {hot && !command && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">Baru</span>
        )}
        {soon && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">Soon</span>
        )}
      </Link>
    )
  }

  return (
    <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-6 pt-3">
      <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">Fitur utama</p>
      <div className="grid grid-cols-1 gap-1">{priorityItems.map(renderItem)}</div>

      <p className="px-2 pb-2 pt-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        Semua halaman
      </p>
      <div className="grid grid-cols-1 gap-1">{mainItems.map(renderItem)}</div>
    </nav>
  )
}

export default function MobileNavMenu({
  isAdmin = false,
  isCommand = false,
}: {
  isAdmin?: boolean
  isCommand?: boolean
}) {
  const [open, setOpen] = useState(false)

  function close() {
    setOpen(false)
  }
  function toggle() {
    setOpen((value) => !value)
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label="Buka menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40" onClick={close} />
          <div className="absolute inset-y-0 left-0 flex w-[84%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <NexaLogo className="h-8 w-8" />
                <span className="text-sm font-black text-slate-950">NEXA Campus</span>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Tutup menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <Suspense fallback={null}>
              <NavList isAdmin={isAdmin} isCommand={isCommand} onClose={close} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  )
}
