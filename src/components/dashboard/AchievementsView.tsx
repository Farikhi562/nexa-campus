'use client'

import { useEffect, useState } from 'react'
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  Gem,
  Loader2,
  Lock,
  Rocket,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { evaluateBadges, type AchievementStats, type BadgeProgress } from '@/lib/badges'

const ICONS: Record<string, typeof Trophy> = {
  Sparkles, CheckCircle2, Rocket, CalendarCheck, Clock, Flame, Trophy, Crown, UserPlus, Users, Gem,
}

const tierRing: Record<string, string> = {
  bronze: 'ring-amber-200',
  silver: 'ring-slate-300',
  gold: 'ring-amber-300',
  special: 'ring-teal-300',
}
const tierBg: Record<string, string> = {
  bronze: 'bg-amber-50 text-amber-600',
  silver: 'bg-slate-100 text-slate-600',
  gold: 'bg-amber-100 text-amber-600',
  special: 'bg-teal-50 text-teal-600',
}

function BadgeTile({ badge }: { badge: BadgeProgress }) {
  const Icon = ICONS[badge.def.icon] ?? Trophy
  const { earned } = badge

  return (
    <Card className={`relative overflow-hidden ${earned ? `ring-2 ${tierRing[badge.def.tier]}` : ''}`}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${
              earned ? tierBg[badge.def.tier] : 'bg-slate-100 text-slate-300'
            }`}
          >
            <Icon className="h-6 w-6" />
            {!earned && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-white ring-2 ring-white">
                <Lock className="h-3 w-3" />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-black ${earned ? 'text-slate-950' : 'text-slate-500'}`}>{badge.def.name}</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">{badge.def.desc}</p>
          </div>
        </div>

        {earned ? (
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Diraih
          </p>
        ) : (
          <div className="mt-3">
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 transition-all"
                style={{ width: `${Math.round(badge.progress * 100)}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] font-bold text-slate-400">
              {Math.min(badge.current, badge.def.goal)} / {badge.def.goal}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AchievementsView() {
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/achievements', { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json()
        if (!active) return
        if (!res.ok) setError(json.error || 'Gagal memuat pencapaian.')
        else setStats(json.stats)
      })
      .catch(() => active && setError('Gagal memuat pencapaian.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const badges = stats ? evaluateBadges(stats) : []
  const earnedCount = badges.filter((b) => b.earned).length
  const nextUp = badges
    .filter((b) => !b.earned)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 1)[0]

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(45,212,191,0.26),transparent_20rem)]" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-100">
            <Trophy className="h-3.5 w-3.5" />
            Pencapaian
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Koleksi lencana kamu.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            {stats ? `${earnedCount} dari ${badges.length} lencana terbuka.` : 'Memuat pencapaianmu…'}
            {nextUp && ` Paling dekat: ${nextUp.def.name} (${Math.min(nextUp.current, nextUp.def.goal)}/${nextUp.def.goal}).`}
          </p>
        </div>
      </section>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((badge) => (
            <BadgeTile key={badge.def.id} badge={badge} />
          ))}
        </div>
      )}

      <p className="px-1 text-center text-xs leading-5 text-slate-400">
        Lencana terbuka otomatis dari aktivitasmu: mencatat & menyelesaikan deadline, streak, poin, dan referral.
      </p>
    </div>
  )
}
