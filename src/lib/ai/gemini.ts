import 'server-only'
import { generateText, activeProviderInfo, aiConfigured, LlmFailure, type AiProvider } from '@/lib/ai/llm'

// Dipertahankan untuk kompatibilitas import lama.
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash-lite'

export const NEXA_ASSISTANT_SYSTEM_INSTRUCTION =
  'You are NEXA Assistant, a friendly academic productivity chatbot for NEXA Campus. Help students organize deadlines, prioritize tasks, plan study sessions, and stay motivated. Do not pretend to access campus systems. Only use manually provided data. Be concise, warm, and practical. If data is missing, ask the user to add the deadline manually. Do not provide legal, medical, or harmful advice. Answer in Indonesian by default, but match the user\'s language if they switch.'

// Alias lama supaya import lama tidak rusak.
export const TANYA_NEXA_SYSTEM_INSTRUCTION = NEXA_ASSISTANT_SYSTEM_INSTRUCTION

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

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

type AskGeminiInput = {
  question: string
  deadlines?: GeminiDeadlineContext[]
  userContext?: Record<string, unknown>
  history?: ChatTurn[]
}

export type AskGeminiResult = {
  answer: string
  provider: AiProvider | 'none'
  model: string
  status: 'success' | 'locked'
}

function buildPrompt({ question, deadlines = [], userContext, history = [] }: AskGeminiInput) {
  const context = {
    userContext: userContext ?? null,
    deadlines: deadlines.slice(0, 30),
    rules: [
      'NEXA tidak mengambil data dari sistem kampus.',
      'NEXA hanya membaca deadline yang dimasukkan pengguna secara manual.',
      'Jawaban AI membantu menyusun prioritas, tetapi keputusan akhir tetap ada pada pengguna.',
    ],
  }

  // Sisipkan ringkasan percakapan sebelumnya agar chatbot punya konteks (multi-turn).
  const recent = history.slice(-8)
  const transcript = recent.length
    ? recent.map((t) => `${t.role === 'user' ? 'Pengguna' : 'NEXA Assistant'}: ${t.content}`).join('\n')
    : '(belum ada percakapan sebelumnya)'

  return [
    'Riwayat percakapan terakhir:',
    transcript,
    '',
    `Pesan terbaru pengguna: ${question}`,
    '',
    'Konteks deadline manual dari NEXA Campus:',
    JSON.stringify(context, null, 2),
  ].join('\n')
}

export async function askGemini(input: AskGeminiInput): Promise<AskGeminiResult> {
  if (!aiConfigured()) {
    const info = activeProviderInfo()
    return {
      answer: 'NEXA Assistant belum aktif. Kamu tetap bisa mencatat dan mengelola deadline secara manual.',
      provider: 'none',
      model: info.textModel,
      status: 'locked',
    }
  }

  try {
    const { text, provider, model } = await generateText({
      system: NEXA_ASSISTANT_SYSTEM_INSTRUCTION,
      user: buildPrompt(input),
      temperature: 0.4,
      maxTokens: 600,
    })
    return { answer: text, provider, model, status: 'success' }
  } catch (err) {
    if (err instanceof LlmFailure && err.info.code === 'not_configured') {
      const info = activeProviderInfo()
      return {
        answer: 'NEXA Assistant belum aktif. Kamu tetap bisa mencatat dan mengelola deadline secara manual.',
        provider: 'none',
        model: info.textModel,
        status: 'locked',
      }
    }
    throw err
  }
}
