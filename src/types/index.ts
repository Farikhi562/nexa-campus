export type Plan = 'radar' | 'pulse' | 'command'

export type DeadlineType =
  | 'tugas'
  | 'praktikum'
  | 'kuis'
  | 'ujian'
  | 'presentasi'
  | 'administrasi'
  | 'pembayaran'
  | 'organisasi'
  | 'lainnya'

export type DeadlineSource =
  | 'vclass'
  | 'ilab'
  | 'dosen_langsung'
  | 'grup_wa'
  | 'praktikum'
  | 'studentsite'
  | 'baak'
  | 'lepkom'
  | 'lainnya'

export type DeadlineStatus = 'pending' | 'in_progress' | 'completed' | 'overdue'
export type DeadlinePriority = 'low' | 'normal' | 'high' | 'urgent'
export type ReminderChannel = 'telegram' | 'whatsapp'
export type SubscriptionIntentStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  campus_name: string | null
  province: string | null
  major: string | null
  semester: number | null
  gender: 'laki_laki' | 'perempuan' | 'lainnya' | 'tidak_ingin_menyebutkan' | null
  avatar_icon: string | null
  avatar_url: string | null
  student_id: string | null
  phone_number: string | null
  telegram_chat_id: string | null
  whatsapp_number: string | null
  plan: Plan
  referral_code: string | null
  pulse_trial_until: string | null
  profile_completed: boolean
  created_at: string
  updated_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  created_at: string
  rewarded: boolean
}

export interface AcademicDeadline {
  id: string
  user_id: string
  title: string | null
  course_name: string
  type: DeadlineType
  source: DeadlineSource
  deadline_date: string
  deadline_time: string
  campus: string
  room: string
  location_note: string | null
  notes: string | null
  status: DeadlineStatus
  priority: DeadlinePriority
  reminder_enabled: boolean
  created_at: string
  updated_at: string
}

export interface ReminderPreferences {
  id: string
  user_id: string
  channel: ReminderChannel
  h7_enabled: boolean
  h3_enabled: boolean
  h1_enabled: boolean
  day_enabled: boolean
  reminder_time: string
  created_at: string
  updated_at: string
}

export interface SubscriptionIntent {
  id: string
  user_id: string
  requested_plan: Exclude<Plan, 'radar'>
  status: SubscriptionIntentStatus
  payment_method: 'manual_transfer' | 'qris'
  contact_note: string | null
  created_at: string
  updated_at: string
}
