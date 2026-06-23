'use client'

/**
 * Kartu pencapaian — pengganti kartu emoji lama.
 * Konsisten dengan AnimatedBadge: ikon, warna, aura semua dari registry yang sama.
 *
 * Struktur mirror screenshot: [ikon] [judul + chip tier] [deskripsi] [Syarat] [meta].
 */

import { AnimatedBadge } from './AnimatedBadge'
import {
  CATEGORY_LABEL,
  resolveIconCategory,
  resolveTier,
  TIER_THEME,
  type BadgeCategory,
} from '@/lib/badges/visuals'

export interface BadgeCardData {
  id: string
  name: string
  /** "Mengelola 500 deadline. Ini kalender atau medan perang…" */
  description: string
  /** "Buat/kelola minimal 500 deadline di NEXA." */
  requirement: string
  category: string
  tier: string
  unlocked: boolean
}

export function BadgeCard({ badge }: { badge: BadgeCardData }) {
  const tier = resolveTier(badge.tier)
  const theme = TIER_THEME[tier]
  const cat: BadgeCategory = resolveIconCategory({ id: badge.id, category: badge.category })
  const locked = !badge.unlocked

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 22,
        padding: 18,
        background: theme.cardBg,
        border: `1.5px solid ${theme.cardBorder}`,
        boxShadow: theme.cosmic
          ? '0 8px 28px rgba(76,29,149,0.35)'
          : '0 4px 16px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        opacity: locked ? 0.55 : 1,
        filter: locked ? 'grayscale(0.7)' : 'none',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Ikon animasi */}
        <AnimatedBadge
          badgeId={badge.id}
          category={badge.category}
          tier={badge.tier}
          size="md"
          animate={!locked}
          glow={!locked}
          title={badge.name}
        />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Judul + chip tier */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: theme.cardText, lineHeight: 1.2 }}>
              {badge.name}
            </h3>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '3px 9px',
                borderRadius: 9999,
                background: theme.chipBg,
                color: theme.chipText,
              }}
            >
              {theme.label}
            </span>
          </div>

          {/* Deskripsi */}
          <p style={{ margin: '8px 0 0', fontSize: 14, fontWeight: 600, color: theme.cardText, lineHeight: 1.45, opacity: 0.92 }}>
            {badge.description}
          </p>
        </div>
      </div>

      {/* Syarat */}
      <div
        style={{
          marginTop: 14,
          borderRadius: 14,
          padding: '12px 14px',
          background: theme.cosmic ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.55)',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.cardText }}>Syarat: </span>
        <span style={{ fontSize: 13, color: theme.cardText, opacity: 0.88 }}>{badge.requirement}</span>
      </div>

      {/* Meta: KATEGORI • ANIMATED • UNLOCKED/LOCKED */}
      <div
        style={{
          marginTop: 14,
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: theme.cardText,
          opacity: 0.75,
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <span>{CATEGORY_LABEL[cat].toUpperCase()}</span>
        <span>•</span>
        <span>ANIMATED</span>
        <span>•</span>
        <span>{locked ? 'LOCKED' : 'UNLOCKED'}</span>
      </div>
    </div>
  )
}

/** Grid pembungkus untuk daftar kartu. */
export function BadgeGrid({ badges }: { badges: BadgeCardData[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {badges.map((b) => (
        <BadgeCard key={b.id} badge={b} />
      ))}
    </div>
  )
}
