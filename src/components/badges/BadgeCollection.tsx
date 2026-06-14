'use client'

import { useMemo, useState } from 'react'
import BadgeStyles from './badgeStyles'
import NexaBadgeCard from './NexaBadgeCard'
import {
  BADGE_RARITY_COPY,
  BADGE_RARITY_LABEL,
  BADGE_RARITY_ORDER,
  NEXA_BADGES,
  getBadgeCounts,
  type BadgeRarity,
} from '@/lib/badges/catalog'

const FILTERS: Array<BadgeRarity | 'all'> = ['all', 'mythos', 'legend', 'epic', 'langka', 'biasa']

export default function BadgeCollection() {
  const [filter, setFilter] = useState<BadgeRarity | 'all'>('all')

  const badges = useMemo(() => {
    const base = filter === 'all' ? NEXA_BADGES : NEXA_BADGES.filter((badge) => badge.rarity === filter)
    return [...base].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [filter])

  const counts = useMemo(() => getBadgeCounts(), [])

  return (
    <div className="nexa-responsive-page mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <BadgeStyles />

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-5 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-100">
              Badge System v2
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Badge NEXA yang nggak keliatan kayak stiker warung</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Total 30 badge: 1 Mythos super animated, 5 Legend animated premium, 15 Epic animated subtle, 6 Langka static bagus, dan 3 Biasa emoji doang. Akhirnya hierarki sosial digital, karena manusia butuh kasta bahkan buat lencana.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:min-w-[560px]">
            {BADGE_RARITY_ORDER.map((rarity) => (
              <button
                key={rarity}
                type="button"
                onClick={() => setFilter(rarity)}
                className="rounded-3xl border border-white/10 bg-white/5 p-3 text-center transition hover:bg-white/10"
              >
                <div className="text-2xl font-black">{counts[rarity] || 0}</div>
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{BADGE_RARITY_LABEL[rarity]}</div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 lg:grid-cols-5">
        {BADGE_RARITY_ORDER.map((rarity) => (
          <div key={rarity} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
            <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{BADGE_RARITY_LABEL[rarity]}</div>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{BADGE_RARITY_COPY[rarity]}</p>
          </div>
        ))}
      </section>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-black transition ${
              filter === item
                ? 'border-slate-950 bg-slate-950 text-white dark:border-teal-400 dark:bg-teal-400 dark:text-slate-950'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-white/10'
            }`}
          >
            {item === 'all' ? 'Semua' : BADGE_RARITY_LABEL[item]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {badges.map((badge) => (
          <NexaBadgeCard key={badge.key} badge={badge} />
        ))}
      </div>
    </div>
  )
}
