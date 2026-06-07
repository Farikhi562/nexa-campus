'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Lock, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { BadgeChip, BadgeTierLabel } from '@/components/BadgeChip'
import { BADGES, evaluateBadges, type BadgeDef, type BadgeProgress } from '@/lib/badges'
import type { Plan } from '@/types'

type AchievementStats = {
  completed: number; created: number; ontime: number; streak: number
  points: number; referrals: number; isPremium: boolean; plan: Plan
}

type Props = { userPlan: Plan; userId: string }

export default function AchievementsView({ userPlan, userId }: Props) {
  const [progress, setProgress] = useState<BadgeProgress[]>([])
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [featuredBadge, setFeaturedBadge] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [statsRes, profileRes] = await Promise.all([
      fetch('/api/achievements', { cache: 'no-store' }),
      fetch('/api/profile/me', { cache: 'no-store' }).catch(() => null),
    ])
    if (statsRes.ok) {
      const json = await statsRes.json()
      const s = json.stats as AchievementStats
      setStats(s)
      setProgress(evaluateBadges({ ...s, plan: userPlan }))
    }
    if (profileRes?.ok) {
      const pJson = await profileRes.json()
      setFeaturedBadge(pJson.featured_badge ?? null)
    }
    setLoading(false)
  }, [userPlan])

  useEffect(() => { void load() }, [load])

  async function setFeatured(badgeId: string | null) {
    setSaving(true)
    const res = await fetch('/api/achievements/featured', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured_badge: badgeId }),
    })
    if (res.ok) setFeaturedBadge(badgeId)
    setSaving(false)
  }

  const earned = progress.filter(p => p.earned)
  const locked = progress.filter(p => !p.earned)
  const currentFeaturedBadge = earned.find(p => p.def.id === featuredBadge)

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.26),transparent_18rem)]" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-100">
            <Star className="h-3.5 w-3.5" /> Pencapaian
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Badge & Pencapaian.</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Selesaikan tantangan, kumpulkan badge. Pilih satu badge favorit untuk ditampilkan di profil dan leaderboard.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="text-2xl font-black tabular-nums text-teal-300">{earned.length}</span>
            <span className="text-sm text-slate-400">badge terkumpul dari {progress.length}</span>
          </div>
        </div>
      </section>

      {/* Featured badge selector */}
      {earned.length > 0 && (
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-black text-slate-950">Badge Utama</h2>
                <p className="text-sm text-slate-500">
                  Pilih badge yang ditampilkan di profil, leaderboard, dan chat.
                  {saving && ' Menyimpan...'}
                </p>
              </div>
              {featuredBadge && (
                <button
                  onClick={() => setFeatured(null)}
                  className="text-xs font-bold text-slate-400 hover:text-red-500"
                >
                  Hapus pilihan
                </button>
              )}
            </div>

            {/* Current featured */}
            {currentFeaturedBadge && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-3">
                <BadgeChip badge={BADGES.find(b => b.id === currentFeaturedBadge.def.id)!} size="md" selected />
                <div>
                  <p className="text-sm font-black text-slate-950">{currentFeaturedBadge.def.name}</p>
                  <p className="text-xs text-teal-700">✓ Sedang ditampilkan</p>
                </div>
              </div>
            )}

            {/* Badge grid to pick */}
            <div className="flex flex-wrap gap-3">
              {earned.map(p => {
                const badge = p.def
                if (!badge) return null
                return (
                  <div key={p.def.id} className="flex flex-col items-center gap-1">
                    <BadgeChip
                      badge={badge}
                      size="md"
                      selected={featuredBadge === p.def.id}
                      onClick={() => setFeatured(p.def.id === featuredBadge ? null : p.def.id)}
                    />
                    <span className="max-w-[64px] text-center text-[9px] font-bold leading-tight text-slate-500 line-clamp-2">
                      {badge.name.replace(/^[^ ]+ /, '')}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earned badges */}
      {earned.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Sudah Diraih ({earned.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {earned.map(p => {
              const badge = p.def
              if (!badge) return null
              return (
                <div
                  key={p.def.id}
                  className={`flex items-start gap-3 rounded-2xl border p-3.5 transition ${
                    featuredBadge === p.def.id
                      ? 'border-teal-300 bg-teal-50/60'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <BadgeChip
                    badge={badge}
                    size="md"
                    selected={featuredBadge === p.def.id}
                    onClick={() => setFeatured(p.def.id === featuredBadge ? null : p.def.id)}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-black text-slate-950">{badge.name}</p>
                      <BadgeTierLabel tier={badge.tier} />
                    </div>
                    <p className="mt-0.5 text-xs leading-4 text-slate-500">{badge.desc}</p>
                    {featuredBadge === p.def.id && (
                      <p className="mt-1 text-[10px] font-black text-teal-600">★ Ditampilkan</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Locked badges */}
      {locked.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500">
            <Lock className="h-4 w-4" /> Belum Terkunci ({locked.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locked.map(p => {
              const badge = p.def
              if (!badge) return null
              const pct = Math.round((p.current / p.def.goal) * 100)
              return (
                <div key={p.def.id} className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-3.5 opacity-70">
                  <div className="relative flex-shrink-0">
                    <BadgeChip badge={badge} size="md" />
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[1px]">
                      <Lock className="h-4 w-4 text-slate-500" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <p className="text-sm font-black text-slate-700">{badge.name}</p>
                      <BadgeTierLabel tier={badge.tier} />
                    </div>
                    <p className="mt-0.5 text-xs leading-4 text-slate-500">{badge.desc}</p>
                    {p.def.goal > 1 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
                          <span>{p.current}/{p.def.goal}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-teal-400 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
