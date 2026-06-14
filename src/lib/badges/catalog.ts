export type BadgeRarity = 'biasa' | 'langka' | 'epic' | 'legend' | 'mythos'

export type BadgeAnimationTier = 'none' | 'subtle' | 'epic' | 'legend' | 'mythos'

export type NexaBadgeCategory =
  | 'deadline'
  | 'study_room'
  | 'arena'
  | 'social'
  | 'assistant'
  | 'founder'
  | 'focus'
  | 'notification'
  | 'billing'
  | 'leaderboard'
  | 'referral'

export type NexaBadge = {
  key: string
  name: string
  description: string
  requirement: string
  rarity: BadgeRarity
  category: NexaBadgeCategory
  emoji: string
  sortOrder: number
  animated: boolean
  animationTier: BadgeAnimationTier
  profilePriority: number
}

export const BADGE_RARITY_LABEL: Record<BadgeRarity, string> = {
  biasa: 'Biasa',
  langka: 'Langka',
  epic: 'Epic',
  legend: 'Legend',
  mythos: 'Mythos',
}

export const BADGE_RARITY_COPY: Record<BadgeRarity, string> = {
  biasa: 'Badge basic. Emoji doang, buat pemanasan biar user nggak merasa hidupnya kosong banget.',
  langka: 'Badge bagus dan static. Nggak gerak, tapi udah lebih niat daripada stiker gratisan.',
  epic: 'Badge animated subtle. Ada gerak, tapi belum sampai GPU user minta pensiun.',
  legend: 'Badge animated premium. Untuk user yang beneran konsisten, bukan login sekali terus ngilang.',
  mythos: 'Final boss badge. Paling susah, paling langka, paling bikin orang lain iri tapi pura-pura biasa aja.',
}

export const BADGE_RARITY_ORDER: BadgeRarity[] = ['mythos', 'legend', 'epic', 'langka', 'biasa']

export const NEXA_BADGES: NexaBadge[] = [
  { key: 'first_ping', name: 'First Ping', description: 'Pertama kali aktif di NEXA Campus.', requirement: 'Login dan buka dashboard pertama kali.', rarity: 'biasa', category: 'founder', emoji: '👋', sortOrder: 1, animated: false, animationTier: 'none', profilePriority: 30 },
  { key: 'deadline_newbie', name: 'Deadline Newbie', description: 'Membuat deadline pertama.', requirement: 'Buat minimal 1 deadline aktif.', rarity: 'biasa', category: 'deadline', emoji: '📝', sortOrder: 2, animated: false, animationTier: 'none', profilePriority: 29 },
  { key: 'campus_walker', name: 'Campus Walker', description: 'Mulai keliling dashboard tanpa tersesat total.', requirement: 'Kunjungi minimal 3 halaman dashboard.', rarity: 'biasa', category: 'focus', emoji: '🎒', sortOrder: 3, animated: false, animationTier: 'none', profilePriority: 28 },

  { key: 'deadline_guard', name: 'Deadline Guard', description: 'Menjaga deadline tetap aman sebelum meledak.', requirement: 'Selesaikan 3 deadline sebelum due date.', rarity: 'langka', category: 'deadline', emoji: '🛡️', sortOrder: 4, animated: false, animationTier: 'none', profilePriority: 40 },
  { key: 'study_ally', name: 'Study Ally', description: 'Aktif di Study Room dan tidak cuma numpang nama.', requirement: 'Join Study Room dan aktif minimal 1 sesi.', rarity: 'langka', category: 'study_room', emoji: '🤝', sortOrder: 5, animated: false, animationTier: 'none', profilePriority: 39 },
  { key: 'telegram_ready', name: 'Telegram Ready', description: 'Menghubungkan Telegram reminder.', requirement: 'Hubungkan akun Telegram ke NEXA.', rarity: 'langka', category: 'notification', emoji: '📨', sortOrder: 6, animated: false, animationTier: 'none', profilePriority: 38 },
  { key: 'friend_magnet', name: 'Friend Magnet', description: 'Mulai membangun circle akademik.', requirement: 'Tambah minimal 3 teman.', rarity: 'langka', category: 'social', emoji: '🧲', sortOrder: 7, animated: false, animationTier: 'none', profilePriority: 37 },
  { key: 'focus_keeper', name: 'Focus Keeper', description: 'Menjaga fokus beberapa sesi tanpa kabur ke scroll random.', requirement: 'Selesaikan 3 sesi focus mode.', rarity: 'langka', category: 'focus', emoji: '🎯', sortOrder: 8, animated: false, animationTier: 'none', profilePriority: 36 },
  { key: 'arena_scout', name: 'Arena Scout', description: 'Membuka dan mengintip NEXA Arena pertama kali.', requirement: 'Buka NEXA Arena minimal 1 kali.', rarity: 'langka', category: 'arena', emoji: '🏹', sortOrder: 9, animated: false, animationTier: 'none', profilePriority: 35 },
  { key: 'pulse_spark', name: 'Pulse Spark', description: 'Pernah support NEXA Pulse minimal satu kali.', requirement: 'Berlangganan NEXA Pulse minimal 1 kali atau punya order Pulse approved.', rarity: 'langka', category: 'billing', emoji: '💚', sortOrder: 31, animated: false, animationTier: 'none', profilePriority: 58 },
  { key: 'command_spark', name: 'Command Spark', description: 'Pernah masuk mode Command minimal satu kali.', requirement: 'Berlangganan NEXA Command minimal 1 kali atau punya order Command approved.', rarity: 'langka', category: 'billing', emoji: '👑', sortOrder: 32, animated: false, animationTier: 'none', profilePriority: 59 },

  { key: 'quick_add_beast', name: 'Quick Add Beast', description: 'Sering input deadline cepat tanpa drama panjang.', requirement: 'Pakai AI Quick Add minimal 5 kali.', rarity: 'epic', category: 'deadline', emoji: '⚡', sortOrder: 10, animated: true, animationTier: 'epic', profilePriority: 55 },
  { key: 'ai_scheduler', name: 'AI Scheduler', description: 'Membuat jadwal eksekusi pakai NEXA Assistant.', requirement: 'Buat minimal 3 battle plan dari NEXA Assistant.', rarity: 'epic', category: 'assistant', emoji: '🤖', sortOrder: 11, animated: true, animationTier: 'epic', profilePriority: 54 },
  { key: 'risk_hunter', name: 'Risk Hunter', description: 'Menjalankan risk scan sebelum deadline berubah jadi kebakaran.', requirement: 'Jalankan risk scan minimal 5 kali.', rarity: 'epic', category: 'assistant', emoji: '📡', sortOrder: 12, animated: true, animationTier: 'epic', profilePriority: 53 },
  { key: 'reminder_builder', name: 'Reminder Builder', description: 'Menyusun reminder yang tidak cuma bunyi pas semuanya telat.', requirement: 'Buat reminder custom minimal 5 kali.', rarity: 'epic', category: 'notification', emoji: '🔔', sortOrder: 13, animated: true, animationTier: 'epic', profilePriority: 52 },
  { key: 'voice_note_caster', name: 'Voice Note Caster', description: 'Mengirim voice note di Study Room.', requirement: 'Kirim 3 voice note di Study Room.', rarity: 'epic', category: 'study_room', emoji: '🎙️', sortOrder: 14, animated: true, animationTier: 'epic', profilePriority: 51 },
  { key: 'video_call_initiator', name: 'Call Initiator', description: 'Memulai voice/video call Study Room.', requirement: 'Mulai 1 video/voice call Study Room sebagai Command user.', rarity: 'epic', category: 'study_room', emoji: '🎥', sortOrder: 15, animated: true, animationTier: 'epic', profilePriority: 50 },
  { key: 'deadline_streaker', name: 'Deadline Streaker', description: 'Menyelesaikan deadline beruntun tanpa jadi korban panik.', requirement: 'Selesaikan 7 deadline beruntun.', rarity: 'epic', category: 'deadline', emoji: '🔥', sortOrder: 16, animated: true, animationTier: 'epic', profilePriority: 49 },
  { key: 'study_room_host', name: 'Room Host', description: 'Membuat Study Room sendiri.', requirement: 'Buat 1 Study Room dan undang teman.', rarity: 'epic', category: 'study_room', emoji: '🏠', sortOrder: 17, animated: true, animationTier: 'epic', profilePriority: 48 },
  { key: 'battle_plan_maker', name: 'Battle Plan Maker', description: 'Membuat rencana belajar yang tidak cuma niat jam 2 pagi.', requirement: 'Generate 5 study battle plan.', rarity: 'epic', category: 'assistant', emoji: '🗺️', sortOrder: 18, animated: true, animationTier: 'epic', profilePriority: 47 },
  { key: 'night_owl', name: 'Night Owl', description: 'Produktif malam hari tanpa full berubah jadi makhluk goa.', requirement: 'Selesaikan aktivitas produktif setelah jam 21.00 sebanyak 5 kali.', rarity: 'epic', category: 'focus', emoji: '🦉', sortOrder: 19, animated: true, animationTier: 'epic', profilePriority: 46 },
  { key: 'anti_telat', name: 'Anti Telat Club', description: 'Menyelesaikan tugas sebelum deadline ngancam mental.', requirement: 'Selesaikan 10 deadline sebelum hari-H.', rarity: 'epic', category: 'deadline', emoji: '⏱️', sortOrder: 20, animated: true, animationTier: 'epic', profilePriority: 45 },
  { key: 'arena_contender', name: 'Arena Contender', description: 'Ikut kompetisi NEXA Arena.', requirement: 'Join minimal 1 kompetisi NEXA Arena.', rarity: 'epic', category: 'arena', emoji: '🥊', sortOrder: 21, animated: true, animationTier: 'epic', profilePriority: 44 },
  { key: 'team_synergy', name: 'Team Synergy', description: 'Aktif dalam tim dan tidak cuma muncul pas menang.', requirement: 'Aktif di team workspace minimal 3 hari.', rarity: 'epic', category: 'arena', emoji: '🧩', sortOrder: 22, animated: true, animationTier: 'epic', profilePriority: 43 },
  { key: 'summary_reader', name: 'Summary Reader', description: 'Membaca weekly summary pertama.', requirement: 'Buka weekly summary minimal 1 kali.', rarity: 'epic', category: 'notification', emoji: '📰', sortOrder: 23, animated: true, animationTier: 'epic', profilePriority: 42 },
  { key: 'focus_grinder', name: 'Focus Grinder', description: 'Menyelesaikan beberapa sesi fokus dengan konsisten.', requirement: 'Selesaikan 10 sesi focus mode.', rarity: 'epic', category: 'focus', emoji: '⚙️', sortOrder: 24, animated: true, animationTier: 'epic', profilePriority: 41 },
  { key: 'pulse_hexaflame', name: 'Pulse Hexaflame', description: 'Support Pulse berkali-kali, bukan cuma numpang promo sekali.', requirement: 'Berlangganan NEXA Pulse minimal 6 kali approved.', rarity: 'epic', category: 'billing', emoji: '💎', sortOrder: 33, animated: true, animationTier: 'epic', profilePriority: 63 },
  { key: 'leaderboard_six_month_king', name: 'Six-Month Rank One', description: 'Setengah tahun berturut-turut jadi Top 1 leaderboard. Gila sih, ini bukan user biasa.', requirement: 'Top 1 leaderboard selama 6 bulan berturut-turut.', rarity: 'epic', category: 'leaderboard', emoji: '🥇', sortOrder: 34, animated: true, animationTier: 'epic', profilePriority: 65 },

  { key: 'command_elite', name: 'Command Elite', description: 'Mengaktifkan NEXA Command dan masuk mode serius.', requirement: 'Aktifkan NEXA Command.', rarity: 'legend', category: 'founder', emoji: '👑', sortOrder: 25, animated: true, animationTier: 'legend', profilePriority: 80 },
  { key: 'arena_captain', name: 'Arena Captain', description: 'Membuat atau memimpin tim di NEXA Arena.', requirement: 'Buat/pimpin tim NEXA Arena dan aktifkan leaderboard tim.', rarity: 'legend', category: 'arena', emoji: '🚩', sortOrder: 26, animated: true, animationTier: 'legend', profilePriority: 79 },
  { key: 'deadline_commander', name: 'Deadline Commander', description: 'Menangani banyak deadline tanpa meltdown total.', requirement: 'Selesaikan 25 deadline, minimal 80% sebelum due date.', rarity: 'legend', category: 'deadline', emoji: '⚔️', sortOrder: 27, animated: true, animationTier: 'legend', profilePriority: 78 },
  { key: 'risk_oracle', name: 'Risk Oracle', description: 'Ahli membaca deadline berisiko sebelum semuanya gosong.', requirement: 'Jalankan 20 risk scan dan selamatkan 10 deadline high-risk.', rarity: 'legend', category: 'assistant', emoji: '🔮', sortOrder: 28, animated: true, animationTier: 'legend', profilePriority: 77 },
  { key: 'campus_titan', name: 'Campus Titan', description: 'Aktif lama, stabil, dan tidak tumbang oleh kalender akademik.', requirement: 'Aktif 30 hari dan pakai minimal 5 fitur utama NEXA.', rarity: 'legend', category: 'founder', emoji: '🏛️', sortOrder: 29, animated: true, animationTier: 'legend', profilePriority: 76 },
  { key: 'command_hexacrown', name: 'Command Hexacrown', description: 'Enam kali bayar Command. Ini bukan langganan, ini hubungan serius.', requirement: 'Berlangganan NEXA Command minimal 6 kali approved.', rarity: 'legend', category: 'billing', emoji: '🔱', sortOrder: 35, animated: true, animationTier: 'legend', profilePriority: 88 },
  { key: 'pulse_year_guardian', name: 'Pulse Year Guardian', description: 'Setahun jagain ritme akademik bareng Pulse.', requirement: 'Berlangganan NEXA Pulse selama 1 tahun atau minimal 12 order Pulse approved.', rarity: 'legend', category: 'billing', emoji: '🟢', sortOrder: 36, animated: true, animationTier: 'legend', profilePriority: 84 },
  { key: 'command_year_overlord', name: 'Command Year Overlord', description: 'Setahun full di Command. Kalender akademik aja mungkin sungkan.', requirement: 'Berlangganan NEXA Command selama 1 tahun atau minimal 12 order Command approved.', rarity: 'legend', category: 'billing', emoji: '🏆', sortOrder: 37, animated: true, animationTier: 'legend', profilePriority: 90 },
  { key: 'leaderboard_year_titan', name: 'Leaderboard Year Titan', description: 'Satu tahun eksis di leaderboard. Konsisten yang bikin lawan mikir dua kali.', requirement: 'Masuk leaderboard aktif selama 12 bulan.', rarity: 'legend', category: 'leaderboard', emoji: '🏛️', sortOrder: 38, animated: true, animationTier: 'legend', profilePriority: 86 },
  { key: 'deadline_500_commander', name: '500 Deadline Commander', description: 'Mengelola 500 deadline. Ini kalender atau medan perang, bedanya tipis.', requirement: 'Buat/kelola minimal 500 deadline di NEXA.', rarity: 'legend', category: 'deadline', emoji: '📚', sortOrder: 39, animated: true, animationTier: 'legend', profilePriority: 87 },

  { key: 'mythos_architect', name: 'Mythos Architect', description: 'Badge Mythos owner/founding architect NEXA.', requirement: 'Khusus owner/founding architect yang terdaftar di NEXA_OWNER_EMAILS.', rarity: 'mythos', category: 'founder', emoji: '🌌', sortOrder: 30, animated: true, animationTier: 'mythos', profilePriority: 999 },
  { key: 'referral_mythos_100', name: 'Referral Singularity', description: 'Mengundang 100 user lewat referral. Ini bukan promosi, ini invasi halus.', requirement: 'Dapatkan minimal 100 referral valid.', rarity: 'mythos', category: 'referral', emoji: '🪐', sortOrder: 40, animated: true, animationTier: 'mythos', profilePriority: 998 },
]

export const BADGE_BY_KEY = Object.fromEntries(NEXA_BADGES.map((badge) => [badge.key, badge])) as Record<string, NexaBadge>
export const ALL_BADGE_KEYS = NEXA_BADGES.map((badge) => badge.key)

export function getBadgesByRarity(rarity: BadgeRarity) {
  return NEXA_BADGES.filter((badge) => badge.rarity === rarity)
}

export function getProfileShowcaseBadges(keys: string[], limit = 8) {
  const keySet = new Set(keys)
  return NEXA_BADGES
    .filter((badge) => keySet.has(badge.key))
    .sort((a, b) => b.profilePriority - a.profilePriority || a.sortOrder - b.sortOrder)
    .slice(0, limit)
}

export function getBadgeCounts() {
  return NEXA_BADGES.reduce((acc, badge) => {
    acc[badge.rarity] = (acc[badge.rarity] || 0) + 1
    return acc
  }, {} as Record<BadgeRarity, number>)
}
