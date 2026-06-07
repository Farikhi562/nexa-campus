'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { DASHBOARD_NAV } from '@/components/dashboard/nav-items'
import NexaLogo from '@/components/NexaLogo'

function NavList({ isAdmin, onClose }: { isAdmin: boolean; onClose: () => void }) {
  const pathname = usePathname()

  const items = isAdmin
    ? DASHBOARD_NAV
    : DASHBOARD_NAV.filter((item) => item.href !== '/admin')

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <nav className="flex-1 overflow-y-auto">
      <div className="p-3 space-y-1">
        {items.map(({ label, href, icon: Icon, hot, soon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex min-h-[48px] items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors ${
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
              <span className="flex-1">{label}</span>
              {hot && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700">Baru</span>
              )}
              {soon && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500">Soon</span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function Drawer({ open, onClose, isAdmin }: { open: boolean; onClose: () => void; isAdmin: boolean }) {
  if (!open) return null
  return createPortal(
    <div
      className="fixed inset-0 z-[999] lg:hidden"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-[320px] flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
          <Link href="/dashboard" onClick={onClose} className="flex items-center gap-2.5">
            <NexaLogo className="h-9 w-9" />
            <div>
              <p className="text-sm font-black text-slate-950">NEXA Campus</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Semua Halaman</p>
            </div>
          </Link>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <Suspense fallback={
          <div className="flex-1 p-3">
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-12 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          </div>
        }>
          <NavList isAdmin={isAdmin} onClose={onClose} />
        </Suspense>
      </div>
    </div>,
    document.body
  )
}

export default function MobileNavMenu({ isAdmin = false }: { isAdmin?: boolean }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  function close() { setOpen(false) }
  function toggle() { setOpen(v => !v) }

  // Prevent body scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      {/* Hamburger button */}
      <button
        type="button"
        onClick={toggle}
        aria-label="Buka menu navigasi"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 lg:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mounted && <Drawer open={open} onClose={close} isAdmin={isAdmin} />}
    </>
  )
}
