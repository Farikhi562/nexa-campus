import { ANIMATED_BADGE_IDS, BADGES, type BadgeDef, type BadgeTier } from '@/lib/badges'

const TIER_CONFIG: Record<BadgeTier, {
  bg: string; ring: string; text: string; label: string; glow: string; labelText: string
}> = {
  common: {
    bg: 'bg-gradient-to-br from-slate-50 to-slate-100',
    ring: 'ring-1 ring-slate-200',
    text: 'text-slate-700',
    label: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    glow: '',
    labelText: 'Biasa',
  },
  epic: {
    bg: 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-300',
    ring: 'ring-2 ring-fuchsia-300',
    text: 'text-white',
    label: 'bg-fuchsia-50 text-fuchsia-700 ring-1 ring-fuchsia-200',
    glow: 'shadow-lg shadow-fuchsia-200/60',
    labelText: 'Epic',
  },
  rarest: {
    bg: 'bg-[conic-gradient(from_180deg_at_50%_50%,#0f172a,#7c3aed,#f59e0b,#14b8a6,#0f172a)]',
    ring: 'ring-2 ring-amber-300',
    text: 'text-white',
    label: 'bg-slate-950 text-amber-200 ring-1 ring-amber-300/50',
    glow: 'shadow-2xl shadow-amber-300/60',
    labelText: 'Rarest',
  },
}

const BADGE_OVERRIDES: Record<string, { bg: string; ring: string; text: string; glow: string; emoji: string }> = {
  badge_command: {
    bg: 'bg-gradient-to-br from-yellow-400 via-amber-300 to-yellow-500',
    ring: 'ring-2 ring-yellow-300',
    text: 'text-yellow-950',
    glow: 'shadow-xl shadow-yellow-300/60',
    emoji: '👑',
  },
  badge_pulse: {
    bg: 'bg-gradient-to-br from-blue-500 via-cyan-400 to-teal-400',
    ring: 'ring-2 ring-cyan-300',
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
  nexa_origin: {
    bg: 'bg-[conic-gradient(from_180deg_at_50%_50%,#020617,#7c3aed,#f59e0b,#2dd4bf,#020617)]',
    ring: 'ring-2 ring-amber-200',
    text: 'text-white',
    glow: 'shadow-2xl shadow-amber-300/60',
    emoji: '🌌',
  },
  streak_30: {
    bg: 'bg-gradient-to-br from-orange-400 via-red-500 to-fuchsia-600',
    ring: 'ring-2 ring-orange-300',
    text: 'text-white',
    glow: 'shadow-xl shadow-orange-200/70',
    emoji: '🔥',
  },
  referral_10: {
    bg: 'bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-pink-400',
    ring: 'ring-2 ring-fuchsia-300',
    text: 'text-white',
    glow: 'shadow-lg shadow-fuchsia-200/60',
    emoji: '🧲',
  },
  pulse_6_months: {
    bg: 'bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-400',
    ring: 'ring-2 ring-teal-200',
    text: 'text-slate-950',
    glow: 'shadow-xl shadow-teal-200/70',
    emoji: '⚡',
  },
  command_6_months: {
    bg: 'bg-gradient-to-br from-amber-300 via-yellow-300 to-orange-400',
    ring: 'ring-2 ring-amber-200',
    text: 'text-amber-950',
    glow: 'shadow-xl shadow-amber-200/70',
    emoji: '👑',
  },
  pulse_12_months: {
    bg: 'bg-[conic-gradient(from_180deg_at_50%_50%,#06b6d4,#14b8a6,#a7f3d0,#06b6d4)]',
    ring: 'ring-2 ring-cyan-200',
    text: 'text-slate-950',
    glow: 'shadow-2xl shadow-cyan-200/70',
    emoji: '💎',
  },
  command_12_months: {
    bg: 'bg-[conic-gradient(from_180deg_at_50%_50%,#111827,#f59e0b,#fde68a,#7c2d12,#111827)]',
    ring: 'ring-2 ring-yellow-200',
    text: 'text-white',
    glow: 'shadow-2xl shadow-amber-300/70',
    emoji: '🏆',
  },
  leaderboard_top1_5_months: {
    bg: 'bg-[conic-gradient(from_180deg_at_50%_50%,#020617,#0ea5e9,#a855f7,#f59e0b,#020617)]',
    ring: 'ring-2 ring-sky-200',
    text: 'text-white',
    glow: 'shadow-2xl shadow-sky-300/60',
    emoji: '🥇',
  },
}

type BadgeSize = 'xs' | 'sm' | 'md' | 'lg'

const SIZE = {
  xs: { wrap: 'h-6 w-6 rounded-lg text-sm' },
  sm: { wrap: 'h-8 w-8 rounded-xl text-base' },
  md: { wrap: 'h-12 w-12 rounded-2xl text-2xl' },
  lg: { wrap: 'h-16 w-16 rounded-2xl text-3xl' },
}

function badgeEmoji(badge: BadgeDef): string {
  if (BADGE_OVERRIDES[badge.id]?.emoji) return BADGE_OVERRIDES[badge.id].emoji
  const iconEmojis: Record<string, string> = {
    Sparkles: '✨',
    CheckCircle2: '✅',
    Rocket: '🚀',
    CalendarCheck: '📅',
    Clock: '⏰',
    Flame: '🔥',
    Trophy: '🏆',
    Crown: '👑',
    UserPlus: '👋',
    Users: '👥',
    Gem: '💎',
    Radar: '🎯',
    Zap: '⚡',
    HeartPulse: '💓',
    Megaphone: '📣',
    Orbit: '🌌',
    Handshake: '🤝',
    Sword: '⚔️',
    Medal: '🥇',
  }
  return iconEmojis[badge.icon] ?? '🏅'
}

function isAnimatedBadge(badge: BadgeDef) {
  return Boolean(badge.animated) && (ANIMATED_BADGE_IDS as readonly string[]).includes(badge.id)
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
  const animated = isAnimatedBadge(badge)
  const isRarest = badge.tier === 'rarest'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      title={`${badge.name}${animated ? ' · Animated badge' : ''}`}
      className={`relative flex flex-shrink-0 items-center justify-center overflow-hidden transition ${s.wrap} ${bg} ${ring} ${glow} ${
        selected ? 'scale-110 ring-4 ring-offset-1 ring-teal-400' : ''
      } ${animated ? 'nexa-animated-badge' : ''} ${isRarest ? 'nexa-rarest-badge' : ''} ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : 'cursor-default'}`}
    >
      {animated && <span className="nexa-badge-orbit pointer-events-none absolute -inset-1.5 rounded-[inherit]" />}
      <span className={`relative z-10 ${text} ${animated ? 'nexa-badge-icon' : ''}`}>{emoji}</span>
      {animated && <span className="nexa-badge-shine pointer-events-none absolute inset-y-0 left-0 rounded-[inherit]" />}
      {!animated && badge.tier === 'epic' && (
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_62%_28%,rgba(255,255,255,0.5),transparent_58%)]" />
      )}
      {isRarest && <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.25),transparent_55%)]" />}
    </button>
  )
}

export function BadgeTierLabel({ tier }: { tier: BadgeTier }) {
  const config = TIER_CONFIG[tier]
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${config.label}`}>
      {config.labelText}
    </span>
  )
}

export function FeaturedBadgePin({ badgeId }: { badgeId: string | null | undefined }) {
  if (!badgeId) return null
  const badge = BADGES.find((item) => item.id === badgeId)
  if (!badge) return null
  return <BadgeChip badge={badge} size="xs" />
}
