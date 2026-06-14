'use client'

import PublicUserBadges from '@/components/badges/PublicUserBadges'

type AnyObj = Record<string, any>

type Props = {
  userId?: string | null
  user_id?: string | null
  id?: string | null
  user?: AnyObj | null
  profile?: AnyObj | null
  friend?: AnyObj | null
  member?: AnyObj | null
  row?: AnyObj | null
  item?: AnyObj | null
  limit?: number
  className?: string
}

function pickId(props: Props) {
  return (
    props.userId ||
    props.user_id ||
    props.id ||
    props.user?.id ||
    props.user?.user_id ||
    props.profile?.id ||
    props.profile?.user_id ||
    props.friend?.id ||
    props.friend?.user_id ||
    props.member?.id ||
    props.member?.user_id ||
    props.row?.id ||
    props.row?.user_id ||
    props.item?.id ||
    props.item?.user_id ||
    null
  )
}

export default function UserBadgesCompat(props: Props) {
  const id = pickId(props)
  return <PublicUserBadges userId={id} limit={props.limit || 4} className={props.className || ''} size="xs" />
}

export function UserBadgePills(props: Props) {
  return <UserBadgesCompat {...props} />
}

export function UserBadgeStrip(props: Props) {
  return <UserBadgesCompat {...props} />
}

export function ProfileBadges(props: Props) {
  return <UserBadgesCompat {...props} limit={props.limit || 6} />
}

export function FriendBadges(props: Props) {
  return <UserBadgesCompat {...props} />
}

export function LeaderboardBadges(props: Props) {
  return <UserBadgesCompat {...props} />
}
