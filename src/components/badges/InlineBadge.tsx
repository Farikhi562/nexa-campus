'use client'

/**
 * Badge inline kecil — dipakai di samping nama user (Arena, Teman, Leaderboard, chat).
 * Menggantikan "medali gradient + emoji" lama yang bikin tampilan beda dari
 * halaman Pencapaian. Sumber visualnya sama: AnimatedBadge.
 *
 * Cukup kirim `badgeId` (= profiles.featured_badge). Kategori, tier, dan nama
 * diresolusikan otomatis dari registry BADGES — API tidak perlu diubah.
 * `category`/`tier`/`title` opsional, hanya untuk override manual.
 */

import { AnimatedBadge, type AnimatedBadgeSize } from './AnimatedBadge'

export interface InlineBadgeProps {
  /** id featured badge user (dari profiles.featured_badge) */
  badgeId?: string | null
  /** override opsional — biasanya tak perlu, auto dari registry */
  category?: string | null
  tier?: string | null
  size?: Extract<AnimatedBadgeSize, 'xs' | 'sm'>
  title?: string
}

export function InlineBadge({ badgeId, category, tier, size = 'xs', title }: InlineBadgeProps) {
  if (!badgeId) return null
  return (
    <AnimatedBadge
      badgeId={badgeId}
      category={category}
      tier={tier}
      size={size}
      animate
      glow={size !== 'xs'}
      title={title}
      className="align-middle"
    />
  )
}
