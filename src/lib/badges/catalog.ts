export type BadgeRarity = 'biasa' | 'langka' | 'epic' | 'legend' | 'mythos'

export type NexaBadge = {
  key: string
  name: string
  description: string
  rarity: BadgeRarity
  category: 'deadline' | 'study_room' | 'arena' | 'social' | 'assistant' | 'founder'
  icon: string
  sortOrder: number
}

export const BADGE_RARITY_LABEL: Record<BadgeRarity, string> = {
  biasa: 'Biasa',
  langka: 'Langka',
  epic: 'Epic',
  legend: 'Legend',
  mythos: 'Mythos',
}

export const BADGE_RARITY_CLASS: Record<BadgeRarity, string> = {
  biasa: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200',
  langka: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200',
  epic: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200',
  legend: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200',
  mythos: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-400/10 dark:text-fuchsia-200',
}

export const NEXA_BADGES: NexaBadge[] = [
  { key: 'first_deadline', name: 'Deadline Pertama', description: 'Membuat deadline pertama di NEXA.', rarity: 'biasa', category: 'deadline', icon: 'CalendarCheck', sortOrder: 1 },
  { key: 'daily_planner', name: 'Daily Planner', description: 'Membuat 3 deadline dalam satu hari.', rarity: 'biasa', category: 'deadline', icon: 'ListTodo', sortOrder: 2 },
  { key: 'study_rookie', name: 'Study Rookie', description: 'Masuk Study Room pertama kali.', rarity: 'biasa', category: 'study_room', icon: 'Users', sortOrder: 3 },
  { key: 'new_friend', name: 'Teman Baru', description: 'Menambahkan teman pertama.', rarity: 'biasa', category: 'social', icon: 'UserPlus', sortOrder: 4 },
  { key: 'quick_add_tryout', name: 'Quick Add Tryout', description: 'Mencoba Quick Add pertama kali.', rarity: 'biasa', category: 'assistant', icon: 'Sparkles', sortOrder: 5 },
  { key: 'notification_ready', name: 'Notification Ready', description: 'Mengaktifkan notifikasi in-app.', rarity: 'biasa', category: 'deadline', icon: 'Bell', sortOrder: 6 },
  { key: 'profile_complete', name: 'Profil Rapi', description: 'Melengkapi profil akademik.', rarity: 'biasa', category: 'social', icon: 'BadgeCheck', sortOrder: 7 },
  { key: 'arena_spectator', name: 'Arena Spectator', description: 'Membuka NEXA Arena pertama kali.', rarity: 'biasa', category: 'arena', icon: 'Trophy', sortOrder: 8 },
  { key: 'focus_warmup', name: 'Focus Warmup', description: 'Mulai sesi fokus pertama.', rarity: 'biasa', category: 'deadline', icon: 'Timer', sortOrder: 9 },
  { key: 'campus_citizen', name: 'Campus Citizen', description: 'Aktif memakai NEXA Campus selama 3 hari.', rarity: 'biasa', category: 'founder', icon: 'GraduationCap', sortOrder: 10 },

  { key: 'deadline_slayer', name: 'Deadline Slayer', description: 'Menyelesaikan 10 deadline.', rarity: 'langka', category: 'deadline', icon: 'Sword', sortOrder: 11 },
  { key: 'telegram_linked', name: 'Telegram Linked', description: 'Menghubungkan Telegram reminder.', rarity: 'langka', category: 'deadline', icon: 'Send', sortOrder: 12 },
  { key: 'study_room_host', name: 'Room Host', description: 'Membuat Study Room sendiri.', rarity: 'langka', category: 'study_room', icon: 'Crown', sortOrder: 13 },
  { key: 'five_friends', name: 'Circle Builder', description: 'Punya 5 teman di NEXA.', rarity: 'langka', category: 'social', icon: 'UserRoundPlus', sortOrder: 14 },
  { key: 'weekly_summary_reader', name: 'Summary Reader', description: 'Membaca weekly summary pertama.', rarity: 'langka', category: 'assistant', icon: 'Newspaper', sortOrder: 15 },
  { key: 'arena_player', name: 'Arena Player', description: 'Join kompetisi Arena pertama.', rarity: 'langka', category: 'arena', icon: 'Medal', sortOrder: 16 },
  { key: 'no_panic_week', name: 'No Panic Week', description: 'Seminggu tanpa deadline telat.', rarity: 'langka', category: 'deadline', icon: 'ShieldCheck', sortOrder: 17 },

  { key: 'ai_scheduler', name: 'AI Scheduler', description: 'Membuat jadwal eksekusi pakai NEXA Assistant.', rarity: 'epic', category: 'assistant', icon: 'Bot', sortOrder: 18 },
  { key: 'voice_note_sender', name: 'Voice Note Sender', description: 'Mengirim voice note di Study Room.', rarity: 'epic', category: 'study_room', icon: 'Mic', sortOrder: 19 },
  { key: 'video_call_starter', name: 'Call Starter', description: 'Memulai voice/video call Study Room.', rarity: 'epic', category: 'study_room', icon: 'Video', sortOrder: 20 },
  { key: 'deadline_commander', name: 'Deadline Commander', description: 'Menyelesaikan 25 deadline.', rarity: 'epic', category: 'deadline', icon: 'BadgeCheck', sortOrder: 21 },
  { key: 'arena_badge_hunter', name: 'Badge Hunter', description: 'Mendapat 5 badge kompetisi.', rarity: 'epic', category: 'arena', icon: 'Award', sortOrder: 22 },
  { key: 'qr_connector', name: 'QR Connector', description: 'Menambah teman lewat QR code.', rarity: 'epic', category: 'social', icon: 'QrCode', sortOrder: 23 },

  { key: 'command_user', name: 'Command User', description: 'Mengaktifkan NEXA Command.', rarity: 'legend', category: 'founder', icon: 'Zap', sortOrder: 24 },
  { key: 'arena_team_captain', name: 'Team Captain', description: 'Membuat tim di NEXA Arena.', rarity: 'legend', category: 'arena', icon: 'Flag', sortOrder: 25 },
  { key: 'risk_scan_master', name: 'Risk Scan Master', description: 'Menjalankan risk scan deadline 10 kali.', rarity: 'legend', category: 'assistant', icon: 'Radar', sortOrder: 26 },
  { key: 'semester_survivor', name: 'Semester Survivor', description: 'Aktif 30 hari dan tidak telat deadline penting.', rarity: 'legend', category: 'deadline', icon: 'Flame', sortOrder: 27 },

  { key: 'founding_commander', name: 'Founding Commander', description: 'Badge eksklusif founding user Command.', rarity: 'mythos', category: 'founder', icon: 'Gem', sortOrder: 28 },
  { key: 'nexa_architect', name: 'NEXA Architect', description: 'Kontributor awal ekosistem NEXA Campus.', rarity: 'mythos', category: 'founder', icon: 'Network', sortOrder: 29 },
  { key: 'deadline_myth', name: 'Deadline Myth', description: 'Menyelesaikan 100 deadline tanpa telat kritis.', rarity: 'mythos', category: 'deadline', icon: 'Sparkle', sortOrder: 30 },
]
