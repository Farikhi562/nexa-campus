'use client'

import UnifiedBadgeStrip from './UnifiedBadgeStrip'

type Props = {
  limit?: number
  className?: string
  size?: 'xs' | 'sm' | 'md'
  empty?: 'hide' | 'placeholder'
  label?: string
}

export default function CurrentUserBadges({ limit = 1, className = '', size = 'sm', empty = 'placeholder', label }: Props) {
  return <UnifiedBadgeStrip limit={limit} className={className} size={size} empty={empty} label={label} />
}
