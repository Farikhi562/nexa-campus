'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Medal, Sparkles } from 'lucide-react'
import { BadgeChip, BadgeTierLabel } from '@/components/BadgeChip'
import { BADGES, evaluateBadges, type BadgeProgress } from '@/lib/badges'
import { Card, CardContent } from '@/components/ui/Card'
import type { Plan } from '@/types'

type Stats = { completed: number; created: number; ontime: number; streak: number; points: number; referrals: number; dailyCheckins?: number; isPremium: boolean; plan: Plan; manualBadgeIds?: string[]; isFounder?: boolean }

export default function BadgeShowcaseCard({ compact = false }: { compact?: boolean }) {
  const [progress, setProgress] = useState<BadgeProgress[]>([])
  const [featured, setFeatured] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all([
      fetch('/api/achievements', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/profile/me', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).catch(() => null),
    ]).then(([ach, profile]) => {
      if (!active) return
      const stats = (ach?.stats ?? null) as Stats | null
      if (stats) setProgress(evaluateBadges(stats))
      setFeatured(profile?.featured_badge ?? null)
    })
    return () => { active = false }
  }, [])

  const earned = useMemo(() => progress.filter((item) => item.earned), [progress])
  const featuredBadge = BADGES.find((badge) => badge.id === featured)
  const showcase = [featuredBadge, ...earned.map((item) => item.def)].filter(Boolean).filter((badge, index, arr) => arr.findIndex((item) => item?.id === badge?.id) === index).slice(0, 3)
  const next = progress.find((item) => !item.earned && (item.def.tier === 'epic' || item.def.tier === 'rarest')) ?? progress.find((item) => !item.earned)

  if (earned.length === 0 && !next) return null

  return (
    <Card className="border-fuchsia-100 bg-gradient-to-br from-white to-fuchsia-50/60">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-black text-fuchsia-700"><Sparkles className="h-3.5 w-3.5" /> Badge Showcase</div>
            <h2 className="font-black text-slate-950">Pamerin 3 badge terbaik</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Badge tampil di profil publik, leaderboard, room, dan chat. Ya, ini pancingan dopamine yang sopan.</p>
          </div>
          <Link href="/dashboard/achievements" className="text-xs font-black text-fuchsia-700 hover:underline">Atur</Link>
        </div>
        <div className="mt-4 flex items-center gap-3">
          {showcase.length > 0 ? showcase.map((badge) => badge && <BadgeChip key={badge.id} badge={badge} size={compact ? 'md' : 'lg'} />) : <Medal className="h-10 w-10 text-slate-200" />}
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-950">{earned.length} badge terkumpul</p>
            <p className="mt-1 text-xs text-slate-500">Pilih badge utama di halaman Pencapaian.</p>
          </div>
        </div>
        {next && (
          <div className="mt-4 rounded-2xl border border-white bg-white/80 p-3">
            <div className="flex items-center justify-between gap-2"><p className="text-xs font-black text-slate-700">Target berikutnya: {next.def.name}</p><BadgeTierLabel tier={next.def.tier} /></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-fuchsia-500" style={{ width: `${Math.round(next.progress * 100)}%` }} /></div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
