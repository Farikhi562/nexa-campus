import 'server-only'
import { GoogleGenAI } from '@google/genai'

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

function buildPrompt({ question, deadlines = [], userContext }: AskGeminiInput) {
  const context = {
    userContext: userContext ?? null,
    deadlines: deadlines.slice(0, 30),
    rules: [
      'NEXA tidak mengambil data dari sistem kampus.',
      'NEXA hanya membaca deadline yang user input manual.',
      'Jawaban AI membantu menyusun prioritas, tapi keputusan akhir tetap di user.',
    ],
  }

  return [
    `Pertanyaan user: ${question}`,
    '',
    'Konteks deadline manual dari NEXA Campus:',
    JSON.stringify(context, null, 2),
  ].join('\n')
}

export async function askGemini(input: AskGeminiInput) {
  const apiKey = process.env.GEMINI_API_KEY
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL

  if (!apiKey) {
    return {
      answer:
        'Tanya NEXA belum aktif karena konfigurasi AI belum tersedia. Kamu tetap bisa mencatat dan mengelola deadline secara manual.',
      provider: 'none' as const,
      model,
      status: 'locked' as const,
    }
  }

  const ai = new GoogleGenAI({ apiKey })
  const response = await ai.models.generateContent({
    model,
    contents: buildPrompt(input),
    config: {
      systemInstruction: TANYA_NEXA_SYSTEM_INSTRUCTION,
      temperature: 0.35,
      maxOutputTokens: 500,
    },
  })

  const answer = response.text?.trim()
  if (!answer) {
    throw new Error('gemini_empty_answer')
  }

  return {
    answer,
    provider: 'gemini' as const,
    model,
    status: 'success' as const,
  }
}
