import { BADGES, type BadgeDef, type BadgeTier } from '@/lib/badges'

// Tier visual config — Command paling bagus
const TIER_CONFIG: Record<BadgeTier, {
  bg: string; ring: string; text: string; label: string; glow: string
}> = {
  bronze: {
    bg: 'bg-gradient-to-br from-orange-100 to-amber-100',
    ring: 'ring-1 ring-orange-300',
    text: 'text-orange-700',
    label: 'bg-orange-100 text-orange-600',
    glow: '',
  },
  silver: {
    bg: 'bg-gradient-to-br from-blue-50 to-slate-100',
    ring: 'ring-1 ring-blue-300',
    text: 'text-blue-700',
    label: 'bg-blue-50 text-blue-600',
    glow: '',
  },
  gold: {
    bg: 'bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-400',
    ring: 'ring-2 ring-amber-400',
    text: 'text-amber-900',
    label: 'bg-amber-100 text-amber-800',
    glow: 'shadow-lg shadow-amber-200',
  },
  special: {
    bg: 'bg-gradient-to-br from-violet-500 via-purple-400 to-fuchsia-500',
    ring: 'ring-2 ring-violet-400',
    text: 'text-white',
    label: 'bg-violet-100 text-violet-700',
    glow: 'shadow-lg shadow-violet-200',
  },
}

// Badge ID overrides for special visual treatment
const BADGE_OVERRIDES: Record<string, { bg: string; ring: string; text: string; glow: string; emoji: string }> = {
  badge_command: {
    bg: 'bg-gradient-to-br from-yellow-400 via-amber-300 to-yellow-500',
    ring: 'ring-2 ring-yellow-400',
    text: 'text-yellow-900',
    glow: 'shadow-xl shadow-yellow-300/60',
    emoji: '👑',
  },
  badge_pulse: {
    bg: 'bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-400',
    ring: 'ring-2 ring-cyan-400',
    text: 'text-white',
    glow: 'shadow-lg shadow-cyan-200',
    emoji: '⚡',
  },
  badge_radar: {
    bg: 'bg-gradient-to-br from-teal-400 to-teal-600',
    ring: 'ring-1 ring-teal-400',
    text: 'text-white',
    glow: '',
    emoji: '🎯',
  },
  elite: {
    bg: 'bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-500',
    ring: 'ring-2 ring-amber-400',
    text: 'text-amber-900',
    glow: 'shadow-lg shadow-amber-200/60',
    emoji: '👑',
  },
  streak_30: {
    bg: 'bg-gradient-to-br from-orange-400 to-red-500',
    ring: 'ring-2 ring-orange-400',
    text: 'text-white',
    glow: 'shadow-lg shadow-orange-200',
    emoji: '🔥',
  },
  premium: {
    bg: 'bg-gradient-to-br from-violet-500 via-purple-400 to-fuchsia-500',
    ring: 'ring-2 ring-violet-400',
    text: 'text-white',
    glow: 'shadow-lg shadow-violet-200',
    emoji: '💎',
  },
}

// Badge display size
type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE = {
  xs: { wrap: 'h-6 w-6 rounded-lg text-sm', name: 'text-[10px]', showName: false },
  sm: { wrap: 'h-8 w-8 rounded-xl text-base', name: 'text-[10px]', showName: false },
  md: { wrap: 'h-12 w-12 rounded-2xl text-2xl', name: 'text-xs', showName: true },
  lg: { wrap: 'h-16 w-16 rounded-2xl text-3xl', name: 'text-sm', showName: true },
}

function badgeEmoji(badge: BadgeDef): string {
  if (BADGE_OVERRIDES[badge.id]?.emoji) return BADGE_OVERRIDES[badge.id].emoji
  const iconEmojis: Record<string, string> = {
    Sparkles: '✨', CheckCircle2: '✅', Rocket: '🚀', CalendarCheck: '📅',
    Clock: '⏰', Flame: '🔥', Trophy: '🏆', Crown: '👑',
    UserPlus: '👋', Users: '👥', Gem: '💎', Radar: '🎯', Zap: '⚡',
  }
  return iconEmojis[badge.icon] ?? '🏅'
}

export function BadgeChip({
  badge,
  size = 'md',
  selected = false,
  onClick,
}: {
  badge: BadgeDef
  size?: BadgeSize
  selected?: boolean
  onClick?: () => void
}) {
  const override = BADGE_OVERRIDES[badge.id]
  const tier = TIER_CONFIG[badge.tier]
  const s = SIZE[size]

  const bg = override?.bg ?? tier.bg
  const ring = override?.ring ?? tier.ring
  const text = override?.text ?? tier.text
  const glow = override?.glow ?? tier.glow
  const emoji = badgeEmoji(badge)

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={badge.name}
      className={`relative flex flex-shrink-0 items-center justify-center transition ${s.wrap} ${bg} ${ring} ${glow} ${
        selected ? 'scale-110 ring-4 ring-offset-1 ring-teal-400' : ''
      } ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}`}
    >
      <span className={text}>{emoji}</span>
      {/* Shimmer effect for special/gold */}
      {(badge.tier === 'gold' || badge.tier === 'special' || badge.id === 'badge_command') && (
        <span className="pointer-events-none absolute inset-0 rounded-inherit bg-[radial-gradient(circle_at_60%_35%,rgba(255,255,255,0.45),transparent_60%)]" />
      )}
    </button>
  )
}

export function BadgeTierLabel({ tier }: { tier: BadgeTier }) {
  const config = TIER_CONFIG[tier]
  const labels = { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', special: 'Special' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${config.label}`}>
      {labels[tier]}
    </span>
  )
}

// Show featured badge as a tiny chip next to username
export function FeaturedBadgePin({ badgeId }: { badgeId: string | null | undefined }) {
  if (!badgeId) return null
  const badge = BADGES.find((item) => item.id === badgeId)
  if (!badge) return null
  return <BadgeChip badge={badge} size="xs" />
}
