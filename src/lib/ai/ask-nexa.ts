import 'server-only'
import { askGemini, type GeminiDeadlineContext, type ChatTurn } from '@/lib/ai/gemini'
import type { AiProvider } from '@/lib/ai/llm'

export type AskNexaResult = {
  answer: string
  provider: AiProvider | 'none'
  model: string
  status: 'success' | 'locked'
}

export async function askNexa(input: {
  question: string
  deadlines?: GeminiDeadlineContext[]
  userContext?: Record<string, unknown>
  history?: ChatTurn[]
}): Promise<AskNexaResult> {
  return askGemini(input)
}
