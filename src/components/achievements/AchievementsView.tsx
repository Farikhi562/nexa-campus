'use client'

/**
 * Halaman Pencapaian — versi pakai badge animasi (ganti kartu emoji).
 *
 * - Menampilkan semua badge dari registry BADGES (lib/badges.ts) sebagai kartu animasi.
 * - Filter per kategori.
 * - Tap "Jadikan Badge Utama" → PATCH /api/achievements/featured (endpoint sudah ada).
 * - Status terkunci/terbuka dari daftar earnedIds.
 *
 * Sumber visual = AnimatedBadge/BadgeCard yang sama dengan Arena, jadi konsisten.
 */

import { useMemo, useState } from 'react'
import { Check, Loader2, Sparkles, Star } from 'lucide-react'
import { AnimatedBadge, type BadgeCardData } from '@/components/badges'
import {
  CATEGORY_LABEL,
  resolveIconCategory,
  resolveTier,
  TIER_THEME,
  type BadgeCategory,
} from '@/lib/badges/visuals'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface AchievementsViewProps {
  /** seluruh badge (map dari BADGES) */
  badges: BadgeCardData[]
  /** id badge yang sudah diraih user */
  earnedIds: string[]
  /** featured badge user saat ini (profiles.featured_badge) */
  featuredBadgeId?: string | null
}

// ─── Komponen kartu (varian dengan tombol set-featured) ──────────────────────

function AchievementCard({
  badge,
  unlocked,
  isFeatured,
  busy,
  onFeature,
}: {
  badge: BadgeCardData
  unlocked: boolean
  isFeatured: boolean
  busy: boolean
  onFeature: () => void
}) {
  const tier = resolveTier(badge.tier)
  const theme = TIER_THEME[tier]
  const cat = resolveIconCategory({ id: badge.id, category: badge.category })
  const locked = !unlocked

  return (
    <div
      className="relative rounded-3xl p-[18px] overflow-hidden transition-transform"
      style={{
        background: theme.cardBg,
        border: `1.5px solid ${isFeatured ? `rgb(${theme.glow})` : theme.cardBorder}`,
        boxShadow: isFeatured
          ? `0 0 0 3px rgba(${theme.glow},0.35), 0 8px 24px rgba(${theme.glow},0.25)`
          : theme.cosmic ? '0 8px 28px rgba(76,29,149,0.35)' : '0 4px 16px rgba(0,0,0,0.06)',
        opacity: locked ? 0.55 : 1,
        filter: locked ? 'grayscale(0.7)' : 'none',
      }}
    >
      {isFeatured && (
        <span
          className="absolute top-3 right-3 z-10 flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-extrabold"
          style={{ background: theme.chipBg, color: theme.chipText }}
        >
          <Star size={11} className="fill-current" /> UTAMA
        </span>
      )}

      <div className="flex items-start gap-4">
        <AnimatedBadge
          badgeId={badge.id}
          category={badge.category}
          tier={badge.tier}
          size="md"
          animate={!locked}
          glow={!locked}
          title={badge.name}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[17px] font-extrabold leading-tight" style={{ color: theme.cardText }}>{badge.name}</h3>
            <span
              className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-[3px] rounded-full"
              style={{ background: theme.chipBg, color: theme.chipText }}
            >
              {theme.label}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold leading-snug" style={{ color: theme.cardText, opacity: 0.92 }}>
            {badge.description}
          </p>
        </div>
      </div>

      <div
        className="mt-3.5 rounded-2xl px-3.5 py-3 text-[13px]"
        style={{ background: theme.cosmic ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)', color: theme.cardText }}
      >
        <span className="font-bold">Syarat: </span>
        <span className="opacity-90">{badge.requirement}</span>
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-2">
        <span className="text-[12px] font-extrabold tracking-wider" style={{ color: theme.cardText, opacity: 0.7 }}>
          {CATEGORY_LABEL[cat].toUpperCase()} • ANIMATED • {locked ? 'LOCKED' : 'UNLOCKED'}
        </span>
        {unlocked && !isFeatured && (
          <button
            onClick={onFeature}
            disabled={busy}
            className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold transition-opacity disabled:opacity-50"
            style={{ background: `rgba(${theme.glow},0.18)`, color: theme.cardText }}
          >
            {busy ? <Loader2 size={12} className="animate-spin" /> : <Star size={12} />} Jadikan utama
          </button>
        )}
        {isFeatured && (
          <span className="shrink-0 flex items-center gap-1 text-[12px] font-bold" style={{ color: theme.cardText }}>
            <Check size={13} /> Badge utama
          </span>
        )}
      </div>
    </div>
  )
}

// ─── View utama ───────────────────────────────────────────────────────────────

export function AchievementsView({ badges, earnedIds, featuredBadgeId }: AchievementsViewProps) {
  const earned = useMemo(() => new Set(earnedIds), [earnedIds])
  const [featured, setFeatured] = useState<string | null>(featuredBadgeId ?? null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [filter, setFilter] = useState<BadgeCategory | 'all'>('all')
  const [error, setError] = useState<string | null>(null)

  // kategori yang benar-benar ada di data
  const categories = useMemo(() => {
    const set = new Set<BadgeCategory>()
    for (const b of badges) set.add(resolveIconCategory({ id: b.id, category: b.category }))
    return Array.from(set)
  }, [badges])

  const visible = useMemo(() => {
    const list = filter === 'all'
      ? badges
      : badges.filter((b) => resolveIconCategory({ id: b.id, category: b.category }) === filter)
    // urutan: featured → unlocked → locked
    return [...list].sort((a, b) => {
      const fa = a.id === featured ? 0 : earned.has(a.id) ? 1 : 2
      const fb = b.id === featured ? 0 : earned.has(b.id) ? 1 : 2
      return fa - fb
    })
  }, [badges, filter, featured, earned])

  const earnedCount = badges.filter((b) => earned.has(b.id)).length

  async function handleFeature(id: string) {
    setBusyId(id)
    setError(null)
    const prev = featured
    setFeatured(id) // optimistic
    try {
      const res = await fetch('/api/achievements/featured', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featured_badge: id }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setFeatured(prev)
        setError(j.error ?? 'Gagal menyetel badge utama.')
      }
    } catch {
      setFeatured(prev)
      setError('Gagal terhubung ke server.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-5">
      {/* Header ringkas */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-teal-500" />
          <h2 className="text-lg font-extrabold text-zinc-900">Pencapaian</h2>
        </div>
        <span className="ml-auto text-sm font-semibold text-zinc-500">
          {earnedCount}/{badges.length} terbuka
        </span>
      </div>

      {/* Filter kategori */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>Semua</FilterChip>
        {categories.map((c) => (
          <FilterChip key={c} active={filter === c} onClick={() => setFilter(c)}>
            {CATEGORY_LABEL[c]}
          </FilterChip>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-sm text-rose-600">{error}</div>
      )}

      {/* Grid */}
      <div className="space-y-3.5">
        {visible.map((b) => (
          <AchievementCard
            key={b.id}
            badge={b}
            unlocked={earned.has(b.id)}
            isFeatured={b.id === featured}
            busy={busyId === b.id}
            onFeature={() => handleFeature(b.id)}
          />
        ))}
        {visible.length === 0 && (
          <p className="text-center text-sm text-zinc-500 py-8">Belum ada badge di kategori ini.</p>
        )}
      </div>
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-bold transition-colors border ${
        active ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
      }`}
    >
      {children}
    </button>
  )
}
