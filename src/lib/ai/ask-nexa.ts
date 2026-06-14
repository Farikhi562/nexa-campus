import 'server-only'
import { askGemini, type GeminiDeadlineContext } from '@/lib/ai/gemini'
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
}): Promise<AskNexaResult> {
  return askGemini(input)
}
