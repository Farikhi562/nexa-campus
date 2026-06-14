import {
  Award, BellRing, Bot, CalendarDays, CreditCard, HelpCircle, Home,
  Plus, Rocket, Settings, ShieldCheck, Sparkles, Sword, Timer,
  Trophy, UserRound, Users,
} from 'lucide-react'
import { BRAND } from '@/lib/brand'

export type NavItem = {
  label: string; href: string; icon: typeof Home; hot?: boolean; soon?: boolean
}

export const DASHBOARD_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: Home },
  { label: 'NEXA Assistant', href: '/dashboard/nexa-assistant', icon: Bot, hot: true },
  { label: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy, hot: true },
  { label: 'Pencapaian', href: '/dashboard/achievements', icon: Award, hot: true },
  { label: 'Focus Mode', href: '/dashboard/focus', icon: Timer, hot: true },
  { label: 'NEXA Arena', href: '/dashboard/arena', icon: Sword, hot: true },
  { label: 'Study Room', href: '/dashboard/study-room', icon: Users },
  { label: 'Cari Teman', href: '/dashboard/friends', icon: UserRound },
  { label: 'Notifikasi', href: '/dashboard/notifications', icon: BellRing },
  { label: 'Tambah Deadline', href: '/dashboard/deadlines/new', icon: Plus },
  { label: 'AI Quick Add', href: '/dashboard/deadlines/quick-add', icon: Sparkles },
  { label: 'Semua Deadline', href: '/dashboard/deadlines', icon: CalendarDays },
  { label: 'Reminder', href: '/dashboard/settings/reminders', icon: BellRing },
  { label: 'Profil', href: '/dashboard/settings/profile', icon: UserRound },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Pengaturan', href: '/dashboard/settings', icon: Settings },
  { label: 'Support', href: '/support', icon: HelpCircle },
  { label: `Release v${BRAND.version}`, href: '/release-notes', icon: Rocket },
  { label: 'Admin', href: '/admin', icon: ShieldCheck },
]
