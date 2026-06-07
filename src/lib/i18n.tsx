'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Lang = 'id' | 'en' | 'zh'

export const translations = {
  id: {
    // Nav
    dashboard: 'Dashboard',
    leaderboard: 'Leaderboard',
    achievements: 'Pencapaian',
    focusMode: 'Focus Mode',
    studyRoom: 'Study Room',
    findFriends: 'Cari Teman',
    addDeadline: 'Tambah Deadline',
    aiQuickAdd: 'AI Quick Add',
    allDeadlines: 'Semua Deadline',
    reminder: 'Reminder',
    profile: 'Profil',
    billing: 'Billing',
    settings: 'Pengaturan',
    support: 'Support',
    logout: 'Logout',
    // Common
    save: 'Simpan',
    cancel: 'Batal',
    delete: 'Hapus',
    loading: 'Memuat...',
    saving: 'Menyimpan...',
    error: 'Terjadi kesalahan',
    success: 'Berhasil!',
    // Deadline
    addDeadlineTitle: 'Tambah Deadline',
    editDeadlineTitle: 'Edit Deadline',
    // Streak
    streakActive: 'Streak aktif',
    streakDays: 'hari berturut-turut',
    streakDead: 'Streak mati',
    // Language
    language: 'Bahasa',
    // Badge
    badgeDisplay: 'Badge yang Ditampilkan',
    selectBadge: 'Pilih badge',
    // Leaderboard
    liveNow: '🔴 Live',
    rank: 'Rank',
    points: 'poin',
    // Achievements
    earned: 'Diraih',
    locked: 'Terkunci',
  },
  en: {
    dashboard: 'Dashboard',
    leaderboard: 'Leaderboard',
    achievements: 'Achievements',
    focusMode: 'Focus Mode',
    studyRoom: 'Study Room',
    findFriends: 'Find Friends',
    addDeadline: 'Add Deadline',
    aiQuickAdd: 'AI Quick Add',
    allDeadlines: 'All Deadlines',
    reminder: 'Reminder',
    profile: 'Profile',
    billing: 'Billing',
    settings: 'Settings',
    support: 'Support',
    logout: 'Logout',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    loading: 'Loading...',
    saving: 'Saving...',
    error: 'An error occurred',
    success: 'Success!',
    addDeadlineTitle: 'Add Deadline',
    editDeadlineTitle: 'Edit Deadline',
    streakActive: 'Active streak',
    streakDays: 'days in a row',
    streakDead: 'Streak lost',
    language: 'Language',
    badgeDisplay: 'Display Badges',
    selectBadge: 'Select badge',
    liveNow: '🔴 Live',
    rank: 'Rank',
    points: 'pts',
    earned: 'Earned',
    locked: 'Locked',
  },
  zh: {
    dashboard: '主页',
    leaderboard: '排行榜',
    achievements: '成就',
    focusMode: '专注模式',
    studyRoom: '学习室',
    findFriends: '找朋友',
    addDeadline: '添加截止日期',
    aiQuickAdd: 'AI 快速添加',
    allDeadlines: '所有截止日期',
    reminder: '提醒',
    profile: '个人资料',
    billing: '账单',
    settings: '设置',
    support: '支持',
    logout: '退出',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    loading: '加载中...',
    saving: '保存中...',
    error: '发生错误',
    success: '成功！',
    addDeadlineTitle: '添加截止日期',
    editDeadlineTitle: '编辑截止日期',
    streakActive: '连续打卡中',
    streakDays: '天连续',
    streakDead: '连续中断',
    language: '语言',
    badgeDisplay: '展示徽章',
    selectBadge: '选择徽章',
    liveNow: '🔴 实时',
    rank: '排名',
    points: '积分',
    earned: '已获得',
    locked: '未解锁',
  },
} satisfies Record<Lang, Record<string, string>>

type T = typeof translations.id

const LangCtx = createContext<{ lang: Lang; t: T; setLang: (l: Lang) => void }>({
  lang: 'id',
  t: translations.id,
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('id')

  useEffect(() => {
    const saved = localStorage.getItem('nexa_lang') as Lang | null
    if (saved && translations[saved]) setLangState(saved)
  }, [])

  function setLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('nexa_lang', l)
  }

  return (
    <LangCtx.Provider value={{ lang, t: translations[lang], setLang }}>
      {children}
    </LangCtx.Provider>
  )
}

export function useLang() {
  return useContext(LangCtx)
}
