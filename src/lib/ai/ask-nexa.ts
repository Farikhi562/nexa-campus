import 'server-only'
import { askGemini, type GeminiDeadlineContext } from '@/lib/ai/gemini'

export type AskNexaResult =
  | {
      answer: string
      provider: 'gemini'
      model: string
      status: 'success'
    }
  | {
      answer: string
      provider: 'none'
      model: string
      status: 'locked'
    }

export async function askNexa(input: {
  question: string
  deadlines?: GeminiDeadlineContext[]
  userContext?: Record<string, unknown>
}): Promise<AskNexaResult> {
  return askGemini(input)
}
