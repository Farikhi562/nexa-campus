import 'server-only'
import { generateText, aiConfigured, LlmFailure } from '@/lib/ai/llm'
import type { DiagnoseResult, WeakArea, WeakReason } from './types'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Pack dianggap lemah kalau best_score < threshold ini (dari total soal). */
const WEAK_SCORE_THRESHOLD = 0.60

/** Pack dianggap stale kalau belum 100% dan sudah > ini (hari). */
const STALE_DAYS = 14

const ADVICE_TIMEOUT_MS = 12_000

// ─── Tipe data pack mentah dari Supabase ─────────────────────────────────────

export type PackRow = {
  id: string
  topic: string
  quiz: unknown              // JSONB array di DB
  quiz_best_score: number | null
  quiz_attempts: number
  quiz_last_wrong: number[] | null
  created_at: string
  updated_at: string
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function quizLength(quiz: unknown): number {
  return Array.isArray(quiz) ? quiz.length : 0
}

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24)
}

class TimeoutError extends Error {}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new TimeoutError()), ms)
    p.then((v) => { clearTimeout(t); resolve(v) },
           (e) => { clearTimeout(t); reject(e) })
  })
}

// ─── Analisis deterministik ───────────────────────────────────────────────────

/**
 * Analisis list pack milik user → { weak_areas, strong_areas }.
 * Murni deterministik, tanpa AI. Bisa dijadikan unit test.
 */
export function analyzeWeakness(packs: PackRow[]): Pick<DiagnoseResult, 'weak_areas' | 'strong_areas' | 'total_packs'> {
  const weak_areas: WeakArea[] = []
  const strong_areas: DiagnoseResult['strong_areas'] = []

  for (const pack of packs) {
    const total = quizLength(pack.quiz)
    const best  = pack.quiz_best_score ?? null
    const ratio = total > 0 && best !== null ? best / total : NaN

    // Tentukan reason
    let reason: WeakReason | null = null

    if (total === 0) {
      // Tidak ada kuis — skip (tidak masuk kategori lemah/kuat)
      continue
    }

    if (pack.quiz_attempts === 0 || best === null) {
      reason = 'no_attempts'
    } else if (ratio < WEAK_SCORE_THRESHOLD) {
      reason = 'low_score'
    } else if (ratio < 1.0 && daysSince(pack.updated_at) > STALE_DAYS) {
      reason = 'stale'
    }

    if (reason !== null) {
      weak_areas.push({
        pack_id: pack.id,
        topic: pack.topic,
        score_ratio: isNaN(ratio) ? NaN : ratio,
        attempts: pack.quiz_attempts,
        quiz_total: total,
        quiz_last_wrong: pack.quiz_last_wrong ?? [],
        reason,
      })
    } else {
      strong_areas.push({ pack_id: pack.id, topic: pack.topic, score_ratio: ratio })
    }
  }

  // Urutkan: lemah parah duluan (ratio kecil; NaN/no_attempts → skor = -1 biar muncul duluan)
  weak_areas.sort((a, b) => {
    const ra = isNaN(a.score_ratio) ? -1 : a.score_ratio
    const rb = isNaN(b.score_ratio) ? -1 : b.score_ratio
    return ra - rb
  })

  // Strong: descending ratio
  strong_areas.sort((a, b) => b.score_ratio - a.score_ratio)

  return { weak_areas, strong_areas, total_packs: packs.length }
}

// ─── Saran AI (opsional) ─────────────────────────────────────────────────────

const ADVICE_SYSTEM = `Kamu adalah konselor belajar untuk mahasiswa Indonesia.
Diberikan data area lemah berdasarkan kuis, tulis saran belajar yang SPESIFIK dan ACTIONABLE dalam Bahasa Indonesia.
Maksimal 3–4 kalimat. Fokus pada topik paling lemah dulu. Jangan gunakan markdown atau daftar poin.
Hanya teks biasa.`

/**
 * Minta AI buat saran belajar berdasarkan area lemah.
 * Mengembalikan null kalau AI tidak aktif, tidak ada data, atau gagal.
 */
export async function generateWeaknessAdvice(weakAreas: WeakArea[]): Promise<string | null> {
  if (!aiConfigured() || weakAreas.length === 0) return null

  const summary = weakAreas.slice(0, 5).map((w, i) => {
    const pct = isNaN(w.score_ratio) ? 'belum pernah dikerjakan' : `skor terbaik ${Math.round(w.score_ratio * 100)}%`
    return `${i + 1}. ${w.topic} — ${pct} (${w.quiz_total} soal)`
  }).join('\n')

  try {
    const { text } = await withTimeout(
      generateText({
        system: ADVICE_SYSTEM,
        user: `Area lemah mahasiswa ini:\n${summary}`,
        temperature: 0.3,
        maxTokens: 300,
      }),
      ADVICE_TIMEOUT_MS
    )
    return text.trim() || null
  } catch (err) {
    if (err instanceof LlmFailure) console.warn('[study/diagnose] AI advice failed:', err.info.code)
    return null
  }
}
