import 'server-only'
import { generateText, aiConfigured } from '@/lib/ai/llm'
import type { StudyRoadmapStep, StudyQuizQuestion, GenerateStudyPackResult } from './types'

const MAX_INPUT_CHARS = 8000
const MIN_INPUT_CHARS = 80 // materi terlalu pendek -> tidak cukup buat roadmap/quiz yang bermakna

const SYSTEM_PROMPT = `Kamu adalah NEXA Study Assistant — bantu mahasiswa Indonesia belajar dari materi kuliah (transkrip ucapan dosen, catatan, slide, dll).

Dari teks materi yang diberikan, buat SATU JSON OBJECT dengan struktur PERSIS:
{
  "topic": string,                  // judul topik singkat, mis. "Struktur Data: Linked List"
  "roadmap": [                      // 4-7 langkah belajar berurutan, dari dasar ke lanjut
    { "step": number, "title": string, "description": string, "estimatedMinutes": number }
  ],
  "summary": string,                // rangkuman materi, 200-500 kata, boleh pakai **kata** untuk istilah penting dan baris baru antar paragraf. JANGAN pakai markdown heading/list kompleks, cukup paragraf + **bold**.
  "quiz": [                         // PERSIS 5 soal pilihan ganda, dari pemahaman dasar ke aplikasi
    { "question": string, "options": [string,string,string,string], "correctIndex": number (0-3), "explanation": string }
  ]
}

Aturan:
- Roadmap & quiz HARUS berdasarkan isi materi yang diberikan, jangan mengarang topik di luar materi.
- "explanation" singkat jelaskan kenapa jawaban itu benar.
- Kalau materi terlalu tipis/tidak jelas untuk membuat 5 soal bermutu, buat sebanyak yang bisa dijawab dari materi (minimal 3).
- Respond ONLY dengan JSON object di atas, tanpa markdown code fence, tanpa komentar.`

function safeParseObject(raw: string): Record<string, unknown> | null {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>
  } catch {
    // lanjut coba bracket-extraction di bawah
  }
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1))
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
    } catch {
      return null
    }
  }
  return null
}

function validateRoadmap(value: unknown): StudyRoadmapStep[] {
  if (!Array.isArray(value)) return []
  const steps: StudyRoadmapStep[] = []
  value.forEach((raw, i) => {
    if (!raw || typeof raw !== 'object') return
    const item = raw as Record<string, unknown>
    const title = typeof item.title === 'string' ? item.title.trim() : ''
    const description = typeof item.description === 'string' ? item.description.trim() : ''
    if (!title) return
    const minutes = Number(item.estimatedMinutes)
    steps.push({
      step: Number.isFinite(Number(item.step)) ? Number(item.step) : i + 1,
      title: title.slice(0, 150),
      description: description.slice(0, 500),
      estimatedMinutes: Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 20,
    })
  })
  return steps.slice(0, 10)
}

function validateQuiz(value: unknown): StudyQuizQuestion[] {
  if (!Array.isArray(value)) return []
  const questions: StudyQuizQuestion[] = []
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Record<string, unknown>
    const question = typeof item.question === 'string' ? item.question.trim() : ''
    const options = Array.isArray(item.options)
      ? item.options.map((o) => (typeof o === 'string' ? o.trim() : '')).filter(Boolean)
      : []
    const correctIndex = Number(item.correctIndex)
    const explanation = typeof item.explanation === 'string' ? item.explanation.trim() : ''

    // Soal cuma valid kalau persis 4 opsi & correctIndex menunjuk opsi yang ada.
    if (!question || options.length !== 4 || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) {
      continue
    }
    questions.push({
      question: question.slice(0, 500),
      options: options.map((o) => o.slice(0, 200)),
      correctIndex,
      explanation: explanation.slice(0, 500),
    })
  }
  return questions.slice(0, 10)
}

/**
 * Generate roadmap belajar + rangkuman + quiz dari teks materi (sudah
 * diekstrak, lihat lib/smart-input/file-extract.ts untuk PDF/DOCX). Murni
 * berbasis LLM — TIDAK ADA fallback non-AI (beda dari Smart Input NL parser)
 * karena memahami & menyusun materi belajar butuh pemahaman bahasa asli,
 * bukan sesuatu yang bisa didekati pakai regex.
 */
export async function generateStudyPack(text: string): Promise<GenerateStudyPackResult> {
  const trimmed = text.trim()

  if (trimmed.length < MIN_INPUT_CHARS) {
    return { ok: false, error: 'Materinya kependekan. Tempel/upload materi yang lebih lengkap ya (minimal beberapa paragraf).' }
  }

  if (!aiConfigured()) {
    return { ok: false, error: 'AI belum aktif di server, fitur belajar dari materi butuh AI untuk memahami isi materi.' }
  }

  try {
    const { text: raw } = await generateText({
      system: SYSTEM_PROMPT,
      user: `Materi:\n${trimmed.slice(0, MAX_INPUT_CHARS)}`,
      temperature: 0.4,
      maxTokens: 3000,
      json: true,
    })

    const obj = safeParseObject(raw)
    if (!obj) {
      return { ok: false, error: 'AI tidak mengembalikan hasil yang bisa dibaca. Coba lagi, atau pakai materi yang lebih jelas.' }
    }

    const topic = typeof obj.topic === 'string' && obj.topic.trim() ? obj.topic.trim().slice(0, 150) : 'Materi Belajar'
    const summary = typeof obj.summary === 'string' ? obj.summary.trim().slice(0, 4000) : ''
    const roadmap = validateRoadmap(obj.roadmap)
    const quiz = validateQuiz(obj.quiz)

    if (roadmap.length === 0 || !summary || quiz.length < 3) {
      return {
        ok: false,
        error: 'AI belum berhasil menyusun materi ini dengan baik (roadmap/rangkuman/quiz kurang lengkap). Coba lagi atau pakai materi yang lebih runtut.',
      }
    }

    return {
      ok: true,
      pack: {
        topic,
        sourceFilename: null,
        sourceType: 'text',
        roadmap,
        summary,
        quiz,
      },
    }
  } catch {
    return { ok: false, error: 'AI sedang tidak bisa memproses materi ini. Coba lagi sebentar.' }
  }
}
