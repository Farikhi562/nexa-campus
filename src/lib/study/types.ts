/**
 * Shared types untuk fitur Belajar (Batch 23).
 * - FeynmanFeedback / FeynmanSession  — mode Feynman
 * - StudyStep / StudyPlan             — rencana belajar bertimer
 * - ChecklistItem                     — checklist per pack
 * - WeakArea / DiagnoseResult         — analisis kelemahan
 */

// ─── Feynman ──────────────────────────────────────────────────────────────────

/** Umpan balik AI setelah user menjelaskan sebuah konsep. */
export type FeynmanFeedback = {
  /** 0–100; comprehension score */
  score: number
  /** Hal yang sudah dipahami dengan benar */
  right: string[]
  /** Poin penting yang terlewat */
  gaps: string[]
  /** Miskonsepsi atau pernyataan yang salah (bisa kosong []) */
  wrong: string[]
  /** Satu saran spesifik untuk belajar lebih lanjut */
  tip: string
}

export type FeynmanSession = {
  id: string
  user_id: string
  pack_id: string | null
  concept: string
  user_explanation: string
  score: number
  feedback: FeynmanFeedback
  created_at: string
}

// ─── Study Plan ───────────────────────────────────────────────────────────────

export type StudyStepType = 'read' | 'watch' | 'practice' | 'quiz' | 'review' | 'write' | 'rest'

export type StudyStep = {
  /** Client-generated stable ID, e.g. "s1", "s2" */
  id: string
  title: string
  description: string
  type: StudyStepType
  /** Estimasi durasi dalam menit */
  duration_minutes: number
}

export type StudyPlan = {
  steps: StudyStep[]
  /** Total menit semua langkah */
  total_minutes: number
  /** ISO timestamp kapan plan ini dibuat */
  created_at: string
}

// ─── Checklist ────────────────────────────────────────────────────────────────

export type ChecklistItem = {
  id: string
  text: string
  done: boolean
  /** Urutan tampil, ascending */
  order: number
}

// ─── Diagnosis (Analisis Kelemahan) ──────────────────────────────────────────

export type WeakReason =
  | 'low_score'      // best_score < 60% dari total soal
  | 'no_attempts'    // belum pernah quiz sama sekali
  | 'stale'          // terakhir dikerjakan > 14 hari tapi belum 100%

export type WeakArea = {
  pack_id: string
  topic: string
  score_ratio: number     // best_score / quiz_total (0–1), NaN kalau no_attempts
  attempts: number
  quiz_total: number
  quiz_last_wrong: number[] // indeks soal salah terakhir
  reason: WeakReason
}

export type DiagnoseResult = {
  weak_areas: WeakArea[]
  strong_areas: Array<{ pack_id: string; topic: string; score_ratio: number }>
  total_packs: number
  /** Saran spesifik dari AI, null kalau AI tidak aktif / tidak ada data */
  ai_advice: string | null
}

// ─── Roadmap (inferred, agar types bisa dipakai tanpa import circular) ────────

/** Struktur satu langkah roadmap yang disimpan generate-study-pack */
export type RoadmapStep = {
  title: string
  description?: string
  order?: number
}

/** Satu soal kuis yang disimpan di kolom quiz */
export type QuizQuestion = {
  question: string
  options: string[]
  correct_index: number
  explanation?: string
}

// ─── Study Pack — generated content shapes ────────────────────────────────────
// These were previously exported from this file; re-added to fix imports across
// StudyRoadmapView, StudyTabsClient, StudyQuizView, PracticeView, page.tsx,
// generate-study-pack.ts.

/** Satu langkah roadmap yang dihasilkan AI dan disimpan di kolom study_packs.roadmap */
export type StudyRoadmapStep = {
  step: number
  title: string
  description: string
  estimatedMinutes: number
}

/** Satu soal kuis yang dihasilkan AI dan disimpan di kolom study_packs.quiz */
export type StudyQuizQuestion = {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

/** Return type dari generateStudyPack() */
export type GenerateStudyPackResult =
  | { ok: false; error: string }
  | {
      ok: true
      pack: {
        topic: string
        sourceFilename: string | null
        sourceType: string
        roadmap: StudyRoadmapStep[]
        summary: string
        quiz: StudyQuizQuestion[]
      }
    }

// ─── Flashcard (Leitner system) ───────────────────────────────────────────────

/** Satu kartu flashcard yang dihasilkan AI */
export type Flashcard = {
  front: string
  back: string
}

/**
 * Progress Leitner per kartu, key = index kartu (string).
 * 1 = belum tahu, 2 = agak tahu, 3 = sudah tahu.
 */
export type FlashcardBoxes = Record<string, 1 | 2 | 3>
