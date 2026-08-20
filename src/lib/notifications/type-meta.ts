import type { LucideIcon } from 'lucide-react'
import {
  Bell,
  Calendar,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Sword,
  Trophy,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react'

export type NotificationTypeMeta = {
  icon: LucideIcon
  emoji: string
  /** Warna aksen (bar kiri toast, background ikon) — dipakai biar tiap jenis notifikasi kebeda dari jauh, kaya notifikasi app besar (WA hijau, kalender biru, dst). */
  accent: string
  iconBg: string
  iconColor: string
}

const DEFAULT_META: NotificationTypeMeta = {
  icon: Bell,
  emoji: '📣',
  accent: 'bg-slate-400',
  iconBg: 'bg-slate-100',
  iconColor: 'text-slate-600',
}

export const NOTIFICATION_TYPE_META: Record<string, NotificationTypeMeta> = {
  deadline_reminder: { icon: Calendar, emoji: '🔔', accent: 'bg-blue-500', iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
  deadline_approaching: { icon: Calendar, emoji: '⏰', accent: 'bg-amber-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  friend_request: { icon: UserPlus, emoji: '👋', accent: 'bg-violet-500', iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  friend_accepted: { icon: Users, emoji: '🤝', accent: 'bg-violet-500', iconBg: 'bg-violet-50', iconColor: 'text-violet-600' },
  room_approved: { icon: ShieldCheck, emoji: '🚪', accent: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  direct_message: { icon: MessageCircle, emoji: '💬', accent: 'bg-sky-500', iconBg: 'bg-sky-50', iconColor: 'text-sky-600' },
  achievement: { icon: Trophy, emoji: '🏆', accent: 'bg-yellow-500', iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600' },
  badge_unlocked: { icon: Trophy, emoji: '🏆', accent: 'bg-yellow-500', iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600' },
  arena_application: { icon: Sword, emoji: '⚔️', accent: 'bg-rose-500', iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
  arena_application_accepted: { icon: ShieldCheck, emoji: '✅', accent: 'bg-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  arena_application_rejected: { icon: XCircle, emoji: '🛡️', accent: 'bg-slate-400', iconBg: 'bg-slate-100', iconColor: 'text-slate-500' },
  system: { icon: Sparkles, emoji: '📣', accent: 'bg-slate-400', iconBg: 'bg-slate-100', iconColor: 'text-slate-600' },
}

export function getNotificationMeta(type: string): NotificationTypeMeta {
  return NOTIFICATION_TYPE_META[type] ?? DEFAULT_META
}

/** Dipakai NotificationBell (emoji polos, list padat) — tetap dipertahankan biar konsisten dgn tampilan lama. */
export const typeIcon: Record<string, string> = Object.fromEntries(
  Object.entries(NOTIFICATION_TYPE_META).map(([key, meta]) => [key, meta.emoji])
)
