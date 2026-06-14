'use client'

import { useEffect, useMemo, useState } from 'react'
import BadgeStyles from './badgeStyles'
import NexaBadgeCard from './NexaBadgeCard'
import {
  BADGE_BY_KEY,
  BADGE_RARITY_COPY,
  BADGE_RARITY_LABEL,
  BADGE_RARITY_ORDER,
  NEXA_BADGES,
  getBadgeCounts,
  type BadgeRarity,
  type NexaBadge,
} from '@/lib/badges/catalog'

const FILTERS: Array<BadgeRarity | 'all'> = ['all', 'mythos', 'legend', 'epic', 'langka', 'biasa']

type BadgeApiResponse = {
  badges?: Array<{ badge_key: string; unlocked_at?: string | null; is_pinned?: boolean | null }>
  autoBadges?: string[]
  error?: string
}

export default function BadgeCollection() {
  const [filter, setFilter] = useState<BadgeRarity | 'all'>('all')
  const [earnedKeys, setEarnedKeys] = useState<string[]>([])
  const [pinnedKeys, setPinnedKeys] = useState<string[]>([])
  const [selectedBadge, setSelectedBadge] = useState<NexaBadge | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    let alive = true
    fetch('/api/badges/me', { cache: 'no-store' })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as BadgeApiResponse
        if (!res.ok) throw new Error(json.error || 'Gagal baca badge user.')
        return json
      })
      .then((json) => {
        if (!alive) return
        const manual = json.badges || []
        const auto = json.autoBadges || []
        setEarnedKeys(Array.from(new Set([...manual.map((item) => item.badge_key), ...auto].filter(Boolean))))
        setPinnedKeys(Array.from(new Set(manual.filter((item) => item.is_pinned).map((item) => item.badge_key))))
      })
      .catch((err) => setMessage(err?.message || 'Gagal baca badge user.'))
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const badges = useMemo(() => {
    const base = filter === 'all' ? NEXA_BADGES : NEXA_BADGES.filter((badge) => badge.rarity === filter)
    return [...base].sort((a, b) => a.sortOrder - b.sortOrder)
  }, [filter])

  const counts = useMemo(() => getBadgeCounts(), [])
  const earnedSet = useMemo(() => new Set(earnedKeys), [earnedKeys])
  const pinnedSet = useMemo(() => new Set(pinnedKeys), [pinnedKeys])


  async function syncBadges() {
    setSyncing(true)
    setMessage(null)
    try {
      const res = await fetch('/api/badges/sync', { method: 'POST' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Gagal sync badge.')

      const me = await fetch('/api/badges/me', { cache: 'no-store' })
      const meJson = (await me.json().catch(() => ({}))) as BadgeApiResponse
      if (!me.ok) throw new Error(meJson.error || 'Gagal reload badge.')

      const manual = meJson.badges || []
      const auto = meJson.autoBadges || []
      setEarnedKeys(Array.from(new Set([...manual.map((item) => item.badge_key), ...auto].filter(Boolean))))
      setPinnedKeys(Array.from(new Set(manual.filter((item) => item.is_pinned).map((item) => item.badge_key))))
      setMessage(`Badge disync. ${json.unlockedKeys?.length || 0} badge kebaca eligible. Sistem akhirnya sadar diri, ANJJJ.`)
    } catch (err: any) {
      setMessage(err?.message || 'Gagal sync badge.')
    } finally {
      setSyncing(false)
    }
  }

  async function togglePin(badge: NexaBadge) {
    if (!earnedSet.has(badge.key)) {
      setSelectedBadge(badge)
      return
    }

    const nextPinned = !pinnedSet.has(badge.key)
    setSavingKey(badge.key)
    setMessage(null)

    try {
      const res = await fetch('/api/badges/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge_key: badge.key, pinned: nextPinned }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Gagal update badge profile.')

      setPinnedKeys((prev) => {
        const set = new Set(prev)
        if (nextPinned) set.add(badge.key)
        else set.delete(badge.key)
        return Array.from(set)
      })
      setMessage(nextPinned ? `${badge.name} tampil di profile.` : `${badge.name} disembunyikan dari profile.`)
    } catch (err: any) {
      setMessage(err?.message || 'Gagal update badge profile.')
    } finally {
      setSavingKey(null)
    }
  }

  return (
    <div className="nexa-responsive-page mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6">
      <BadgeStyles />

      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 p-5 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-fuchsia-100">
              Badge System v4
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">Badge NEXA, sekarang nggak bocor ke semua orang gratisan</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Badge yang belum kebuka bakal blur + dikunci. Klik badge untuk lihat syarat. Kalau syarat sudah terpenuhi, klik Sync Badge biar sistem ngecek ulang dan unlock otomatis.
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

      <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-black text-slate-950 dark:text-white">Profile Showcase</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Badge yang dipilih akan tampil di profile dan bisa dilihat orang lain di user card/page yang memakai komponen public badge.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="text-sm font-black text-teal-700 dark:text-teal-300">
            {loading ? 'Loading badge...' : `${earnedKeys.length} kebuka · ${pinnedKeys.length}/6 tampil`}
          </div>
          <button
            type="button"
            onClick={syncBadges}
            disabled={syncing}
            className="rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-300 dark:text-slate-950"
          >
            {syncing ? 'Syncing...' : 'Sync Badge'}
          </button>
        </div>
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm font-bold text-teal-800 dark:border-teal-300/20 dark:bg-teal-950/30 dark:text-teal-200">
          {message}
        </div>
      ) : null}

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
        {badges.map((badge) => {
          const earned = earnedSet.has(badge.key)
          const pinned = pinnedSet.has(badge.key)
          return (
            <NexaBadgeCard
              key={badge.key}
              badge={badge}
              locked={!earned}
              earned={earned}
              pinned={pinned}
              onClick={() => togglePin(badge)}
            />
          )
        })}
      </div>

      {selectedBadge ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:justify-center" onClick={() => setSelectedBadge(null)}>
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white p-5 shadow-2xl dark:bg-slate-950" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-4xl dark:bg-white/10">🔒</div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Belum kebuka</div>
                <h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{selectedBadge.name}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{selectedBadge.description}</p>
              </div>
            </div>
            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">Syarat unlock</div>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-700 dark:text-slate-200">{selectedBadge.requirement}</p>
              {selectedBadge.rarity === 'mythos' ? (
                <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-fuchsia-600 dark:text-fuchsia-300">
                  Mythos cuma 1. Ini badge final boss, bukan hadiah login harian, ANJJJ.
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setSelectedBadge(null)}
              className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white dark:bg-white dark:text-slate-950"
            >
              Paham, gue grind dulu
            </button>
          </div>
        </div>
      ) : null}

      {savingKey ? <div className="fixed bottom-4 right-4 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white shadow-xl">Update {BADGE_BY_KEY[savingKey]?.name || 'badge'}...</div> : null}
    </div>
  )
}
