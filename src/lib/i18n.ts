// Simple i18n system — ID (default), EN, ZH (Simplified Chinese)
export type Lang = 'id' | 'en' | 'zh'

export const LANG_LABELS: Record<Lang, string> = {
  id: '🇮🇩 Bahasa Indonesia',
  en: '🇬🇧 English',
  zh: '🇨🇳 中文 (简体)',
}

const strings = {
  // Navigation
  nav_dashboard:     { id: 'Dashboard',        en: 'Dashboard',       zh: '首页'       },
  nav_leaderboard:   { id: 'Leaderboard',       en: 'Leaderboard',     zh: '排行榜'     },
  nav_achievements:  { id: 'Pencapaian',        en: 'Achievements',    zh: '成就'       },
  nav_focus:         { id: 'Focus Mode',        en: 'Focus Mode',      zh: '专注模式'   },
  nav_study:         { id: 'Study Room',        en: 'Study Room',      zh: '学习室'     },
  nav_friends:       { id: 'Cari Teman',        en: 'Find Friends',    zh: '找朋友'     },
  nav_arena:         { id: 'NEXA Arena',        en: 'NEXA Arena',      zh: 'NEXA 竞技场' },
  nav_add_deadline:  { id: 'Tambah Deadline',   en: 'Add Deadline',    zh: '添加截止日' },
  nav_ai:            { id: 'AI Quick Add',      en: 'AI Quick Add',    zh: 'AI 快速添加' },
  nav_deadlines:     { id: 'Semua Deadline',    en: 'All Deadlines',   zh: '所有截止日' },
  nav_reminder:      { id: 'Reminder',          en: 'Reminder',        zh: '提醒'       },
  nav_profile:       { id: 'Profil',            en: 'Profile',         zh: '个人资料'   },
  nav_billing:       { id: 'Billing',           en: 'Billing',         zh: '账单'       },
  nav_settings:      { id: 'Pengaturan',        en: 'Settings',        zh: '设置'       },
  nav_support:       { id: 'Support',           en: 'Support',         zh: '支持'       },
  nav_admin:         { id: 'Admin Beta',        en: 'Admin Beta',      zh: '管理员'     },
  // Common actions
  save:              { id: 'Simpan',            en: 'Save',            zh: '保存'       },
  cancel:            { id: 'Batal',             en: 'Cancel',          zh: '取消'       },
  add:               { id: 'Tambah',            en: 'Add',             zh: '添加'       },
  delete_:           { id: 'Hapus',             en: 'Delete',          zh: '删除'       },
  edit:              { id: 'Edit',              en: 'Edit',            zh: '编辑'       },
  back:              { id: 'Kembali',           en: 'Back',            zh: '返回'       },
  close:             { id: 'Tutup',             en: 'Close',           zh: '关闭'       },
  search:            { id: 'Cari',              en: 'Search',          zh: '搜索'       },
  loading:           { id: 'Memuat...',         en: 'Loading...',      zh: '加载中...'  },
  // Auth
  login:             { id: 'Masuk',             en: 'Login',           zh: '登录'       },
  logout:            { id: 'Keluar',            en: 'Logout',          zh: '退出'       },
  register:          { id: 'Daftar',            en: 'Register',        zh: '注册'       },
  // Profile
  view_profile:      { id: 'Lihat Profil',      en: 'View Profile',    zh: '查看资料'   },
  edit_profile:      { id: 'Edit Profil',       en: 'Edit Profile',    zh: '编辑资料'   },
  language:          { id: 'Bahasa',            en: 'Language',        zh: '语言'       },
  // Deadline
  deadline:          { id: 'Deadline',          en: 'Deadline',        zh: '截止日期'   },
  add_deadline:      { id: 'Tambah Deadline',   en: 'Add Deadline',    zh: '添加截止日' },
  all_deadlines:     { id: 'Semua Deadline',    en: 'All Deadlines',   zh: '全部截止日' },
  pending:           { id: 'Pending',           en: 'Pending',         zh: '待处理'     },
  completed:         { id: 'Selesai',           en: 'Completed',       zh: '已完成'     },
  overdue:           { id: 'Terlambat',         en: 'Overdue',         zh: '已逾期'     },
  // Friend
  add_friend:        { id: 'Tambah Teman',      en: 'Add Friend',      zh: '添加好友'   },
  accept:            { id: 'Terima',            en: 'Accept',          zh: '接受'       },
  reject:            { id: 'Tolak',             en: 'Reject',          zh: '拒绝'       },
  // Settings
  settings_lang:     { id: 'Pilih Bahasa',      en: 'Choose Language', zh: '选择语言'   },
  // Arena
  arena_find_team:   { id: 'Cari Tim',          en: 'Find Team',       zh: '寻找队伍'   },
  arena_join:        { id: 'Lamar',             en: 'Apply',           zh: '申请加入'   },
  // Misc
  today:             { id: 'Hari Ini',          en: 'Today',           zh: '今天'       },
  this_week:         { id: 'Minggu Ini',        en: 'This Week',       zh: '本周'       },
  all_time:          { id: 'Semua Waktu',       en: 'All Time',        zh: '全部时间'   },
} as const

export type TranslationKey = keyof typeof strings

export function t(key: TranslationKey, lang: Lang = 'id'): string {
  return strings[key]?.[lang] ?? strings[key]?.['id'] ?? key
}

export function getLang(): Lang {
  if (typeof window === 'undefined') return 'id'
  return (localStorage.getItem('nexa_lang') as Lang) ?? 'id'
}

export function setLang(lang: Lang) {
  if (typeof window === 'undefined') return
  localStorage.setItem('nexa_lang', lang)
  window.dispatchEvent(new Event('nexa_lang_change'))
}
