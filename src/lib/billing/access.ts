import type { BillingPlanId } from '@/lib/billing/plans'
import { BILLING_PLANS, normalizePlan } from '@/lib/billing/plans'

export type FeatureKey =
  | 'dashboard_basic'
  | 'deadline_basic'
  | 'deadline_unlimited'
  | 'quick_add_manual'
  | 'ai_quick_add'
  | 'ai_quick_add_save'
  | 'nexa_assistant_chat'
  | 'nexa_assistant_actions'
  | 'in_app_notifications'
  | 'telegram_notifications'
  | 'email_notifications'
  | 'custom_reminders'
  | 'weekly_summary'
  | 'study_room_join'
  | 'study_room_create'
  | 'study_room_voice_video'
  | 'friends_search'
  | 'friends_qr'
  | 'private_chat'
  | 'arena_view'
  | 'arena_join'
  | 'arena_create_team'
  | 'arena_team_leaderboard'
  | 'arena_competition_badges'
  | 'priority_support'

export type PlanFeature = FeatureKey

export type PlanLimits = {
  maxActiveDeadlines: number | null
  maxFriends: number | null
  assistantDailyLimit: number
  aiQuickAddDailyLimit: number
  canSaveAiDeadline: boolean
  reminderModes: string[]
  notificationChannels: Array<'in_app' | 'telegram' | 'email'>
  arenaMode: 'view_only' | 'join' | 'full_team'
  studyRoomMode: 'join' | 'create' | 'voice_video'
}

export type FeatureMeta = {
  key: FeatureKey
  label: string
  description: string
  minPlan: BillingPlanId
  category: 'assistant' | 'deadline' | 'notification' | 'social' | 'study_room' | 'arena' | 'support'
}

export const PLAN_RANK: Record<BillingPlanId, number> = {
  radar: 0,
  pulse: 1,
  command: 2,
}

export const PLAN_LIMITS: Record<BillingPlanId, PlanLimits> = {
  radar: {
    maxActiveDeadlines: 5,
    maxFriends: 10,
    assistantDailyLimit: 5,
    aiQuickAddDailyLimit: 0,
    canSaveAiDeadline: false,
    reminderModes: ['H-1', 'hari-H'],
    notificationChannels: ['in_app'],
    arenaMode: 'view_only',
    studyRoomMode: 'join',
  },
  pulse: {
    maxActiveDeadlines: null,
    maxFriends: 100,
    assistantDailyLimit: 30,
    aiQuickAddDailyLimit: 10,
    canSaveAiDeadline: true,
    reminderModes: ['H-1', 'hari-H'],
    notificationChannels: ['in_app', 'telegram'],
    arenaMode: 'join',
    studyRoomMode: 'create',
  },
  command: {
    maxActiveDeadlines: null,
    maxFriends: null,
    assistantDailyLimit: 100,
    aiQuickAddDailyLimit: 100,
    canSaveAiDeadline: true,
    reminderModes: ['H-7', 'H-3', 'H-1', 'hari-H', 'jam custom'],
    notificationChannels: ['in_app', 'telegram', 'email'],
    arenaMode: 'full_team',
    studyRoomMode: 'voice_video',
  },
}

export const FEATURE_META: Record<FeatureKey, FeatureMeta> = {
  dashboard_basic: {
    key: 'dashboard_basic',
    label: 'Dashboard akademik',
    description: 'Dashboard utama buat lihat kondisi akademik.',
    minPlan: 'radar',
    category: 'deadline',
  },
  deadline_basic: {
    key: 'deadline_basic',
    label: 'Deadline basic',
    description: 'Input dan kelola deadline dasar.',
    minPlan: 'radar',
    category: 'deadline',
  },
  deadline_unlimited: {
    key: 'deadline_unlimited',
    label: 'Unlimited deadline',
    description: 'Deadline aktif tanpa limit 5 item.',
    minPlan: 'pulse',
    category: 'deadline',
  },
  quick_add_manual: {
    key: 'quick_add_manual',
    label: 'Quick Add manual',
    description: 'Tambah deadline cepat tanpa AI.',
    minPlan: 'radar',
    category: 'deadline',
  },
  ai_quick_add: {
    key: 'ai_quick_add',
    label: 'AI Quick Add',
    description: 'Parse deadline dari kalimat bebas.',
    minPlan: 'pulse',
    category: 'assistant',
  },
  ai_quick_add_save: {
    key: 'ai_quick_add_save',
    label: 'AI save deadline',
    description: 'AI bisa langsung menyimpan deadline ke database.',
    minPlan: 'pulse',
    category: 'assistant',
  },
  nexa_assistant_chat: {
    key: 'nexa_assistant_chat',
    label: 'NEXA Assistant chat',
    description: 'Chat ke assistant akademik dengan limit harian per plan.',
    minPlan: 'radar',
    category: 'assistant',
  },
  nexa_assistant_actions: {
    key: 'nexa_assistant_actions',
    label: 'Assistant actions',
    description: 'Assistant bisa melakukan action seperti membuat reminder dan summary.',
    minPlan: 'command',
    category: 'assistant',
  },
  in_app_notifications: {
    key: 'in_app_notifications',
    label: 'In-app notification',
    description: 'Notifikasi di dalam web app.',
    minPlan: 'radar',
    category: 'notification',
  },
  telegram_notifications: {
    key: 'telegram_notifications',
    label: 'Telegram notification',
    description: 'Reminder dan summary lewat Telegram.',
    minPlan: 'pulse',
    category: 'notification',
  },
  email_notifications: {
    key: 'email_notifications',
    label: 'Gmail/email notification',
    description: 'Reminder dan weekly summary lewat email.',
    minPlan: 'command',
    category: 'notification',
  },
  custom_reminders: {
    key: 'custom_reminders',
    label: 'Custom reminder',
    description: 'Reminder H-7, H-3, H-1, hari-H, dan jam custom.',
    minPlan: 'command',
    category: 'notification',
  },
  weekly_summary: {
    key: 'weekly_summary',
    label: 'Weekly summary',
    description: 'Ringkasan deadline mingguan.',
    minPlan: 'pulse',
    category: 'notification',
  },
  study_room_join: {
    key: 'study_room_join',
    label: 'Join Study Room',
    description: 'Masuk ke study room basic.',
    minPlan: 'radar',
    category: 'study_room',
  },
  study_room_create: {
    key: 'study_room_create',
    label: 'Create Study Room',
    description: 'Buat room belajar sendiri.',
    minPlan: 'pulse',
    category: 'study_room',
  },
  study_room_voice_video: {
    key: 'study_room_voice_video',
    label: 'Voice/video call',
    description: 'Call Jitsi di Study Room.',
    minPlan: 'command',
    category: 'study_room',
  },
  friends_search: {
    key: 'friends_search',
    label: 'Tambah teman by NEXA ID',
    description: 'Cari dan tambah teman pakai nama atau NEXA ID.',
    minPlan: 'radar',
    category: 'social',
  },
  friends_qr: {
    key: 'friends_qr',
    label: 'Tambah teman QR code',
    description: 'Generate dan scan QR code untuk tambah teman.',
    minPlan: 'command',
    category: 'social',
  },
  private_chat: {
    key: 'private_chat',
    label: 'Private chat',
    description: 'Chat antar teman.',
    minPlan: 'pulse',
    category: 'social',
  },
  arena_view: {
    key: 'arena_view',
    label: 'View NEXA Arena',
    description: 'Lihat arena dan kompetisi publik.',
    minPlan: 'radar',
    category: 'arena',
  },
  arena_join: {
    key: 'arena_join',
    label: 'Join Arena',
    description: 'Ikut kompetisi di NEXA Arena.',
    minPlan: 'pulse',
    category: 'arena',
  },
  arena_create_team: {
    key: 'arena_create_team',
    label: 'Create Arena team',
    description: 'Buat tim untuk kompetisi.',
    minPlan: 'command',
    category: 'arena',
  },
  arena_team_leaderboard: {
    key: 'arena_team_leaderboard',
    label: 'Team leaderboard',
    description: 'Leaderboard tim dan statistik kompetisi.',
    minPlan: 'command',
    category: 'arena',
  },
  arena_competition_badges: {
    key: 'arena_competition_badges',
    label: 'Badge kompetisi',
    description: 'Badge kompetisi basic sampai eksklusif.',
    minPlan: 'pulse',
    category: 'arena',
  },
  priority_support: {
    key: 'priority_support',
    label: 'Priority support',
    description: 'Support prioritas buat Command.',
    minPlan: 'command',
    category: 'support',
  },
}

export const FEATURE_KEYS = Object.keys(FEATURE_META) as FeatureKey[]

export function isFeatureKey(value: unknown): value is FeatureKey {
  return typeof value === 'string' && value in FEATURE_META
}

export function requiredPlanForFeature(feature: FeatureKey): BillingPlanId {
  return FEATURE_META[feature].minPlan
}

export function canUseFeature(plan: string | null | undefined, feature: FeatureKey) {
  const currentPlan = normalizePlan(plan)
  const requiredPlan = requiredPlanForFeature(feature)
  return PLAN_RANK[currentPlan] >= PLAN_RANK[requiredPlan]
}

export function getPlanLimits(plan: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[normalizePlan(plan)]
}

export function getDailyLimit(plan: string | null | undefined, feature: FeatureKey): number | null {
  const normalized = normalizePlan(plan)
  const limits = PLAN_LIMITS[normalized]

  if (feature === 'nexa_assistant_chat') return limits.assistantDailyLimit
  if (feature === 'ai_quick_add' || feature === 'ai_quick_add_save') return limits.aiQuickAddDailyLimit

  return null
}

export function getUpgradePlan(feature: FeatureKey): BillingPlanId {
  return requiredPlanForFeature(feature)
}

export function upgradeMessage(feature: FeatureKey) {
  const meta = FEATURE_META[feature]
  const required = meta.minPlan
  if (required === 'pulse') {
    return `${meta.label} ada di NEXA Pulse. Upgrade dulu, jangan minta fitur premium sambil dompet mode stealth.`
  }
  if (required === 'command') {
    return `${meta.label} ada di NEXA Command. Ini sengaja dikunci biar AI lu nggak jadi pekerja rodi gratisan.`
  }
  return `${meta.label} tersedia untuk semua user.`
}

export function getPlanLabel(plan?: string | null) {
  return BILLING_PLANS[normalizePlan(plan)].name
}

export function resolveEffectivePlan(profile?: {
  plan?: string | null
  plan_status?: string | null
  plan_expires_at?: string | null
} | null): BillingPlanId {
  const plan = normalizePlan(profile?.plan)
  if (plan === 'radar') return 'radar'
  if (profile?.plan_status && profile.plan_status !== 'active') return 'radar'
  if (profile?.plan_expires_at && new Date(profile.plan_expires_at).getTime() < Date.now()) return 'radar'
  return plan
}
