'use client'

import UnifiedBadgeStrip from './UnifiedBadgeStrip'

type Props = {
  userId?: string | null
  limit?: number
  className?: string
  size?: 'xs' | 'sm' | 'md'
  empty?: 'hide' | 'placeholder'
}

export default function PublicUserBadges({ userId, limit = 1, className = '', size = 'xs', empty = 'hide' }: Props) {
  return <UnifiedBadgeStrip userId={userId} limit={limit} className={className} size={size} variant="compact" empty={empty} />
}
