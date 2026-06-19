'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Lang = 'id' | 'en' | 'zh'

export const LANG_LABELS: Record<Lang, string> = {
  id: '🇮🇩 Bahasa Indonesia',
  en: '🇬🇧 English',
  zh: '🇨🇳 中文 (简体)',
}

const STRINGS = {
  // Navigation
  nav_dashboard:     { id: 'Dashboard',        en: 'Dashboard',       zh: '首页'       },
  nav_leaderboard:   { id: 'Leaderboard',       en: 'Leaderboard',     zh: '排行榜'     },
  nav_achievements:  { id: 'Pencapaian',        en: 'Achievements',    zh: '成就'       },
  nav_focus:         { id: 'Focus Mode',        en: 'Focus Mode',      zh: '专注模式'   },
  nav_study:         { id: 'Study Room',        en: 'Study Room',      zh: '学习室'     },
  nav_friends:       { id: 'Cari Teman',        en: 'Find Friends',    zh: '找朋友'     },
  nav_arena:         { id: 'NEXA Arena',        en: 'NEXA Arena',      zh: 'NEXA 竞技场' },
  nav_assistant:     { id: 'NEXA Assistant',    en: 'NEXA Assistant',  zh: 'NEXA 助手'  },
  nav_notifications: { id: 'Notifikasi',        en: 'Notifications',   zh: '通知'       },
  nav_add_deadline:  { id: 'Tambah Deadline',   en: 'Add Deadline',    zh: '添加截止日' },
  nav_ai:            { id: 'AI Quick Add',      en: 'AI Quick Add',    zh: 'AI 快速添加' },
  nav_deadlines:     { id: 'Semua Deadline',    en: 'All Deadlines',   zh: '所有截止日' },
  nav_reminder:      { id: 'Reminder',          en: 'Reminder',        zh: '提醒'       },
  nav_profile:       { id: 'Profil',            en: 'Profile',         zh: '个人资料'   },
  nav_billing:       { id: 'Billing',           en: 'Billing',         zh: '账单'       },
  nav_settings:      { id: 'Pengaturan',        en: 'Settings',        zh: '设置'       },
  nav_support:       { id: 'Support',           en: 'Support',         zh: '支持'       },
  nav_release:       { id: 'Rilis',             en: 'Release',         zh: '版本'       },
  nav_admin:         { id: 'Admin',             en: 'Admin',           zh: '管理员'     },

  // Bottom nav (label pendek, ruang sempit di 5 kolom)
  bottom_home:       { id: 'Home',              en: 'Home',            zh: '首页'       },
  bottom_arena:      { id: 'Arena',             en: 'Arena',           zh: '竞技场'     },
  bottom_friends:    { id: 'Teman',             en: 'Friends',         zh: '好友'       },
  bottom_study:      { id: 'Study',             en: 'Study',           zh: '学习'       },
  bottom_add:        { id: 'Tambah',            en: 'Add',             zh: '添加'       },

  // Section headers (sidebar / hamburger menu)
  section_navigation:{ id: 'Navigasi',          en: 'Navigation',      zh: '导航'       },
  section_main:      { id: 'Fitur Utama',       en: 'Main Features',   zh: '主要功能'   },
  section_all:       { id: 'Semua Halaman',     en: 'All Pages',       zh: '所有页面'   },

  // Badge kecil di item nav
  badge_new:         { id: 'Baru',              en: 'New',             zh: '新'         },
  badge_soon:        { id: 'Segera',            en: 'Soon',            zh: '即将推出'   },
  badge_command:     { id: 'Command',           en: 'Command',         zh: 'Command'    },

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

export type TranslationKey = keyof typeof STRINGS

type LanguageContextType = {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: TranslationKey) => string
}

const STORAGE_KEY = 'nexa_lang'
const LANG_CHANGE_EVENT = 'nexa_lang_change'
const FALLBACK_LANG: Lang = 'id'
const SUPPORTED_LANGS: Lang[] = ['id', 'en', 'zh']

function isSupportedLang(value: unknown): value is Lang {
  return typeof value === 'string' && SUPPORTED_LANGS.includes(value as Lang)
}

function readStoredLang(): Lang {
  if (typeof window === 'undefined') return FALLBACK_LANG

  const storedLang = window.localStorage.getItem(STORAGE_KEY)
  return isSupportedLang(storedLang) ? storedLang : FALLBACK_LANG
}

function writeStoredLang(nextLang: Lang) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(STORAGE_KEY, nextLang)
  window.dispatchEvent(new Event(LANG_CHANGE_EVENT))
}

export function translate(key: TranslationKey, lang: Lang = FALLBACK_LANG): string {
  const row = STRINGS[key]
  return row?.[lang] ?? row?.[FALLBACK_LANG] ?? key
}

const LanguageContext = createContext<LanguageContextType>({
  lang: FALLBACK_LANG,
  setLang: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(FALLBACK_LANG)

  useEffect(() => {
    setLangState(readStoredLang())

    const handler = () => setLangState(readStoredLang())

    window.addEventListener(LANG_CHANGE_EVENT, handler)
    window.addEventListener('storage', handler)

    return () => {
      window.removeEventListener(LANG_CHANGE_EVENT, handler)
      window.removeEventListener('storage', handler)
    }
  }, [])

  const setLang = useCallback((newLang: Lang) => {
    const safeLang = isSupportedLang(newLang) ? newLang : FALLBACK_LANG
    writeStoredLang(safeLang)
    setLangState(safeLang)
  }, [])

  const tFn = useCallback((key: TranslationKey) => translate(key, lang), [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: tFn }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useT() {
  return useContext(LanguageContext)
}
