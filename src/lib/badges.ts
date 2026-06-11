// Definisi badge + evaluasi. Untuk update ini kita bikin sistem rarity yang lebih jelas:
// - 1 badge terlangka (rarest)
// - 3 badge bergerak (animated)
// - 8 badge epic
// - sisanya common/biasa
// Tetap dihitung dari data yang sudah ada supaya tidak butuh service mahal dulu.

export type AchievementStats = {
  completed: number
  created: number
  ontime: number
  streak: number
  points: number
  referrals: number
  dailyCheckins?: number
  weeklyRank?: number | null
  monthlyRank?: number | null
  arenaApproved?: number
  arenaCreated?: number
  manualBadgeIds?: string[]
  isFounder?: boolean
  isPremium: boolean
  plan?: string
}

export type BadgeMetric =
  | 'completed'
  | 'created'
  | 'ontime'
  | 'streak'
  | 'points'
  | 'referrals'
  | 'daily_checkins'
  | 'premium'
  | 'weekly_rank1'
  | 'monthly_rank1'
  | 'arena_approved'
  | 'arena_created'
  | 'manual_badge'
  | 'tier_radar'
  | 'tier_pulse'
  | 'tier_command'

export type BadgeTier = 'common' | 'epic' | 'rarest'

export type BadgeDef = {
  id: string
  name: string
  desc: string
  icon: string
  metric: BadgeMetric
  goal: number
  tier: BadgeTier
  animated?: boolean
  fomo?: string
}

// Tepat 3 badge animated. Jangan ditambah sembarangan, nanti efek langkanya bocor seperti rahasia grup kelas.
export const ANIMATED_BADGE_IDS = ['badge_command', 'streak_30', 'nexa_origin'] as const

export const BADGES: BadgeDef[] = [
  // COMMON / BIASA
  { id: 'rookie', name: 'Langkah Pertama', desc: 'Selesaikan deadline pertamamu.', icon: 'Sparkles', metric: 'completed', goal: 1, tier: 'common' },
  { id: 'finisher_5', name: 'Mulai Produktif', desc: 'Selesaikan 5 deadline.', icon: 'CheckCircle2', metric: 'completed', goal: 5, tier: 'common' },
  { id: 'finisher_10', name: 'Produktif', desc: 'Selesaikan 10 deadline.', icon: 'CheckCircle2', metric: 'completed', goal: 10, tier: 'common' },
  { id: 'planner_5', name: 'Planner Baru', desc: 'Catat 5 deadline.', icon: 'CalendarCheck', metric: 'created', goal: 5, tier: 'common' },
  { id: 'planner_20', name: 'Perencana Ulung', desc: 'Catat 20 deadline.', icon: 'CalendarCheck', metric: 'created', goal: 20, tier: 'common' },
  { id: 'punctual_3', name: 'On-Time Starter', desc: 'Dapatkan 3 bonus tepat waktu.', icon: 'Clock', metric: 'ontime', goal: 3, tier: 'common' },
  { id: 'streak_3', name: 'Mulai Konsisten', desc: 'Streak 3 hari berturut-turut.', icon: 'Flame', metric: 'streak', goal: 3, tier: 'common' },
  { id: 'streak_7', name: 'Seminggu Penuh', desc: 'Streak 7 hari berturut-turut.', icon: 'Flame', metric: 'streak', goal: 7, tier: 'common' },
  { id: 'daily_1', name: 'Daily Pulse', desc: 'Check-in harian pertamamu.', icon: 'HeartPulse', metric: 'daily_checkins', goal: 1, tier: 'common' },
  { id: 'daily_7', name: 'Ritual Mingguan', desc: 'Check-in Daily Pulse 7 kali.', icon: 'HeartPulse', metric: 'daily_checkins', goal: 7, tier: 'common' },
  { id: 'centurion', name: 'Centurion', desc: 'Kumpulkan 100 poin.', icon: 'Trophy', metric: 'points', goal: 100, tier: 'common' },
  { id: 'connector', name: 'Pengajak', desc: 'Ajak 1 teman lewat referral.', icon: 'UserPlus', metric: 'referrals', goal: 1, tier: 'common' },
  { id: 'arena_applicant', name: 'Arena Approved', desc: 'Diterima owner ke tim NEXA Arena.', icon: 'Handshake', metric: 'arena_approved', goal: 1, tier: 'common' },
  { id: 'arena_creator', name: 'Arena Captain', desc: 'Buat postingan cari tim di NEXA Arena.', icon: 'Sword', metric: 'arena_created', goal: 1, tier: 'common' },
  { id: 'weekly_champion', name: 'Juara Mingguan', desc: 'Pernah jadi rank #1 leaderboard mingguan.', icon: 'Medal', metric: 'weekly_rank1', goal: 1, tier: 'common' },
  { id: 'monthly_champion', name: 'Juara Bulanan', desc: 'Pernah jadi rank #1 leaderboard bulanan.', icon: 'Trophy', metric: 'monthly_rank1', goal: 1, tier: 'common' },
  { id: 'badge_radar', name: '🎯 NEXA Radar', desc: 'Pengguna setia NEXA Radar. Langkah awal memakai NEXA.', icon: 'Radar', metric: 'tier_radar', goal: 1, tier: 'common' },
  { id: 'badge_pulse', name: '⚡ NEXA Pulse', desc: 'Naik level ke Pulse untuk reminder yang lebih rapi.', icon: 'Zap', metric: 'tier_pulse', goal: 1, tier: 'common' },
  { id: 'premium', name: 'Member Premium', desc: 'Aktifkan NEXA Pulse atau Command.', icon: 'Gem', metric: 'premium', goal: 1, tier: 'common' },

  // EPIC — tepat 8 badge
  { id: 'finisher_50', name: 'Mesin Deadline', desc: 'Selesaikan 50 deadline.', icon: 'Rocket', metric: 'completed', goal: 50, tier: 'epic', fomo: 'Epic: bukti progres yang konsisten.' },
  { id: 'punctual_25', name: 'Anti Telat', desc: 'Dapatkan 25 bonus tepat waktu.', icon: 'Clock', metric: 'ontime', goal: 25, tier: 'epic', fomo: 'Epic: untuk progres yang disiplin.' },
  { id: 'streak_30', name: 'Tak Terhentikan', desc: 'Streak 30 hari berturut-turut.', icon: 'Flame', metric: 'streak', goal: 30, tier: 'epic', animated: true, fomo: 'Animated Epic: salah satu badge bergerak.' },
  { id: 'elite', name: 'Elite 500', desc: 'Kumpulkan 500 poin.', icon: 'Crown', metric: 'points', goal: 500, tier: 'epic', fomo: 'Epic: poinmu sudah tinggi.' },
  { id: 'daily_30', name: 'Daily Loyalist', desc: 'Check-in Daily Pulse 30 kali.', icon: 'HeartPulse', metric: 'daily_checkins', goal: 30, tier: 'epic', fomo: 'Epic: terbuka untuk pengguna yang aktif secara konsisten.' },
  { id: 'squad', name: 'Squad Builder', desc: 'Ajak 3 teman lewat referral.', icon: 'Users', metric: 'referrals', goal: 3, tier: 'epic', fomo: 'Epic: mulai membangun komunitas.' },
  { id: 'referral_10', name: 'Campus Magnet', desc: 'Ajak 10 teman lewat referral.', icon: 'Megaphone', metric: 'referrals', goal: 10, tier: 'epic', fomo: 'Epic: referral kamu mulai berdampak.' },
  { id: 'badge_command', name: '👑 NEXA Command', desc: 'Paket tertinggi dengan akses fitur paling lengkap.', icon: 'Crown', metric: 'tier_command', goal: 1, tier: 'epic', animated: true, fomo: 'Animated Epic: badge khusus Command.' },

  // RAREST — tepat 1 badge
  { id: 'nexa_origin', name: 'NEXA Origin', desc: 'Badge terlangka. Ajak 25 teman lewat referral dan jadi bagian awal pertumbuhan NEXA Campus.', icon: 'Orbit', metric: 'referrals', goal: 25, tier: 'rarest', animated: true, fomo: 'Rarest: badge paling terbatas di kelas ini.' },
]

export type BadgeProgress = {
  def: BadgeDef
  current: number
  earned: boolean
  progress: number // 0..1
}

function metricValue(stats: AchievementStats, metric: BadgeMetric): number {
  switch (metric) {
    case 'completed': return stats.completed
    case 'created': return stats.created
    case 'ontime': return stats.ontime
    case 'streak': return stats.streak
    case 'points': return stats.points
    case 'referrals': return stats.referrals
    case 'daily_checkins': return stats.dailyCheckins ?? 0
    case 'weekly_rank1': return stats.weeklyRank === 1 ? 1 : 0
    case 'monthly_rank1': return stats.monthlyRank === 1 ? 1 : 0
    case 'arena_approved': return stats.arenaApproved ?? 0
    case 'arena_created': return stats.arenaCreated ?? 0
    case 'manual_badge': return 0
    case 'premium': return stats.isPremium ? 1 : 0
    case 'tier_radar': return stats.plan !== undefined ? 1 : 0
    case 'tier_pulse': return stats.plan === 'pulse' || stats.plan === 'command' ? 1 : 0
    case 'tier_command': return stats.plan === 'command' ? 1 : 0
  }
}

export function evaluateBadges(stats: AchievementStats): BadgeProgress[] {
  const manual = new Set(stats.manualBadgeIds ?? [])
  return BADGES.map((def) => {
    const current = metricValue(stats, def.metric)
    const earned = stats.isFounder || manual.has(def.id) || current >= def.goal
    return {
      def,
      current,
      earned,
      progress: Math.max(0, Math.min(1, def.goal > 0 ? current / def.goal : 0)),
    }
  })
}

export function badgeRaritySummary() {
  return {
    common: BADGES.filter((badge) => badge.tier === 'common').length,
    epic: BADGES.filter((badge) => badge.tier === 'epic').length,
    rarest: BADGES.filter((badge) => badge.tier === 'rarest').length,
    animated: BADGES.filter((badge) => badge.animated).length,
  }
}
