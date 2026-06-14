'use client'

import { useEffect, useMemo, useState } from 'react'
import { InlineProfileBadgePills } from './ProfileBadgeShowcase'

type BadgeRow = { badge_key: string; is_pinned?: boolean | null }

type Props = {
  userId?: string | null
  limit?: number
  className?: string
}

export default function PublicUserBadges({ userId, limit = 4, className = '' }: Props) {
  const [keys, setKeys] = useState<string[]>([])

  useEffect(() => {
    if (!userId) return
    let alive = true
    fetch(`/api/badges/${encodeURIComponent(userId)}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((json: { pinnedBadges?: BadgeRow[]; autoBadges?: string[] }) => {
        if (!alive) return
        const pinned = (json.pinnedBadges || []).map((item) => item.badge_key).filter(Boolean)
        const auto = (json.autoBadges || []).filter((key) => key === 'mythos_architect')
        setKeys(Array.from(new Set([...auto, ...pinned])))
      })
      .catch(() => setKeys([]))

    return () => {
      alive = false
    }
  }, [userId])

  const visibleKeys = useMemo(() => keys.slice(0, limit), [keys, limit])
  if (!visibleKeys.length) return null

  return (
    <div className={className}>
      <InlineProfileBadgePills badgeKeys={visibleKeys} limit={limit} />
    </div>
  )
}
