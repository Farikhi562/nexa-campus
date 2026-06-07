// Definisi badge + evaluasi. Dihitung dari data yang sudah ada (deadline, poin,
// streak, referral) sehingga tidak butuh tabel baru.

export type AchievementStats = {
  completed: number
  created: number
  ontime: number
  streak: number
  maxStreak: number
  points: number
  referrals: number
  isPremium: boolean
  plan?: string
  studyRoomJoined?: number
  studyRoomCreated?: number
  focusSessions?: number
  friendsCount?: number
}

export type BadgeMetric =
  | 'completed' | 'created' | 'ontime' | 'streak' | 'maxStreak'
  | 'points' | 'referrals' | 'premium'
  | 'tier_radar' | 'tier_pulse' | 'tier_command'
  | 'studyRoomJoined' | 'studyRoomCreated' | 'focusSessions' | 'friendsCount'

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'special' | 'legendary'

export type BadgeDef = {
  id: string
  name: string
  desc: string
  icon: string
  metric: BadgeMetric
  goal: number
  tier: BadgeTier
  reward?: string // reward description when earned
}

export const BADGES: BadgeDef[] = [
  // === COMPLETION ===
  { id: 'rookie', name: 'Langkah Pertama', desc: 'Selesaikan deadline pertamamu.', icon: 'Sparkles', metric: 'completed', goal: 1, tier: 'bronze', reward: '+5 poin bonus' },
  { id: 'finisher_5', name: 'Mulai Bergerak', desc: 'Selesaikan 5 deadline.', icon: 'CheckCircle2', metric: 'completed', goal: 5, tier: 'bronze' },
  { id: 'finisher_10', name: 'Produktif', desc: 'Selesaikan 10 deadline.', icon: 'CheckCircle2', metric: 'completed', goal: 10, tier: 'silver', reward: '+15 poin bonus' },
  { id: 'finisher_25', name: 'Mesin Produktif', desc: 'Selesaikan 25 deadline.', icon: 'Zap', metric: 'completed', goal: 25, tier: 'silver' },
  { id: 'finisher_50', name: 'Mesin Deadline', desc: 'Selesaikan 50 deadline.', icon: 'Rocket', metric: 'completed', goal: 50, tier: 'gold', reward: '+50 poin bonus' },
  { id: 'finisher_100', name: 'Legenda Kampus', desc: 'Selesaikan 100 deadline. Kamu luar biasa.', icon: 'Crown', metric: 'completed', goal: 100, tier: 'legendary', reward: '+100 poin bonus' },

  // === PLANNING ===
  { id: 'planner_5', name: 'Mulai Terencana', desc: 'Catat 5 deadline.', icon: 'CalendarCheck', metric: 'created', goal: 5, tier: 'bronze' },
  { id: 'planner_20', name: 'Perencana Ulung', desc: 'Catat 20 deadline.', icon: 'CalendarCheck', metric: 'created', goal: 20, tier: 'silver' },
  { id: 'planner_50', name: 'Master Planner', desc: 'Catat 50 deadline. Hidupmu sangat terorganisir.', icon: 'CalendarDays', metric: 'created', goal: 50, tier: 'gold' },

  // === PUNCTUALITY ===
  { id: 'punctual_1', name: 'Tepat Pertama', desc: 'Selesaikan deadline pertama sebelum tenggat.', icon: 'Clock', metric: 'ontime', goal: 1, tier: 'bronze' },
  { id: 'punctual_10', name: 'Tepat Waktu', desc: 'Selesaikan 10 deadline sebelum tenggat.', icon: 'Clock', metric: 'ontime', goal: 10, tier: 'gold' },
  { id: 'punctual_30', name: 'Sang Disiplin', desc: 'Selesaikan 30 deadline sebelum tenggat.', icon: 'Timer', metric: 'ontime', goal: 30, tier: 'legendary' },

  // === STREAK ===
  { id: 'streak_3', name: 'Mulai Konsisten', desc: 'Streak 3 hari berturut-turut.', icon: 'Flame', metric: 'streak', goal: 3, tier: 'bronze' },
  { id: 'streak_7', name: 'Seminggu Penuh', desc: 'Streak 7 hari berturut-turut.', icon: 'Flame', metric: 'streak', goal: 7, tier: 'silver', reward: '+10 poin bonus' },
  { id: 'streak_14', name: 'Dua Minggu Jalan', desc: 'Streak 14 hari berturut-turut.', icon: 'Flame', metric: 'streak', goal: 14, tier: 'silver' },
  { id: 'streak_30', name: 'Tak Terhentikan', desc: 'Streak 30 hari berturut-turut.', icon: 'Flame', metric: 'streak', goal: 30, tier: 'gold', reward: '+30 poin bonus' },
  { id: 'streak_60', name: 'Dua Bulan Tanpa Henti', desc: 'Streak 60 hari. Luar biasa.', icon: 'Flame', metric: 'streak', goal: 60, tier: 'legendary', reward: '+60 poin bonus' },
  { id: 'maxstreak_30', name: 'Rekor Streak', desc: 'Capai max streak 30 hari kapan saja.', icon: 'TrendingUp', metric: 'maxStreak', goal: 30, tier: 'gold' },

  // === POINTS ===
  { id: 'centurion', name: 'Centurion', desc: 'Kumpulkan 100 poin.', icon: 'Trophy', metric: 'points', goal: 100, tier: 'silver' },
  { id: 'elite', name: 'Elite', desc: 'Kumpulkan 500 poin.', icon: 'Crown', metric: 'points', goal: 500, tier: 'gold' },
  { id: 'legend_1000', name: 'Mahir NEXA', desc: 'Kumpulkan 1000 poin. Kamu monster.', icon: 'Star', metric: 'points', goal: 1000, tier: 'legendary' },

  // === SOCIAL / REFERRAL ===
  { id: 'connector', name: 'Pengajak', desc: 'Ajak 1 teman lewat referral.', icon: 'UserPlus', metric: 'referrals', goal: 1, tier: 'bronze' },
  { id: 'squad', name: 'Squad Builder', desc: 'Ajak 3 teman lewat referral.', icon: 'Users', metric: 'referrals', goal: 3, tier: 'gold' },
  { id: 'influencer', name: 'Influencer Kampus', desc: 'Ajak 10 teman lewat referral.', icon: 'Users', metric: 'referrals', goal: 10, tier: 'legendary' },

  // === STUDY ROOM ===
  { id: 'room_joiner', name: 'Bareng Yuk!', desc: 'Gabung 1 study room.', icon: 'BookOpen', metric: 'studyRoomJoined', goal: 1, tier: 'bronze' },
  { id: 'room_regular', name: 'Study Bareng Pro', desc: 'Gabung 5 study room berbeda.', icon: 'BookOpen', metric: 'studyRoomJoined', goal: 5, tier: 'silver' },
  { id: 'room_creator', name: 'Room Master', desc: 'Buat 1 study room.', icon: 'Home', metric: 'studyRoomCreated', goal: 1, tier: 'silver' },

  // === FOCUS ===
  { id: 'focus_first', name: 'Fokus Dimulai', desc: 'Selesaikan 1 sesi fokus.', icon: 'Timer', metric: 'focusSessions', goal: 1, tier: 'bronze' },
  { id: 'focus_10', name: 'Deep Worker', desc: 'Selesaikan 10 sesi fokus.', icon: 'Timer', metric: 'focusSessions', goal: 10, tier: 'silver' },

  // === FRIENDS ===
  { id: 'social_1', name: 'Dapat Teman', desc: 'Temukan 1 teman di NEXA.', icon: 'UserPlus', metric: 'friendsCount', goal: 1, tier: 'bronze' },
  { id: 'social_5', name: 'Punya Circle', desc: 'Temukan 5 teman di NEXA.', icon: 'Users', metric: 'friendsCount', goal: 5, tier: 'silver' },

  // === PLAN TIERS ===
  { id: 'premium', name: 'Member Premium', desc: 'Aktifkan NEXA Pulse atau Command.', icon: 'Gem', metric: 'premium', goal: 1, tier: 'special' },
  { id: 'badge_radar', name: '🎯 NEXA Radar', desc: 'Pengguna setia NEXA Radar. Awal dari segalanya.', icon: 'Target', metric: 'tier_radar', goal: 1, tier: 'bronze' },
  { id: 'badge_pulse', name: '⚡ NEXA Pulse', desc: 'Naik level ke Pulse. Deadline makin teratur.', icon: 'Zap', metric: 'tier_pulse', goal: 1, tier: 'silver' },
  { id: 'badge_command', name: '👑 NEXA Command', desc: 'Puncak. Semua fitur terbuka, tidak ada yang tersembunyi.', icon: 'Crown', metric: 'tier_command', goal: 1, tier: 'gold' },
]

// Badge IDs yang bisa dipilih untuk ditampilkan di profil
export const PROFILE_BADGE_IDS = [
  'badge_radar', 'badge_pulse', 'badge_command',
  'finisher_100', 'streak_60', 'legend_1000',
  'squad', 'influencer', 'finisher_50',
  'streak_30', 'punctual_30', 'elite',
  'room_creator', 'focus_10', 'social_5',
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
    case 'maxStreak': return stats.maxStreak ?? stats.streak
    case 'points': return stats.points
    case 'referrals': return stats.referrals
    case 'premium': return stats.isPremium ? 1 : 0
    case 'tier_radar': return stats.plan !== undefined ? 1 : 0
    case 'tier_pulse': return stats.plan === 'pulse' || stats.plan === 'command' ? 1 : 0
    case 'tier_command': return stats.plan === 'command' ? 1 : 0
    case 'studyRoomJoined': return stats.studyRoomJoined ?? 0
    case 'studyRoomCreated': return stats.studyRoomCreated ?? 0
    case 'focusSessions': return stats.focusSessions ?? 0
    case 'friendsCount': return stats.friendsCount ?? 0
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
