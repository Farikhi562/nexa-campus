'use client'

import UnifiedBadgeStrip from './UnifiedBadgeStrip'

/**
 * Compatibility component buat halaman lama yang masih manggil badge versi jadul.
 * Lempar userId kalau ada. Kalau tidak ada, dia tampilkan badge user login saat ini.
 */
export default function LegacyBadgeCompat({ userId, limit = 4, className = '' }: { userId?: string | null; limit?: number; className?: string }) {
  return <UnifiedBadgeStrip userId={userId} limit={limit} className={className} size="xs" variant="compact" empty="hide" />
}
