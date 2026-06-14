'use client'

import { useEffect, useMemo, useState } from 'react'
import BadgeStyles from './badgeStyles'
import { BADGE_BY_KEY, getProfileShowcaseBadges } from '@/lib/badges/catalog'

type BadgeRow = { badge_key: string; is_pinned?: boolean | null; unlocked_at?: string | null; source?: string | null }

type BadgeResponse = {
  badges?: BadgeRow[]
  pinnedBadges?: BadgeRow[]
  autoBadges?: string[]
  profile?: Record<string, unknown> | null
  error?: string
}

type UnifiedBadgeStripProps = {
  userId?: string | null
  badgeKeys?: string[]
  limit?: number
  size?: 'xs' | 'sm' | 'md'
  variant?: 'pills' | 'compact' | 'profile'
  className?: string
  empty?: 'hide' | 'placeholder'
  label?: string
}

function unique(list: Array<string | null | undefined>) {
  return Array.from(new Set(list.filter(Boolean).map(String)))
}

function endpointFor(userId?: string | null) {
  const clean = String(userId || '').trim()
  return clean ? `/api/badges/${encodeURIComponent(clean)}` : '/api/badges/me'
}

function normalizeBadgeKeys(json: BadgeResponse) {
  const allRows = json.badges || []
  const pinnedRows = json.pinnedBadges || allRows.filter((item) => item.is_pinned)
  const auto = json.autoBadges || []
  const pinned = unique([...pinnedRows.map((item) => item.badge_key), ...auto.filter((key) => key === 'mythos_architect' || key === 'referral_mythos_100')])
  const fallback = unique([...allRows.map((item) => item.badge_key), ...auto])
  return (pinned.length ? pinned : fallback).slice(0, 1)
}

export default function UnifiedBadgeStrip({
  userId,
  badgeKeys,
  limit = 1,
  size = 'sm',
  variant = 'pills',
  className = '',
  empty = 'hide',
  label,
}: UnifiedBadgeStripProps) {
  const [keys, setKeys] = useState<string[]>(badgeKeys || [])
  const [loading, setLoading] = useState(!badgeKeys)

  useEffect(() => {
    if (badgeKeys) {
      setKeys(badgeKeys)
      setLoading(false)
      return
    }

    let alive = true
    setLoading(true)
    fetch(endpointFor(userId), { cache: 'no-store' })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as BadgeResponse
        if (!res.ok) throw new Error(json.error || 'Gagal baca badge.')
        return json
      })
      .then((json) => {
        if (!alive) return
        setKeys(normalizeBadgeKeys(json))
      })
      .catch(() => {
        if (alive) setKeys([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [badgeKeys, userId])

  const badges = useMemo(() => getProfileShowcaseBadges(keys, limit), [keys, limit])

  if (loading) {
    if (empty === 'hide') return null
    return <div className={`${className} h-6 w-36 animate-pulse rounded-full bg-slate-100 dark:bg-white/10`} />
  }

  if (!badges.length) {
    if (empty === 'hide') return null
    return (
      <div className={`${className} inline-flex items-center rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs font-black text-slate-400 dark:border-white/10 dark:text-slate-500`}>
        Belum pamer badge
      </div>
    )
  }

  const sizeClass = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : size === 'md' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
  const iconClass = size === 'xs' ? 'text-sm' : size === 'md' ? 'text-lg' : 'text-base'

  return (
    <div className={`${className} nexa-unified-badge-strip`} data-badge-variant={variant}>
      <BadgeStyles />
      {label ? <div className="mb-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">{label}</div> : null}
      <div className="flex max-w-full flex-wrap items-center gap-1.5">
        {badges.map((badge) => {
          const rarity = badge.rarity
          const rarityClass =
            rarity === 'mythos'
              ? 'border-fuchsia-300/60 bg-slate-950 text-white shadow-[0_0_18px_rgba(217,70,239,.28)]'
              : rarity === 'legend'
                ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-300/40 dark:bg-amber-950/40 dark:text-amber-100'
                : rarity === 'epic'
                  ? 'border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-300/40 dark:bg-violet-950/40 dark:text-violet-100'
                  : rarity === 'langka'
                    ? 'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-300/40 dark:bg-sky-950/40 dark:text-sky-100'
                    : 'border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'

          return (
            <span
              key={badge.key}
              title={`${badge.name} · ${rarity}`}
              className={`${sizeClass} ${rarityClass} inline-flex max-w-full items-center gap-1.5 rounded-full border font-black leading-none`}
              data-nexa-badge-key={badge.key}
              data-nexa-badge-rarity={rarity}
            >
              <span className={`${iconClass} leading-none`}>{badge.emoji}</span>
              <span className="max-w-[9rem] truncate">{variant === 'compact' ? badge.name.split(' ')[0] : badge.name}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

export function CurrentUserBadgeStrip(props: Omit<UnifiedBadgeStripProps, 'userId' | 'badgeKeys'>) {
  return <UnifiedBadgeStrip {...props} />
}

export function badgeKeysToBadges(keys: string[]) {
  return keys.map((key) => BADGE_BY_KEY[key]).filter(Boolean)
}
