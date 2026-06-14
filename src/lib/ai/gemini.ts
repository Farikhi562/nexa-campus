import 'server-only'
import { generateText, activeProviderInfo, aiConfigured, LlmFailure, type AiProvider } from '@/lib/ai/llm'

// Dipertahankan untuk kompatibilitas import lama.
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite'

export const TANYA_NEXA_SYSTEM_INSTRUCTION =
  'You are Tanya NEXA, an academic productivity assistant for NEXA Campus. Help students organize deadlines, prioritize tasks, and understand their academic workload. Do not pretend to access campus systems. Only use manually provided data. Be concise, practical, and safe. If data is missing, ask the user to add the deadline manually. Do not provide legal, medical, or harmful advice. Answer in Indonesian by default.'

export type GeminiDeadlineContext = {
  title?: string | null
  course?: string | null
  type?: string | null
  source?: string | null
  due_date?: string | null
  due_time?: string | null
  priority?: string | null
  status?: string | null
  reminder_enabled?: boolean | null
}

type AskGeminiInput = {
  question: string
  deadlines?: GeminiDeadlineContext[]
  userContext?: Record<string, unknown>
}

export type AskGeminiResult = {
  answer: string
  provider: AiProvider | 'none'
  model: string
  status: 'success' | 'locked'
}

function buildPrompt({ question, deadlines = [], userContext }: AskGeminiInput) {
  const context = {
    userContext: userContext ?? null,
    deadlines: deadlines.slice(0, 30),
    rules: [
      'NEXA tidak mengambil data dari sistem kampus.',
      'NEXA hanya membaca deadline yang dimasukkan pengguna secara manual.',
      'Jawaban AI membantu menyusun prioritas, tetapi keputusan akhir tetap ada pada pengguna.',
    ],
  }

  return [
    `Pertanyaan pengguna: ${question}`,
    '',
    'Konteks deadline manual dari NEXA Campus:',
    JSON.stringify(context, null, 2),
  ].join('\n')
}

export async function askGemini(input: AskGeminiInput): Promise<AskGeminiResult> {
  if (!aiConfigured()) {
    const info = activeProviderInfo()
    return {
      answer: 'Fitur AI belum aktif. Kamu tetap bisa mencatat dan mengelola deadline secara manual.',
      provider: 'none',
      model: info.textModel,
      status: 'locked',
    }
  }

  try {
    const { text, provider, model } = await generateText({
      system: TANYA_NEXA_SYSTEM_INSTRUCTION,
      user: buildPrompt(input),
      temperature: 0.35,
      maxTokens: 500,
    })
    return { answer: text, provider, model, status: 'success' }
  } catch (err) {
    if (err instanceof LlmFailure && err.info.code === 'not_configured') {
      const info = activeProviderInfo()
      return {
        answer: 'Fitur AI belum aktif. Kamu tetap bisa mencatat dan mengelola deadline secara manual.',
        provider: 'none',
        model: info.textModel,
        status: 'locked',
      }
    }
    throw err
  }
}
