'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DASHBOARD_NAV } from '@/components/dashboard/nav-items'
import { BRAND } from '@/lib/brand'

export default function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  // Persist collapse state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  function toggle() {
    setCollapsed((v) => {
      localStorage.setItem('sidebar_collapsed', String(!v))
      return !v
    })
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={`relative hidden flex-shrink-0 transition-all duration-300 lg:block ${
        collapsed ? 'w-16' : 'w-72'
      }`}
    >
      <div className="sticky top-24 space-y-3">
        <nav className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 shadow-xl shadow-slate-200/70 ring-1 ring-slate-950/[0.03]">
          {!collapsed && (
            <p className="px-4 pb-0 pt-3 text-xs font-black uppercase tracking-[0.18em] text-brand-700">
              Navigasi
            </p>
          )}
          <div className={`grid gap-0.5 ${collapsed ? 'p-2' : 'p-2'}`}>
            {DASHBOARD_NAV.map(({ label, href, icon: Icon, hot, soon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  title={collapsed ? label : undefined}
                  className={`group flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-black transition duration-150 ${
                    active
                      ? 'bg-slate-950 text-white'
                      : 'text-slate-700 hover:-translate-y-0.5 hover:bg-slate-950 hover:text-white'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl transition ${
                      active
                        ? 'bg-cyan-300 text-slate-950'
                        : 'bg-slate-100 text-brand-700 group-hover:bg-cyan-300 group-hover:text-slate-950'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{label}</span>
                      {hot && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
                          Baru
                        </span>
                      )}
                      {soon && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                          Soon
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {!collapsed && (
          <div className="rounded-3xl border border-slate-200 bg-white p-4 text-xs leading-5 text-slate-600 shadow-sm">
            {BRAND.disclaimer}
          </div>
        )}
      </div>

      {/* Collapse toggle button */}
      <button
        onClick={toggle}
        className="absolute -right-3.5 top-6 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white shadow-md text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
        aria-label={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  )
}
