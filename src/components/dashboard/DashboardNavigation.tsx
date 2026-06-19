'use client'

import Link from 'next/link'
import { DASHBOARD_NAV } from '@/components/dashboard/nav-items'
import { useT } from '@/components/LanguageProvider'
import { BRAND } from '@/lib/brand'

export default function DashboardNavigation() {
  const { t } = useT()

  return (
    <nav className="rounded-3xl border border-white/80 bg-white/90 p-3 shadow-xl shadow-slate-200/70 ring-1 ring-slate-950/[0.03] backdrop-blur">
      <p className="px-2 pb-2 text-xs font-black uppercase tracking-[0.18em] text-brand-700">{t('section_navigation')}</p>
      <div className="grid gap-1.5">
        {DASHBOARD_NAV.map(({ href, icon: Icon, hot, soon, labelKey, versioned }) => {
          const label = versioned ? `${t(labelKey)} v${BRAND.version}` : t(labelKey)
          return (
            <Link
              key={href}
              href={href}
              className="focus-ring group flex min-h-11 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-black text-slate-700 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-950 hover:text-white"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-brand-700 transition group-hover:bg-cyan-300 group-hover:text-slate-950">
                <Icon className="h-4 w-4" />
              </span>
              {label}
              {hot && (
                <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
                  {t('badge_new')}
                </span>
              )}
              {soon && (
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-500">
                  {t('badge_soon')}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
