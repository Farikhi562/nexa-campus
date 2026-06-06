'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MoreVertical, X } from 'lucide-react'
import { DASHBOARD_NAV } from '@/components/dashboard/nav-items'
import NexaLogo from '@/components/NexaLogo'

export default function MobileNavMenu() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buka menu halaman"
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-ring flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200 lg:hidden"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-xs flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5"
              >
                <NexaLogo className="h-9 w-9" />
                <div>
                  <p className="text-sm font-black leading-5 text-slate-950">NEXA Campus</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-brand-700">
                    Semua Halaman
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              <div className="grid gap-1.5">
                {DASHBOARD_NAV.map(({ label, href, icon: Icon, hot, soon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="focus-ring group flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-black text-slate-700 transition active:scale-[0.99] active:bg-brand-50"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-brand-700">
                      <Icon className="h-4 w-4" />
                    </span>
                    {label}
                    {hot && (
                      <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
                        Baru
                      </span>
                    )}
                    {soon && (
                      <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                        Soon
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
