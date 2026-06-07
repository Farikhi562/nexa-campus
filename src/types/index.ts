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
  nexa_id: string | null
  pulse_trial_until: string | null
  is_public_profile: boolean | null
  badges: string[] | null
  profile_completed: boolean
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  user_id: string
  display_name: string | null
  avatar_url: string | null
  campus_name: string | null
  plan: Plan
  points: number
  rank: number
}

export interface LeaderboardMe {
  points: number
  rank: number | null
  total_players: number
  current_streak: number
  is_public: boolean
}

export type LeaderboardScope = 'weekly' | 'monthly' | 'all_time'

// ---------- Study Room -------------------------------------------------------
export type StudyRoomCategory =
  | 'umum' | 'matematika' | 'fisika' | 'kimia' | 'biologi'
  | 'informatika' | 'ekonomi' | 'hukum' | 'kedokteran' | 'bahasa' | 'seni' | 'lainnya'

export type RoomMemberRole = 'owner' | 'admin' | 'moderator' | 'member'

export interface StudyRoom {
  id: string
  owner_id: string
  room_code: string
  title: string
  description: string | null
  topic: string | null
  category: StudyRoomCategory
  cover_url: string | null
  max_members: number
  current_members_count: number
  status: 'open' | 'full' | 'closed'
  visibility: 'public' | 'private'
  scheduled_at: string | null
  created_at: string
  updated_at: string
  owner_name?: string | null
  is_member?: boolean
  member_role?: RoomMemberRole | null
  has_pending_request?: boolean
}

export interface StudyRoomMember {
  id: string
  room_id: string
  user_id: string
  role: RoomMemberRole
  joined_at: string
  profile?: PublicProfile | null
}

export interface StudyRoomJoinRequest {
  id: string
  room_id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  message: string | null
  created_at: string
  updated_at: string
  user?: PublicProfile | null
}

export interface StudyRoomMessage {
  id: string
  room_id: string
  sender_id: string
  content: string | null
  message_type: 'text' | 'image' | 'file'
  attachment_path: string | null
  attachment_name: string | null
  attachment_size: number | null
  attachment_mime: string | null
  created_at: string
  sender?: PublicProfile | null
}

// ---------- Friends ----------------------------------------------------------
export interface PublicProfile {
  id: string
  full_name: string | null
  campus_name: string | null
  major: string | null
  avatar_url: string | null
  plan: Plan
  nexa_id: string | null
  created_at: string
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface FriendRequest {
  id: string
  requester_id: string
  receiver_id: string
  status: FriendRequestStatus
  created_at: string
  updated_at: string
  other_user?: PublicProfile | null
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
