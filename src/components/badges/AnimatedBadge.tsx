'use client'

/**
 * <AnimatedBadge> — SATU komponen badge untuk seluruh app.
 *
 * Dipakai di: kartu Pencapaian, inline Arena, profil, leaderboard, daftar teman.
 * Karena semua tempat render lewat sini, badge TIDAK BISA tampil beda lagi.
 *
 * Tidak ada emoji. Ikon = SVG animasi (lihat icons.tsx), aura + shine = CSS module.
 *
 * Ukuran:
 *   xs  → 20px  (inline di samping nama, mis. arena/teman)
 *   sm  → 32px  (chip, list)
 *   md  → 56px  (kartu pencapaian)
 *   lg  → 88px  (modal detail / profil header)
 */

import styles from './AnimatedBadge.module.css'
import { ICON_BY_CATEGORY } from './icons'
import {
  resolveIconCategory,
  resolveTier,
  TIER_THEME,
  type BadgeTier,
} from '@/lib/badges/visuals'
import { getBadgeMeta } from '@/lib/badges/lookup'

export type AnimatedBadgeSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE_PX: Record<AnimatedBadgeSize, number> = { xs: 20, sm: 32, md: 56, lg: 88 }

export interface AnimatedBadgeProps {
  /** id badge (opsional, untuk override ikon spesifik). Cocokkan dengan lib/badges.ts */
  badgeId?: string | null
  /** kategori badge — penentu bentuk ikon */
  category?: string | null
  /** tier badge — penentu warna/aura */
  tier?: string | null
  size?: AnimatedBadgeSize
  /** matikan animasi (mis. di list panjang demi performa) */
  animate?: boolean
  /** tampilkan aura glow di belakang medali */
  glow?: boolean
  /** label aksesibilitas */
  title?: string
  className?: string
}

export function AnimatedBadge({
  badgeId,
  category,
  tier,
  size = 'md',
  animate = true,
  glow = true,
  title,
  className,
}: AnimatedBadgeProps) {
  // Auto-resolve dari registry kalau category/tier tidak dikirim (cukup badgeId).
  // Props eksplisit selalu menang; lookup hanya mengisi yang kosong.
  const meta = (category == null || tier == null) ? getBadgeMeta(badgeId) : null
  const effCategory = category ?? meta?.category ?? null
  const effTier = tier ?? meta?.tier ?? null
  const effTitle = title ?? meta?.name ?? undefined

  const iconCategory = resolveIconCategory({ id: badgeId, category: effCategory })
  const resolvedTier: BadgeTier = resolveTier(effTier)
  const theme = TIER_THEME[resolvedTier]
  const px = SIZE_PX[size]

  const Icon = ICON_BY_CATEGORY[iconCategory]
  const isSmall = size === 'xs' || size === 'sm'
  // di ukuran kecil, matikan shine/orbit biar nggak ramai
  const showShine = animate && !isSmall
  const showOrbit = animate && theme.cosmic && size !== 'xs'
  const showAura = glow && !(size === 'xs')

  const iconPad = Math.round(px * 0.18)

  return (
    <span
      className={className}
      role="img"
      aria-label={effTitle ?? `Badge ${theme.label}`}
      title={effTitle}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: px,
        height: px,
        flexShrink: 0,
      }}
    >
      {/* Aura glow */}
      {showAura && (
        <span
          className={animate ? styles.aura : undefined}
          style={{
            background: `radial-gradient(circle, rgba(${theme.glow},0.55) 0%, rgba(${theme.glow},0) 70%)`,
            ...(animate ? {} : { opacity: 0.6 }),
          }}
        />
      )}

      {/* Medali bulat */}
      <span
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          borderRadius: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: iconPad,
          background: theme.cosmic
            ? 'radial-gradient(circle at 35% 30%, #312e81 0%, #1e1b4b 60%, #0f0a2e 100%)'
            : 'linear-gradient(160deg, #ffffff 0%, #f1f5f9 100%)',
          border: `1.5px solid rgba(${theme.glow},0.55)`,
          boxShadow: `inset 0 1px 2px rgba(255,255,255,0.6), 0 2px 6px rgba(${theme.glow},0.3)`,
        }}
      >
        <Icon tint={`rgb(${theme.glow})`} animate={animate} />
      </span>

      {/* Partikel orbit (mythos) */}
      {showOrbit && (
        <span className={styles.orbit} style={{ zIndex: 2 }}>
          <span className={styles.orbitDot} />
        </span>
      )}

      {/* Shine sweep — signature unifier */}
      {showShine && <span className={styles.shine} />}
    </span>
  )
}
