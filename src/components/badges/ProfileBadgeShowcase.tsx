'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import BadgeStyles from './badgeStyles'
import NexaBadgeCard from './NexaBadgeCard'
import { NEXA_BADGES, getProfileShowcaseBadges, type NexaBadge } from '@/lib/badges/catalog'

type BadgeApiResponse = {
  badges?: Array<{ badge_key: string; unlocked_at?: string | null; is_pinned?: boolean | null }>
  autoBadges?: string[]
  profile?: Record<string, unknown> | null
  error?: string
}

type ProfileBadgeShowcaseProps = {
  userId?: string
  title?: string
  compact?: boolean
  limit?: number
  showLockedPreview?: boolean
}

export default function ProfileBadgeShowcase({
  userId,
  title = 'Badge Profile',
  compact = false,
  limit = 8,
  showLockedPreview = true,
}: ProfileBadgeShowcaseProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [earnedKeys, setEarnedKeys] = useState<string[]>([])

  useEffect(() => {
    let alive = true
    const endpoint = userId ? `/api/badges/${encodeURIComponent(userId)}` : '/api/badges/me'

    fetch(endpoint, { cache: 'no-store' })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as BadgeApiResponse
        if (!res.ok) throw new Error(json.error || 'Gagal baca badge profile.')
        return json
      })
      .then((json) => {
        if (!alive) return
        const manual = (json.badges || []).map((item) => item.badge_key).filter(Boolean)
        const auto = json.autoBadges || []
        setEarnedKeys(Array.from(new Set([...manual, ...auto])))
        setError(null)
      })
      .catch((err) => {
        if (!alive) return
        setError(err?.message || 'Gagal baca badge profile.')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [userId])

  const earnedBadges = useMemo(() => getProfileShowcaseBadges(earnedKeys, limit), [earnedKeys, limit])

  const previewBadges = useMemo<NexaBadge[]>(() => {
    if (!showLockedPreview || earnedBadges.length >= Math.min(4, limit)) return []
    const earned = new Set(earnedKeys)
    return NEXA_BADGES
      .filter((badge) => !earned.has(badge.key))
      .sort((a, b) => b.profilePriority - a.profilePriority || a.sortOrder - b.sortOrder)
      .slice(0, Math.max(0, Math.min(4, limit) - earnedBadges.length))
  }, [earnedBadges.length, earnedKeys, limit, showLockedPreview])

  return (
    <section className="w-full rounded-[1.7rem] border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950 sm:p-5">
      <BadgeStyles />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-teal-600 dark:text-teal-300">NEXA Identity</p>
          <h2 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Badge yang tampil di profile. Mythos cuma satu, jadi jangan spam rarity kayak game murahan.
          </p>
        </div>

        <Link
          href="/dashboard/badges"
          className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Lihat semua
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: compact ? 4 : 6 }).map((_, idx) => (
            <div key={idx} className="h-24 animate-pulse rounded-2xl bg-slate-100 dark:bg-white/10" />
          ))}
        </div>
      ) : error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700 dark:border-rose-400/20 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </div>
      ) : earnedBadges.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          Belum ada badge kebuka. Tenang, semua orang mulai dari kosong, kecuali yang lahir jadi admin database. Itu curang.
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {earnedBadges.map((badge) => (
            <NexaBadgeCard key={badge.key} badge={badge} compact={compact} showDescription={!compact} />
          ))}
          {previewBadges.map((badge) => (
            <NexaBadgeCard key={badge.key} badge={badge} compact={compact} showDescription={!compact} locked />
          ))}
        </div>
      )}
    </section>
  )
}

export function InlineProfileBadgePills({ badgeKeys, limit = 5 }: { badgeKeys: string[]; limit?: number }) {
  const badges = getProfileShowcaseBadges(badgeKeys, limit)
  if (!badges.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      <BadgeStyles />
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-black ${
            badge.rarity === 'mythos'
              ? 'border-fuchsia-300/50 bg-fuchsia-950 text-white'
              : badge.rarity === 'legend'
                ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-300/30 dark:bg-amber-950/30 dark:text-amber-100'
                : badge.rarity === 'epic'
                  ? 'border-violet-300 bg-violet-50 text-violet-800 dark:border-violet-300/30 dark:bg-violet-950/30 dark:text-violet-100'
                  : badge.rarity === 'langka'
                    ? 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-300/30 dark:bg-sky-950/30 dark:text-sky-100'
                    : 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'
          }`}
        >
          <span>{badge.emoji}</span>
          <span>{badge.name}</span>
        </span>
      ))}
    </div>
  )
}
