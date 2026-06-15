'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Medal, Sparkles } from 'lucide-react'
import UnifiedBadgeStrip from '@/components/badges/UnifiedBadgeStrip'
import { NEXA_BADGES, getProfileShowcaseBadges } from '@/lib/badges/catalog'
import { Card, CardContent } from '@/components/ui/Card'

type BadgeRow = { badge_key: string; is_pinned?: boolean | null; unlocked_at?: string | null; source?: string | null }
type BadgeApiResponse = {
  badges?: BadgeRow[]
  pinnedBadges?: BadgeRow[]
  autoBadges?: string[]
  error?: string
}

function unique(keys: Array<string | null | undefined>) {
  return Array.from(new Set(keys.map((key) => String(key || '').trim()).filter(Boolean)))
}

export default function BadgeShowcaseCard({ compact = false }: { compact?: boolean }) {
  const [earnedKeys, setEarnedKeys] = useState<string[]>([])
  const [pinnedKeys, setPinnedKeys] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/badges/me', { cache: 'no-store' })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as BadgeApiResponse
        if (!res.ok) throw new Error(json.error || 'Gagal baca badge.')
        return json
      })
      .then((json) => {
        if (!active) return
        const rows = json.badges || []
        const auto = json.autoBadges || []
        const pinned = json.pinnedBadges || rows.filter((item) => item.is_pinned)
        setEarnedKeys(unique([...rows.map((item) => item.badge_key), ...auto]))
        setPinnedKeys(unique(pinned.map((item) => item.badge_key)).slice(0, 1))
      })
      .catch(() => {
        if (!active) return
        setEarnedKeys([])
        setPinnedKeys([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [])

  const earnedSet = useMemo(() => new Set(earnedKeys), [earnedKeys])
  const showcaseKeys = useMemo(() => {
    if (pinnedKeys.length > 0) return pinnedKeys.slice(0, 1)
    return getProfileShowcaseBadges(earnedKeys, 1).map((badge) => badge.key)
  }, [earnedKeys, pinnedKeys])
  const nextBadge = useMemo(() => NEXA_BADGES.find((badge) => !earnedSet.has(badge.key)), [earnedSet])

  return (
    <Card className="border-fuchsia-100 bg-gradient-to-br from-white to-fuchsia-50/60">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-black text-fuchsia-700">
              <Sparkles className="h-3.5 w-3.5" /> Badge utama
            </div>
            <h2 className="font-black text-slate-950">Sama dengan Pencapaian</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Dashboard menampilkan badge utama yang kamu pin di halaman Pencapaian.</p>
          </div>
          <Link href="/dashboard/achievements" className="text-xs font-black text-fuchsia-700 hover:underline">Atur</Link>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {loading ? (
            <div className="h-10 w-36 animate-pulse rounded-full bg-fuchsia-100" />
          ) : showcaseKeys.length > 0 ? (
            <UnifiedBadgeStrip badgeKeys={showcaseKeys} limit={1} size={compact ? 'sm' : 'md'} variant="pills" empty="placeholder" />
          ) : (
            <Medal className="h-10 w-10 text-slate-200" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-950">{loading ? 'Memuat badge...' : `${earnedKeys.length} badge kebuka`}</p>
            <p className="mt-1 text-xs text-slate-500">Pilih satu badge utama di Pencapaian.</p>
          </div>
        </div>

        {!loading && nextBadge && (
          <div className="mt-4 rounded-2xl border border-white bg-white/80 p-3">
            <p className="text-xs font-black text-slate-700">Target berikutnya: {nextBadge.name}</p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{nextBadge.requirement}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
