// ============================================================
// NEXA Campus Ecosystem — Shared TypeScript Types
// ============================================================

export type Plan = 'free' | 'basic' | 'pro' | 'admin'
export type DocStatus = 'pending' | 'processing' | 'completed' | 'error'
export type SessionStatus = 'in_progress' | 'completed'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  jurusan: string | null
  universitas: string | null
  provinsi: string | null
  plan: Plan
  seat_owner_id?: string | null
  weakness_analysis?: {
    weakTopics?: string[]
    patterns?: string[]
    recommendations?: string[]
    analyzedExamCount?: number
    updatedAt?: string
  } | null
  telegram_number: string | null
  telegram_chat_id: string | null
  profile_completed: boolean
  onboarding_completed: boolean
  badges: string[]
  is_public_profile: boolean
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  title: string
  file_path: string
  file_url: string | null
  status: DocStatus
  error_message: string | null
  question_count: number
  extracted_text?: string | null
  summary?: string | null
  priority?: number | null
  created_at: string
}

export interface QuestionOption {
  A: string
  B: string
  C: string
  D: string
}

export interface Question {
  id: string
  document_id: string
  user_id: string
  question_text: string
  options: QuestionOption
  correct_answer: 'A' | 'B' | 'C' | 'D'
  explanation: string | null
  order_index: number | null
  created_at: string
}

export interface ExamSession {
  id: string
  user_id: string
  document_id: string | null
  study_room_id: string | null
  score: number | null
  total_questions: number
  correct_count: number | null
  time_taken_seconds: number | null
  status: SessionStatus
  started_at: string
  completed_at: string | null
}

export interface SessionAnswer {
  id: string
  session_id: string
  question_id: string
  selected_answer: string | null
  is_correct: boolean | null
  created_at: string
}

export interface StudyRoom {
  id: string
  creator_id: string
  document_id: string | null
  room_code: string
  title: string
  is_private?: boolean
  room_password?: string | null
  max_members?: number | null
  banner_url?: string | null
  welcome_message?: string | null
  custom_name?: string | null
  is_active: boolean
  created_at: string
  expires_at: string
}

export interface RoomParticipant {
  id: string
  room_id: string
  user_id: string
  session_id: string | null
  joined_at: string
}

export interface Schedule {
  id: string
  user_id: string
  document_id: string | null
  subject_name: string
  exam_date: string
  exam_time: string | null
  telegram_chat_id: string | null
  reminder_sent_h3: boolean
  reminder_sent_h1: boolean
  reminder_sent_h0: boolean
  created_at: string
}

export interface LearningStreak {
  user_id: string
  date: string
  exams_completed: number
  avg_score: number
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'reminder' | 'exam_result' | 'badge_earned' | 'system'
  is_read: boolean
  created_at: string
}

export interface ExamSchedule {
  id: string
  user_id: string
  subject: string
  type: 'UTS' | 'UAS' | 'Quiz' | string
  exam_date: string
  room: string | null
  notes: string | null
  university: string | null
  is_public: boolean
  created_at: string
}

// ── Plan limits ──────────────────────────────────
export const PLAN_LIMITS: Record<Plan, {
  maxDocuments: number | null
  maxSessions: number | null
  canExportPDF: boolean
  canTelegram: boolean
  canStudyRoom: boolean
  canSellMarketplace: boolean
}> = {
  free:  { maxDocuments: 1,    maxSessions: 1,    canExportPDF: false, canTelegram: false, canStudyRoom: false, canSellMarketplace: false },
  basic: { maxDocuments: 5,    maxSessions: null, canExportPDF: true,  canTelegram: false, canStudyRoom: true,  canSellMarketplace: true  },
  pro:   { maxDocuments: null, maxSessions: null, canExportPDF: true,  canTelegram: true,  canStudyRoom: true,  canSellMarketplace: true  },
  admin: { maxDocuments: null, maxSessions: null, canExportPDF: true,  canTelegram: true,  canStudyRoom: true,  canSellMarketplace: true  },
}

// ── AI Processing types ──────────────────────────
export interface ExtractedQuestion {
  question_text: string
  options: QuestionOption
  correct_answer: 'A' | 'B' | 'C' | 'D'
  explanation?: string
}

export interface ProcessResult {
  success: boolean
  questions: ExtractedQuestion[]
  error?: string
}

// ── API Response wrappers ────────────────────────
export interface ApiSuccess<T> {
  data: T
  error?: never
}

export interface ApiError {
  data?: never
  error: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

// ── Exam state (client-side) ─────────────────────
export interface ClientAnswer {
  questionId: string
  selectedAnswer: string | null
}

export interface ExamResult {
  session: ExamSession
  answers: Array<SessionAnswer & { question: Question }>
}

// ── Leaderboard ──────────────────────────────────
export interface LeaderboardEntry {
  rank: number
  user_id: string
  full_name: string | null
  avatar_url: string | null
  university?: string | null
  streak?: number
  total_exams?: number
  score: number
  time_taken_seconds: number
  completed_at: string
}
