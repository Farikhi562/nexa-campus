'use client'

import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, Crown, Flame, Loader2, Lock, Sparkles, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { BadgeChip, BadgeTierLabel } from '@/components/BadgeChip'
import { BADGES, badgeRaritySummary, evaluateBadges, type AchievementStats, type BadgeProgress } from '@/lib/badges'
import type { Plan } from '@/types'

type Props = { userPlan: Plan; userId: string }

export default function AchievementsView({ userPlan, userId }: Props) {
  const [progress, setProgress] = useState<BadgeProgress[]>([])
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
  const rarity = badgeRaritySummary()
  const earnedEpic = earned.filter(p => p.def.tier === 'epic').length
  const earnedRarest = earned.filter(p => p.def.tier === 'rarest').length
  const nextEpic = progress.find(p => !p.earned && p.def.tier === 'epic')
  const nextRarest = progress.find(p => !p.earned && p.def.tier === 'rarest')

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
            Kumpulkan badge, pasang yang paling kamu suka di profil, dan kejar badge langka yang progresnya jelas.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-2xl font-black tabular-nums text-teal-300">{earned.length}</p>
              <p className="text-xs font-bold text-slate-400">dari {progress.length} badge</p>
            </div>
            <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/10 p-3">
              <p className="text-2xl font-black tabular-nums text-fuchsia-100">{earnedEpic}/{rarity.epic}</p>
              <p className="text-xs font-bold text-fuchsia-100/75">Epic badge</p>
            </div>
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3">
              <p className="text-2xl font-black tabular-nums text-amber-100">{earnedRarest}/{rarity.rarest}</p>
              <p className="text-xs font-bold text-amber-100/75">badge langka</p>
            </div>
            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3">
              <p className="text-2xl font-black tabular-nums text-cyan-100">{rarity.animated}</p>
              <p className="text-xs font-bold text-cyan-100/75">badge bergerak</p>
            </div>
          </div>
        </div>
      </section>


      <section className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-3xl border border-fuchsia-200 bg-gradient-to-br from-white to-fuchsia-50 p-4 shadow-sm">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-700"><Sparkles className="h-5 w-5" /></div>
          <p className="text-sm font-black text-slate-950">{rarity.epic} Epic Badge</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Badge Epic dibuat untuk progres yang kelihatan: streak, referral, dan durasi plan.</p>
        </div>
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white to-amber-50 p-4 shadow-sm">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-700"><Crown className="h-5 w-5" /></div>
          <p className="text-sm font-black text-slate-950">{rarity.rarest} Badge Langka</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Rarity tertinggi untuk target berat: langganan tahunan, top leaderboard, dan NEXA Origin.</p>
        </div>
        <div className="rounded-3xl border border-orange-200 bg-gradient-to-br from-white to-orange-50 p-4 shadow-sm">
          <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-100 text-orange-700"><Flame className="h-5 w-5" /></div>
          <p className="text-sm font-black text-slate-950">{rarity.animated} Badge Bergerak</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">Animasi dipakai seperlunya untuk badge yang memang layak terasa spesial.</p>
        </div>
      </section>

      {(nextEpic || nextRarest) && (
        <Card className="border-amber-100 bg-gradient-to-br from-white via-amber-50/60 to-fuchsia-50/60">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-black text-slate-950">Target badge berikutnya</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">Tampilkan target dekat supaya progres pengguna lebih mudah diikuti.</p>
              </div>
              {nextRarest && <BadgeTierLabel tier="rarest" />}
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {[nextEpic, nextRarest].filter(Boolean).map((item) => {
                const p = item as BadgeProgress
                const pct = Math.round(p.progress * 100)
                return (
                  <div key={p.def.id} className="flex gap-3 rounded-2xl border border-white bg-white/80 p-3 shadow-sm">
                    <BadgeChip badge={p.def} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-black text-slate-950">{p.def.name}</p>
                        <BadgeTierLabel tier={p.def.tier} />
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{p.def.fomo || p.def.desc}</p>
                      <div className="mt-2">
                        <div className="mb-1 flex items-center justify-between text-[10px] font-black text-slate-500">
                          <span>{p.current}/{p.def.goal}</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-gradient-to-r from-teal-400 to-fuchsia-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

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
                  <p className="text-xs text-teal-700">Sedang ditampilkan</p>
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
                      <p className="mt-1 text-[10px] font-black text-teal-600">Ditampilkan</p>
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
