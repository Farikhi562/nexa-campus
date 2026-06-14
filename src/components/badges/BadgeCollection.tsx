'use client'

import { useMemo, useState } from 'react'
import {
  Award, BadgeCheck, Bell, Bot, CalendarCheck, Crown, Flag, Flame, Gem, GraduationCap,
  ListTodo, Medal, Mic, Network, Newspaper, QrCode, Radar, Send, ShieldCheck, Sparkle,
  Sparkles, Sword, Timer, Trophy, UserPlus, UserRoundPlus, Users, Video, Zap,
} from 'lucide-react'
import { BADGE_RARITY_CLASS, BADGE_RARITY_LABEL, NEXA_BADGES, type BadgeRarity } from '@/lib/badges/catalog'

const ICONS: Record<string, any> = {
  Award, BadgeCheck, Bell, Bot, CalendarCheck, Crown, Flag, Flame, Gem, GraduationCap,
  ListTodo, Medal, Mic, Network, Newspaper, QrCode, Radar, Send, ShieldCheck, Sparkle,
  Sparkles, Sword, Timer, Trophy, UserPlus, UserRoundPlus, Users, Video, Zap,
}

const FILTERS: Array<BadgeRarity | 'all'> = ['all', 'biasa', 'langka', 'epic', 'legend', 'mythos']

export default function BadgeCollection() {
  const [filter, setFilter] = useState<BadgeRarity | 'all'>('all')
  const badges = useMemo(() => {
    return filter === 'all' ? NEXA_BADGES : NEXA_BADGES.filter((badge) => badge.rarity === filter)
  }, [filter])

  const counts = useMemo(() => {
    return NEXA_BADGES.reduce((acc, badge) => {
      acc[badge.rarity] = (acc[badge.rarity] || 0) + 1
      return acc
    }, {} as Record<BadgeRarity, number>)
  }, [])

  return (
    <div className="nexa-responsive-page mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm dark:border-white/10 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/30 bg-teal-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-teal-200">
              <Award className="h-3.5 w-3.5" /> NEXA Badge System
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">30 Badge Baru</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Biasa, Langka, Epic, Legend, sampai Mythos. Karena manusia ternyata lebih rajin kalau dikasih lencana digital, luar biasa peradaban ini.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:min-w-[520px]">
            {(['biasa', 'langka', 'epic', 'legend', 'mythos'] as BadgeRarity[]).map((rarity) => (
              <div key={rarity} className="rounded-3xl border border-white/10 bg-white/5 p-3 text-center">
                <div className="text-2xl font-black">{counts[rarity] || 0}</div>
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{BADGE_RARITY_LABEL[rarity]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`shrink-0 rounded-2xl border px-4 py-2 text-sm font-black transition ${
              filter === item
                ? 'border-teal-500 bg-teal-500 text-slate-950'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-white/10'
            }`}
          >
            {item === 'all' ? 'Semua' : BADGE_RARITY_LABEL[item]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {badges.map((badge) => {
          const Icon = ICONS[badge.icon] || Award
          return (
            <article key={badge.key} className={`rounded-3xl border p-4 shadow-sm ${BADGE_RARITY_CLASS[badge.rarity]}`}>
              <div className="flex items-start gap-3">
                <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 shadow-sm dark:bg-white/10">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-black">{badge.name}</h3>
                    <span className="rounded-full bg-white/70 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] dark:bg-white/10">
                      {BADGE_RARITY_LABEL[badge.rarity]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-6 opacity-80">{badge.description}</p>
                  <p className="mt-3 text-[11px] font-black uppercase tracking-[0.16em] opacity-60">{badge.category.replace('_', ' ')}</p>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
