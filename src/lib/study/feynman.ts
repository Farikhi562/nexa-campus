import 'server-only'
import { generateText, aiConfigured, LlmFailure } from '@/lib/ai/llm'
import type { FeynmanFeedback } from './types'

const FEYNMAN_TIMEOUT_MS = 18_000

class TimeoutError extends Error {}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new TimeoutError(`timeout ${ms}ms`)), ms)
    p.then((v) => { clearTimeout(t); resolve(v) },
           (e) => { clearTimeout(t); reject(e) })
  })
}

const SYSTEM_PROMPT = `Kamu adalah evaluator pemahaman konsep untuk mahasiswa Indonesia.
User mencoba menjelaskan sebuah konsep dengan kata-katanya sendiri (teknik Feynman).
Tugasmu: evaluasi seberapa dalam pemahaman mereka, lalu jawab HANYA dengan JSON (tanpa markdown, tanpa komentar):

{
  "score": integer 0–100,
  "right": ["hal yang benar / sudah dipahami — kalimat singkat bahasa Indonesia"],
  "gaps": ["poin penting yang terlewat — kalimat singkat bahasa Indonesia"],
  "wrong": ["miskonsepsi atau pernyataan yang salah — kalimat singkat bahasa Indonesia (array kosong [] kalau tidak ada)"],
  "tip": "satu saran spesifik dan actionable dalam Bahasa Indonesia"
}

Panduan skor:
  90–100 : pemahaman sangat mendalam, hampir tidak ada gap
  75–89  : paham inti, beberapa gap minor
  50–74  : paham sebagian, ada gap penting
  25–49  : pemahaman dangkal, banyak gap / ada miskonsepsi
  0–24   : hampir tidak ada pemahaman, atau penjelasan tidak relevan

Jika penjelasan kosong, singkat sekali (<10 kata), atau tidak berkaitan, beri score 0 dan tip untuk mulai mempelajari dasar konsepnya.
Jawab hanya JSON.`

/** Parse hasil AI, return null kalau tidak valid */
function parseFeedback(raw: string): FeynmanFeedback | null {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try {
    const obj = JSON.parse(cleaned)
    const score = Number(obj.score)
    if (!Number.isFinite(score) || score < 0 || score > 100) return null
    const right  = Array.isArray(obj.right)  ? (obj.right  as unknown[]).map(String) : []
    const gaps   = Array.isArray(obj.gaps)   ? (obj.gaps   as unknown[]).map(String) : []
    const wrong  = Array.isArray(obj.wrong)  ? (obj.wrong  as unknown[]).map(String) : []
    const tip    = typeof obj.tip === 'string' ? obj.tip.trim() : 'Coba jelaskan ulang dengan contoh nyata.'
    return { score: Math.round(score), right, gaps, wrong, tip }
  } catch {
    return null
  }
}

/** Fallback kalau AI tidak aktif atau gagal */
function fallbackFeedback(explanation: string): FeynmanFeedback {
  const wordCount = explanation.trim().split(/\s+/).filter(Boolean).length
  if (wordCount < 10) {
    return {
      score: 0,
      right: [],
      gaps: ['Penjelasan terlalu singkat untuk dievaluasi'],
      wrong: [],
      tip: 'Coba jelaskan konsep ini seolah-olah kamu menjelaskan ke teman yang belum pernah belajar materi ini.',
    }
  }
  return {
    score: -1, // sinyal: AI tidak aktif
    right: [],
    gaps: [],
    wrong: [],
    tip: 'AI tidak aktif di server. Minta admin untuk mengatur API key AI agar evaluasi Feynman bisa berjalan.',
  }
}

export type FeynmanEvalResult =
  | { ok: true; feedback: FeynmanFeedback }
  | { ok: false; error: string }

/**
 * Evaluasi penjelasan user untuk sebuah konsep menggunakan teknik Feynman.
 * Kalau AI tidak aktif, kembalikan feedback minimal (score -1 = tidak dievaluasi).
 */
export async function evaluateFeynman(opts: {
  concept: string
  explanation: string
  topicContext?: string
}): Promise<FeynmanEvalResult> {
  const { concept, explanation, topicContext } = opts

  if (!aiConfigured()) {
    return { ok: true, feedback: fallbackFeedback(explanation) }
  }

  const userMsg = [
    topicContext ? `Topik materi yang sedang dipelajari: ${topicContext}` : null,
    `Konsep yang dievaluasi: ${concept}`,
    '',
    'Penjelasan user:',
    '"""',
    explanation.trim(),
    '"""',
  ].filter(Boolean).join('\n')

  try {
    const { text: raw } = await withTimeout(
      generateText({
        system: SYSTEM_PROMPT,
        user: userMsg,
        temperature: 0.15,
        maxTokens: 800,
        json: true,
      }),
      FEYNMAN_TIMEOUT_MS
    )

    const feedback = parseFeedback(raw)
    if (!feedback) {
      return { ok: false, error: 'AI mengembalikan format yang tidak terbaca. Coba lagi.' }
    }
    return { ok: true, feedback }
  } catch (err) {
    if (err instanceof TimeoutError) {
      return { ok: false, error: 'AI terlalu lama merespons. Coba lagi sebentar.' }
    }
    if (err instanceof LlmFailure) {
      return { ok: false, error: `AI gagal (${err.info.code}). Coba lagi.` }
    }
    return { ok: false, error: 'Terjadi kesalahan tak terduga. Coba lagi.' }
  }
}
