// Definisi badge + evaluasi. Dihitung dari data yang sudah ada (deadline, poin,
// streak, referral) sehingga tidak butuh tabel baru.

export type AchievementStats = {
  completed: number
  created: number
  ontime: number
  streak: number
  points: number
  referrals: number
  isPremium: boolean
}

export type BadgeMetric = 'completed' | 'created' | 'ontime' | 'streak' | 'points' | 'referrals' | 'premium'

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'special'

export type BadgeDef = {
  id: string
  name: string
  desc: string
  icon: string
  metric: BadgeMetric
  goal: number
  tier: BadgeTier
}

export const BADGES: BadgeDef[] = [
  { id: 'rookie', name: 'Langkah Pertama', desc: 'Selesaikan deadline pertamamu.', icon: 'Sparkles', metric: 'completed', goal: 1, tier: 'bronze' },
  { id: 'finisher_10', name: 'Produktif', desc: 'Selesaikan 10 deadline.', icon: 'CheckCircle2', metric: 'completed', goal: 10, tier: 'silver' },
  { id: 'finisher_50', name: 'Mesin Deadline', desc: 'Selesaikan 50 deadline.', icon: 'Rocket', metric: 'completed', goal: 50, tier: 'gold' },
  { id: 'planner_20', name: 'Perencana Ulung', desc: 'Catat 20 deadline.', icon: 'CalendarCheck', metric: 'created', goal: 20, tier: 'silver' },
  { id: 'punctual_10', name: 'Tepat Waktu', desc: 'Selesaikan 10 deadline sebelum tenggat.', icon: 'Clock', metric: 'ontime', goal: 10, tier: 'gold' },
  { id: 'streak_3', name: 'Mulai Konsisten', desc: 'Streak 3 hari berturut-turut.', icon: 'Flame', metric: 'streak', goal: 3, tier: 'bronze' },
  { id: 'streak_7', name: 'Seminggu Penuh', desc: 'Streak 7 hari berturut-turut.', icon: 'Flame', metric: 'streak', goal: 7, tier: 'silver' },
  { id: 'streak_30', name: 'Tak Terhentikan', desc: 'Streak 30 hari berturut-turut.', icon: 'Flame', metric: 'streak', goal: 30, tier: 'gold' },
  { id: 'centurion', name: 'Centurion', desc: 'Kumpulkan 100 poin.', icon: 'Trophy', metric: 'points', goal: 100, tier: 'silver' },
  { id: 'elite', name: 'Elite', desc: 'Kumpulkan 500 poin.', icon: 'Crown', metric: 'points', goal: 500, tier: 'gold' },
  { id: 'connector', name: 'Pengajak', desc: 'Ajak 1 teman lewat referral.', icon: 'UserPlus', metric: 'referrals', goal: 1, tier: 'bronze' },
  { id: 'squad', name: 'Squad Builder', desc: 'Ajak 3 teman lewat referral.', icon: 'Users', metric: 'referrals', goal: 3, tier: 'gold' },
  { id: 'premium', name: 'Member Premium', desc: 'Aktifkan NEXA Pulse atau Command.', icon: 'Gem', metric: 'premium', goal: 1, tier: 'special' },
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
    case 'premium': return stats.isPremium ? 1 : 0
  }
}

export function evaluateBadges(stats: AchievementStats): BadgeProgress[] {
  return BADGES.map((def) => {
    const current = metricValue(stats, def.metric)
    const earned = current >= def.goal
    return {
      def,
      current,
      earned,
      progress: Math.max(0, Math.min(1, def.goal > 0 ? current / def.goal : 0)),
    }
  })
}
