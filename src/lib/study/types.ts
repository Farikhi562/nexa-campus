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
  createdAt: string
}

export type GenerateStudyPackResult =
  | { ok: true; pack: Omit<StudyPack, 'id' | 'createdAt' | 'quizBestScore' | 'quizAttempts'> }
  | { ok: false; error: string }
