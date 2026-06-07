'use client'

import { useEffect, useState } from 'react'
import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  Gem,
  Home,
  Lock,
  Rocket,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { SkeletonAchievementCard } from '@/components/ui/SkeletonCard'
import { evaluateBadges, BADGES, PROFILE_BADGE_IDS, type AchievementStats, type BadgeProgress } from '@/lib/badges'

const ICONS: Record<string, typeof Trophy> = {
  Sparkles, CheckCircle2, Rocket, CalendarCheck, CalendarDays, Clock, Flame, Trophy,
  Crown, UserPlus, Users, Gem, Zap, Target, Star, Timer, TrendingUp, BookOpen, Home,
}

const tierRing: Record<string, string> = {
  bronze: 'ring-amber-200',
  silver: 'ring-slate-300',
  gold: 'ring-amber-300',
  special: 'ring-teal-300',
  legendary: 'ring-purple-300',
}
const tierBg: Record<string, string> = {
  bronze: 'bg-amber-50 text-amber-600',
  silver: 'bg-slate-100 text-slate-600',
  gold: 'bg-amber-100 text-amber-600',
  special: 'bg-teal-50 text-teal-600',
  legendary: 'bg-purple-50 text-purple-600',
}
const tierLabel: Record<string, string> = {
  bronze: 'Perunggu',
  silver: 'Perak',
  gold: 'Emas',
  special: 'Spesial',
  legendary: 'Legendary',
}

function BadgeTile({ badge, featured, onSelect, selected }: {
  badge: BadgeProgress
  featured?: boolean
  onSelect?: () => void
  selected?: boolean
}) {
  const Icon = ICONS[badge.def.icon] ?? Trophy
  const { earned } = badge

  return (
    <Card
      className={`relative overflow-hidden transition-all ${earned ? `ring-2 ${tierRing[badge.def.tier]}` : ''} ${selected ? 'outline outline-2 outline-teal-500' : ''} ${onSelect && earned ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={onSelect && earned ? onSelect : undefined}
    >
      {badge.def.tier === 'legendary' && earned && (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/40 to-transparent pointer-events-none" />
      )}
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
            {earned && selected && (
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal-500 text-white ring-2 ring-white">
                <CheckCircle2 className="h-3 w-3" />
              </span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-black ${earned ? 'text-slate-950' : 'text-slate-500'}`}>{badge.def.name}</p>
              <span className={`hidden rounded-full px-1.5 py-0.5 text-[9px] font-black sm:inline-block ${earned ? tierBg[badge.def.tier] : 'bg-slate-100 text-slate-400'}`}>
                {tierLabel[badge.def.tier]}
              </span>
            </div>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">{badge.def.desc}</p>
            {badge.def.reward && earned && (
              <p className="mt-1 text-[10px] font-black text-emerald-600">{badge.def.reward}</p>
            )}
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

function StreakBanner({ streak, maxStreak }: { streak: number; maxStreak: number }) {
  const alive = streak > 0
  return (
    <Card className={`border-2 ${alive ? 'border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50' : 'border-slate-200 bg-slate-50'}`}>
      <CardContent className="flex items-center justify-between p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className={`flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${alive ? 'bg-orange-100' : 'bg-slate-100 grayscale'}`}>
            🔥
          </span>
          <div>
            <p className={`text-2xl font-black ${alive ? 'text-orange-600' : 'text-slate-400'}`}>
              {streak} hari
            </p>
            <p className={`text-xs font-bold ${alive ? 'text-orange-500' : 'text-slate-400'}`}>
              {alive ? 'Streak aktif — jangan putus!' : 'Streak mati. Mulai lagi hari ini!'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-500">Rekor terbaik</p>
          <p className="text-xl font-black text-slate-700">{maxStreak} hari</p>
          {streak >= 7 && <p className="text-[10px] font-black text-amber-600 mt-1">🏆 {streak >= 30 ? 'Luar biasa!' : streak >= 14 ? 'Keren banget!' : 'Terus jalan!'}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

const TIER_ORDER = ['legendary', 'gold', 'special', 'silver', 'bronze']

export default function AchievementsView() {
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'earned' | 'locked'>('all')
  const [selectedBadges, setSelectedBadges] = useState<string[]>([])
  const [savingBadges, setSavingBadges] = useState(false)
  const [badgeSaved, setBadgeSaved] = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/achievements', { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json()
        if (!active) return
        if (!res.ok) setError(json.error || 'Gagal memuat pencapaian.')
        else {
          setStats(json.stats)
          if (json.displayBadges) setSelectedBadges(json.displayBadges)
        }
      })
      .catch(() => active && setError('Gagal memuat pencapaian.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const badges = stats ? evaluateBadges(stats) : []
  const earnedCount = badges.filter((b) => b.earned).length
  const nextUp = badges
    .filter((b) => !b.earned)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 1)[0]

  const filtered = badges.filter((b) => {
    if (activeFilter === 'earned') return b.earned
    if (activeFilter === 'locked') return !b.earned
    return true
  }).sort((a, b) => {
    if (a.earned !== b.earned) return a.earned ? -1 : 1
    const tierA = TIER_ORDER.indexOf(a.def.tier)
    const tierB = TIER_ORDER.indexOf(b.def.tier)
    return tierA - tierB
  })

  // pickable = earned badges that are in profile badge list
  const pickableBadges = badges.filter((b) => b.earned && PROFILE_BADGE_IDS.includes(b.def.id))

  function toggleBadge(id: string) {
    setSelectedBadges((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 3) return [...prev.slice(1), id] // max 3, push out oldest
      return [...prev, id]
    })
    setBadgeSaved(false)
  }

  async function saveBadgeDisplay() {
    setSavingBadges(true)
    setBadgeSaved(false)
    try {
      await fetch('/api/profile/badges', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badges: selectedBadges }),
      })
      setBadgeSaved(true)
    } catch { /* silent */ }
    setSavingBadges(false)
  }

  return (
    <div className="space-y-5">
      {/* Hero */}
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

      {/* Streak Banner */}
      {stats && <StreakBanner streak={stats.streak} maxStreak={stats.maxStreak ?? stats.streak} />}

      {/* Badge Display Picker */}
      {pickableBadges.length > 0 && (
        <Card className="border-teal-100 bg-teal-50/50">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-black text-slate-950">Badge Profil</p>
                <p className="text-xs text-slate-500">Pilih max 3 badge untuk ditampilkan di profilmu</p>
              </div>
              <button
                onClick={() => setShowPicker((v) => !v)}
                className="rounded-xl border border-teal-200 bg-white px-3 py-1.5 text-xs font-black text-teal-700 hover:bg-teal-50"
              >
                {showPicker ? 'Tutup' : 'Atur Badge'}
              </button>
            </div>
            {showPicker && (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 mb-3">
                  {pickableBadges.map((b) => {
                    const Icon = ICONS[b.def.icon] ?? Trophy
                    const isSelected = selectedBadges.includes(b.def.id)
                    return (
                      <button
                        key={b.def.id}
                        onClick={() => toggleBadge(b.def.id)}
                        className={`flex items-center gap-2 rounded-xl border p-2.5 text-left transition ${isSelected ? 'border-teal-400 bg-teal-50 ring-1 ring-teal-400' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      >
                        <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${tierBg[b.def.tier]}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-[11px] font-black text-slate-800">{b.def.name}</span>
                          {isSelected && <span className="text-[10px] font-bold text-teal-600">✓ Dipilih</span>}
                        </span>
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={saveBadgeDisplay}
                  disabled={savingBadges}
                  className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {savingBadges ? 'Menyimpan...' : badgeSaved ? '✓ Tersimpan' : 'Simpan Pilihan'}
                </button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'earned', 'locked'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`rounded-xl px-3 py-1.5 text-xs font-black transition ${activeFilter === f ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            {f === 'all' ? `Semua (${badges.length})` : f === 'earned' ? `Diraih (${earnedCount})` : `Terkunci (${badges.length - earnedCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => <SkeletonAchievementCard key={i} />)}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((badge) => (
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
