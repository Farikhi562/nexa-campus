export type StudyRoadmapStep = {
  step: number
  title: string
  description: string
  estimatedMinutes: number
}

export type StudyQuizQuestion = {
  question: string
  options: string[] // selalu 4
  correctIndex: number // 0-3
  explanation: string
}

export type Flashcard = {
  front: string // pertanyaan / istilah
  back: string  // jawaban / definisi singkat
}

/** Leitner box: 1=belum tahu, 2=agak tahu, 3=sudah tahu */
export type FlashcardBoxes = Record<string, 1 | 2 | 3>

export type StudyPack = {
  id: string
  topic: string
  sourceFilename: string | null
  sourceType: 'file' | 'text'
  roadmap: StudyRoadmapStep[]
  summary: string
  quiz: StudyQuizQuestion[]
  quizBestScore: number | null
  quizAttempts: number
  flashcards: Flashcard[]
  flashcardBoxes: FlashcardBoxes
  createdAt: string
}

export type GenerateStudyPackResult =
  | { ok: true; pack: Omit<StudyPack, 'id' | 'createdAt' | 'quizBestScore' | 'quizAttempts' | 'flashcards' | 'flashcardBoxes'> }
  | { ok: false; error: string }
