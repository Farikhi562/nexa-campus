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
  whatsapp_number: string | null
  profile_completed: boolean
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
  whatsapp_number: string
  reminder_sent_h3: boolean
  reminder_sent_h1: boolean
  reminder_sent_h0: boolean
  created_at: string
}

// ── Plan limits ──────────────────────────────────
export const PLAN_LIMITS: Record<Plan, {
  maxDocuments: number | null
  maxSessions: number | null
  canExportPDF: boolean
  canWhatsApp: boolean
  canStudyRoom: boolean
  canSellMarketplace: boolean
}> = {
  free:  { maxDocuments: 1,    maxSessions: 1,    canExportPDF: false, canWhatsApp: false, canStudyRoom: false, canSellMarketplace: false },
  basic: { maxDocuments: 5,    maxSessions: null, canExportPDF: true,  canWhatsApp: false, canStudyRoom: false, canSellMarketplace: true  },
  pro:   { maxDocuments: null, maxSessions: null, canExportPDF: true,  canWhatsApp: true,  canStudyRoom: true,  canSellMarketplace: true  },
  admin: { maxDocuments: null, maxSessions: null, canExportPDF: true,  canWhatsApp: true,  canStudyRoom: true,  canSellMarketplace: true  },
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
  score: number
  time_taken_seconds: number
  completed_at: string
}
