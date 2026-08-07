import 'server-only'
import { generateText, aiConfigured } from '@/lib/ai/llm'
import type { Flashcard } from './types'

const MIN_CARDS = 5
const MAX_CARDS = 20

// PENTING: generateText({ json: true }) memaksa response_format "json_object" di
// provider (lihat lib/ai/llm.ts) — itu MEWAJIBKAN root JSON berupa OBJECT, bukan
// array. Makanya prompt di sini SELALU minta object berisi array di dalam key
// ("cards" / "questions"), bukan array telanjang — pola yang sama dengan
// generate-study-pack.ts yang sudah terbukti jalan. Sebelumnya prompt ini minta
// "JSON ARRAY" langsung sementara response_format tetap json_object, jadi
// provider sering menolak/membungkusnya beda-beda → flashcard & latihan gagal terus.
const SYSTEM_PROMPT = `Kamu pembuat flashcard untuk mahasiswa Indonesia.
Dari materi yang diberikan, buat SATU JSON OBJECT dengan struktur PERSIS:
{"cards": [{"front":"pertanyaan/istilah singkat","back":"jawaban/definisi singkat (maks 100 kata)"}]}
Prioritaskan: istilah teknis penting, definisi, rumus/formula, prinsip utama, perbedaan antar konsep.
"front" harus spesifik dan testable (bukan terlalu umum). "back" padat, to the point.
Respond ONLY dengan JSON object di atas. Tanpa markdown fence, tanpa komentar.`

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
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>
    } catch {
      return null
    }
  }
  return null
}

/** Cari array pertama di dalam object hasil AI, apapun nama key-nya (jaga-jaga kalau AI pakai nama key lain dari yang diminta). */
function firstArrayValue(obj: Record<string, unknown>): unknown[] | null {
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) return value
  }
  return null
}

function validateCards(raw: unknown): Flashcard[] {
  if (!Array.isArray(raw)) return []
  const out: Flashcard[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const front = typeof r.front === 'string' ? r.front.trim().slice(0, 200) : ''
    const back = typeof r.back === 'string' ? r.back.trim().slice(0, 600) : ''
    if (front.length >= 3 && back.length >= 3) out.push({ front, back })
  }
  return out.slice(0, MAX_CARDS)
}

export async function generateFlashcards(
  topic: string,
  summary: string,
  roadmapText: string
): Promise<{ ok: true; cards: Flashcard[] } | { ok: false; error: string }> {
  if (!aiConfigured()) {
    return { ok: false, error: 'AI belum aktif di server.' }
  }

  const userPrompt = `Topik: ${topic}

Roadmap:
${roadmapText}

Rangkuman:
${summary.slice(0, 3000)}

Buat ${MIN_CARDS}-${MAX_CARDS} flashcard dari materi di atas.`

  try {
    const { text } = await generateText({
      system: SYSTEM_PROMPT,
      user: userPrompt,
      temperature: 0.4,
      maxTokens: 2000,
      json: true,
    })

    const obj = safeParseObject(text)
    const arr = obj ? (Array.isArray(obj.cards) ? obj.cards : firstArrayValue(obj)) : null
    const cards = validateCards(arr)
    if (cards.length < 3) {
      return { ok: false, error: 'AI tidak berhasil membuat flashcard yang cukup. Coba lagi.' }
    }
    return { ok: true, cards }
  } catch {
    return { ok: false, error: 'AI sedang tidak tersedia. Coba lagi sebentar.' }
  }
}

export async function generatePracticeProblems(
  topic: string,
  summary: string,
  existingQuestions: string[]
): Promise<{ ok: true; questions: Array<{ question: string; options: string[]; correctIndex: number; explanation: string }> } | { ok: false; error: string }> {
  if (!aiConfigured()) {
    return { ok: false, error: 'AI belum aktif di server.' }
  }

  const avoid = existingQuestions.slice(0, 5).map((q, i) => `${i + 1}. ${q}`).join('\n')
  const userPrompt = `Topik: ${topic}
Rangkuman: ${summary.slice(0, 2000)}

Soal yang sudah ada (JANGAN dibuat lagi, variasikan):
${avoid}

Buat 5 soal pilihan ganda BARU yang berbeda dari di atas.
Balas SATU JSON OBJECT dengan struktur PERSIS:
{"questions": [{"question":"...","options":["A","B","C","D"],"correctIndex":0,"explanation":"..."}]}
correctIndex = index jawaban benar (0-3). Respond ONLY JSON object di atas.`

  try {
    const { text } = await generateText({
      system: 'Kamu pembuat soal latihan mahasiswa Indonesia. Respond ONLY JSON object sesuai struktur yang diminta, no markdown.',
      user: userPrompt,
      temperature: 0.6,
      maxTokens: 1500,
      json: true,
    })
    const obj = safeParseObject(text)
    const parsed = obj ? (Array.isArray(obj.questions) ? obj.questions : firstArrayValue(obj)) : null
    if (!Array.isArray(parsed)) return { ok: false, error: 'AI tidak mengembalikan soal yang valid.' }

    const questions = (parsed as unknown[]).flatMap((raw) => {
      if (!raw || typeof raw !== 'object') return []
      const r = raw as Record<string, unknown>
      const question = typeof r.question === 'string' ? r.question.trim() : ''
      const options = Array.isArray(r.options) ? r.options.map((o) => String(o).trim()).filter(Boolean) : []
      const correctIndex = Number(r.correctIndex)
      const explanation = typeof r.explanation === 'string' ? r.explanation.trim() : ''
      if (!question || options.length !== 4 || !Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex > 3) return []
      return [{ question: question.slice(0, 500), options: options.map((o) => o.slice(0, 200)), correctIndex, explanation: explanation.slice(0, 500) }]
    }).slice(0, 10)

    if (questions.length < 3) return { ok: false, error: 'AI tidak berhasil membuat soal baru yang valid.' }
    return { ok: true, questions }
  } catch {
    return { ok: false, error: 'AI sedang tidak tersedia. Coba lagi.' }
  }
}
