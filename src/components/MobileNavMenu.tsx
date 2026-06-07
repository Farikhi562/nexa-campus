'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { DASHBOARD_NAV } from '@/components/dashboard/nav-items'
import NexaLogo from '@/components/NexaLogo'

const MOBILE_PRIORITY_HREFS = new Set([
  '/dashboard/arena',
  '/dashboard/friends',
  '/dashboard/study-room',
])

function NavList({ isAdmin, onClose }: { isAdmin: boolean; onClose: () => void }) {
  const pathname = usePathname()

  const items = useMemo(() => {
    return DASHBOARD_NAV.filter((item) => isAdmin || item.href !== '/admin')
  }, [isAdmin])

  const priorityItems = items.filter((item) => MOBILE_PRIORITY_HREFS.has(item.href))
  const mainItems = items.filter((item) => !MOBILE_PRIORITY_HREFS.has(item.href))

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  function renderItem({ label, href, icon: Icon, hot, soon }: (typeof DASHBOARD_NAV)[number]) {
    const active = isActive(href)

    return (
      <Link
        key={href}
        href={href}
        onClick={onClose}
        className={`flex min-h-[48px] items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors active:scale-[0.99] ${
          active
            ? 'bg-slate-950 text-white'
            : 'text-slate-800 hover:bg-slate-100'
        }`}
      >
        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ${
          active ? 'bg-teal-400 text-slate-950' : 'bg-slate-100 text-teal-700'
        }`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 truncate">{label}</span>
        {hot && (
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
      <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-teal-700">
        Fitur utama
      </p>
      <div className="grid grid-cols-1 gap-1">
        {priorityItems.map(renderItem)}
      </div>

      <p className="px-2 pb-2 pt-4 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
        Semua halaman
      </p>
      <div className="grid grid-cols-1 gap-1">
        {mainItems.map(renderItem)}
      </div>
    </nav>
  )
}

export default function MobileNavMenu({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false)

  function close() { setOpen(false) }
  function toggle() { setOpen((value) => !value) }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }

    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-label="Buka semua menu navigasi"
        aria-expanded={open}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 transition hover:bg-slate-200 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] lg:hidden"
          aria-modal="true"
          role="dialog"
        >
          <button
            type="button"
            aria-label="Tutup menu navigasi"
            className="absolute inset-0 h-full w-full bg-black/50"
            onClick={close}
          />

          <div className="absolute inset-y-0 left-0 flex h-dvh min-h-0 w-[88%] max-w-[340px] flex-col bg-white shadow-2xl">
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
              <Link href="/dashboard" onClick={close} className="flex min-w-0 items-center gap-2.5">
                <NexaLogo className="h-9 w-9 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">NEXA Campus</p>
                  <p className="truncate text-[10px] font-bold uppercase tracking-wider text-teal-600">Semua halaman</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={close}
                aria-label="Tutup menu"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <Suspense fallback={
              <div className="min-h-0 flex-1 p-3">
                <div className="space-y-2">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="h-12 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              </div>
            }>
              <NavList isAdmin={isAdmin} onClose={close} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  )
}
