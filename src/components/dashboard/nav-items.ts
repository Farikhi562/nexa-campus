import {
  Award, BellRing, Bot, CalendarDays, CreditCard, HelpCircle, Home,
  Plus, Rocket, Settings, ShieldCheck, Sparkles, Sword, Timer,
  Trophy, UserRound, Users,
} from 'lucide-react'
import { BRAND } from '@/lib/brand'
import type { TranslationKey } from '@/components/LanguageProvider'

export type NavItem = {
  /** Fallback Bahasa Indonesia (dipakai kalau labelKey tidak ada, mis. untuk metadata non-React). */
  label: string
  /** Kunci terjemahan — ini yang dipakai semua komponen nav untuk render label sebenarnya. */
  labelKey: TranslationKey
  href: string
  icon: typeof Home
  hot?: boolean
  soon?: boolean
  /** hanya untuk pengguna NEXA Command */
  command?: boolean
  /** kalau true, consumer menambahkan " v{BRAND.version}" setelah label terjemahan */
  versioned?: boolean
}

export const DASHBOARD_NAV: NavItem[] = [
  { label: 'Dashboard', labelKey: 'nav_dashboard', href: '/dashboard', icon: Home },
  { label: 'NEXA Assistant', labelKey: 'nav_assistant', href: '/dashboard/nexa-assistant', icon: Bot, hot: true, command: true },
  { label: 'Leaderboard', labelKey: 'nav_leaderboard', href: '/dashboard/leaderboard', icon: Trophy, hot: true },
  { label: 'Pencapaian', labelKey: 'nav_achievements', href: '/dashboard/achievements', icon: Award, hot: true },
  { label: 'Focus Mode', labelKey: 'nav_focus', href: '/dashboard/focus', icon: Timer, hot: true },
  { label: 'NEXA Arena', labelKey: 'nav_arena', href: '/dashboard/arena', icon: Sword, hot: true },
  { label: 'Study Room', labelKey: 'nav_study', href: '/dashboard/study-room', icon: Users },
  { label: 'Cari Teman', labelKey: 'nav_friends', href: '/dashboard/friends', icon: UserRound },
  { label: 'Notifikasi', labelKey: 'nav_notifications', href: '/dashboard/notifications', icon: BellRing },
  { label: 'Tambah Deadline', labelKey: 'nav_add_deadline', href: '/dashboard/deadlines/new', icon: Plus },
  { label: 'AI Quick Add', labelKey: 'nav_ai', href: '/dashboard/deadlines/quick-add', icon: Sparkles },
  { label: 'Semua Deadline', labelKey: 'nav_deadlines', href: '/dashboard/deadlines', icon: CalendarDays },
  { label: 'Reminder', labelKey: 'nav_reminder', href: '/dashboard/settings/reminders', icon: BellRing },
  { label: 'Profil', labelKey: 'nav_profile', href: '/dashboard/settings/profile', icon: UserRound },
  { label: 'Billing', labelKey: 'nav_billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Pengaturan', labelKey: 'nav_settings', href: '/dashboard/settings', icon: Settings },
  { label: 'Support', labelKey: 'nav_support', href: '/support', icon: HelpCircle },
  { label: `Rilis v${BRAND.version}`, labelKey: 'nav_release', href: '/release-notes', icon: Rocket, versioned: true },
  { label: 'Admin', labelKey: 'nav_admin', href: '/admin', icon: ShieldCheck },
]
