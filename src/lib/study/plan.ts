import 'server-only'
import { generateText, aiConfigured, LlmFailure } from '@/lib/ai/llm'
import type { ChecklistItem, RoadmapStep, StudyPlan, StudyStep, StudyStepType } from './types'

const PLAN_TIMEOUT_MS = 20_000

class TimeoutError extends Error {}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new TimeoutError()), ms)
    p.then((v) => { clearTimeout(t); resolve(v) },
           (e) => { clearTimeout(t); reject(e) })
  })
}

// ─── AI Plan Generation ───────────────────────────────────────────────────────

const ALLOWED_TYPES: StudyStepType[] = ['read', 'watch', 'practice', 'quiz', 'review', 'write', 'rest']

const PLAN_SYSTEM = `Kamu adalah perencana sesi belajar untuk mahasiswa Indonesia.
Buat rencana sesi belajar yang fokus dan realistis.
Jawab HANYA dengan JSON array (tanpa markdown, tanpa komentar):
[
  {
    "id": "s1",
    "title": "string pendek (maks 6 kata)",
    "description": "satu kalimat panduan aksi untuk langkah ini",
    "type": "read|watch|practice|quiz|review|write|rest",
    "duration_minutes": integer
  }
]
Aturan:
- Buat 4–6 langkah (tidak lebih tidak kurang).
- Variasikan tipe: harus ada setidaknya satu "read"/"review" dan satu "practice"/"quiz".
- Total durasi 50–120 menit.
- "rest" boleh 1 kali maksimal, 5–10 menit.
- duration_minutes minimum 5, maksimum 45.
- Semua teks dalam Bahasa Indonesia.`

function parsePlanSteps(raw: string): StudyStep[] | null {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try {
    const arr = JSON.parse(cleaned)
    if (!Array.isArray(arr) || arr.length === 0) return null

    const steps: StudyStep[] = []
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i] as Record<string, unknown>
      const id = typeof item.id === 'string' ? item.id : `s${i + 1}`
      const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : `Langkah ${i + 1}`
      const description = typeof item.description === 'string' ? item.description.trim() : ''
      const rawType = typeof item.type === 'string' ? item.type.toLowerCase() : 'read'
      const type: StudyStepType = (ALLOWED_TYPES as string[]).includes(rawType) ? rawType as StudyStepType : 'read'
      const duration_minutes = Math.max(5, Math.min(45, Number.isFinite(Number(item.duration_minutes)) ? Number(item.duration_minutes) : 20))
      steps.push({ id, title, description, type, duration_minutes })
    }
    return steps.length >= 2 ? steps : null
  } catch {
    return null
  }
}

/** Default fallback plan kalau AI tidak aktif. */
function defaultPlan(topic: string): StudyStep[] {
  return [
    { id: 's1', title: 'Baca ringkasan materi', description: `Baca ringkasan topik "${topic}" dari awal sampai akhir.`, type: 'read', duration_minutes: 20 },
    { id: 's2', title: 'Pahami roadmap', description: 'Perhatikan urutan konsep di roadmap — tandai yang belum kamu mengerti.', type: 'review', duration_minutes: 10 },
    { id: 's3', title: 'Tulis poin penting', description: 'Rangkum 3–5 poin utama dengan kata-katamu sendiri (teknik Feynman).', type: 'write', duration_minutes: 15 },
    { id: 's4', title: 'Kerjakan kuis', description: 'Jawab semua soal di tab Quiz. Ulangi soal yang salah sampai benar.', type: 'quiz', duration_minutes: 20 },
    { id: 's5', title: 'Review soal salah', description: 'Buka penjelasan tiap soal yang salah dan catat mengapa kamu salah.', type: 'review', duration_minutes: 10 },
  ]
}

export type GeneratePlanResult =
  | { ok: true; plan: StudyPlan }
  | { ok: false; error: string }

/**
 * Buat study plan AI (atau fallback default kalau AI tidak aktif).
 */
export async function generateStudyPlan(opts: {
  topic: string
  summary?: string | null
  roadmapTitles?: string[]
}): Promise<GeneratePlanResult> {
  const { topic, summary, roadmapTitles } = opts

  if (!aiConfigured()) {
    const steps = defaultPlan(topic)
    return { ok: true, plan: buildPlan(steps) }
  }

  const context = [
    `Topik: ${topic}`,
    roadmapTitles?.length ? `Outline materi: ${roadmapTitles.slice(0, 8).join(', ')}` : null,
    summary ? `Ringkasan singkat materi:\n${summary.slice(0, 400)}` : null,
  ].filter(Boolean).join('\n\n')

  try {
    const { text: raw } = await withTimeout(
      generateText({
        system: PLAN_SYSTEM,
        user: context,
        temperature: 0.2,
        maxTokens: 700,
        json: true,
      }),
      PLAN_TIMEOUT_MS
    )

    const steps = parsePlanSteps(raw)
    if (!steps) {
      return { ok: true, plan: buildPlan(defaultPlan(topic)) }
    }
    return { ok: true, plan: buildPlan(steps) }
  } catch (err) {
    if (err instanceof TimeoutError) {
      return { ok: false, error: 'AI terlalu lama merespons. Menggunakan rencana default.' }
    }
    if (err instanceof LlmFailure) {
      return { ok: false, error: `AI gagal (${err.info.code}). Coba lagi.` }
    }
    return { ok: false, error: 'Terjadi kesalahan tak terduga.' }
  }
}

function buildPlan(steps: StudyStep[]): StudyPlan {
  const total_minutes = steps.reduce((s, st) => s + st.duration_minutes, 0)
  return { steps, total_minutes, created_at: new Date().toISOString() }
}

// ─── Checklist dari Roadmap ───────────────────────────────────────────────────

let _itemCounter = 0

function nextId() {
  return `cl-${Date.now()}-${(_itemCounter++) % 1000}`
}

/**
 * Buat default checklist dari roadmap steps.
 * Dipanggil kalau kolom `checklist` masih null/kosong di DB.
 * Tidak butuh AI — deterministik.
 */
export function checklistFromRoadmap(roadmap: unknown): ChecklistItem[] {
  if (!Array.isArray(roadmap) || roadmap.length === 0) {
    // Fallback generik
    return [
      { id: nextId(), text: 'Baca ringkasan materi', done: false, order: 0 },
      { id: nextId(), text: 'Catat poin penting', done: false, order: 1 },
      { id: nextId(), text: 'Kerjakan kuis', done: false, order: 2 },
      { id: nextId(), text: 'Review soal yang salah', done: false, order: 3 },
      { id: nextId(), text: 'Uji dengan teknik Feynman', done: false, order: 4 },
    ]
  }

  const items: ChecklistItem[] = (roadmap as RoadmapStep[]).slice(0, 10).map((step, i) => ({
    id: nextId(),
    text: `Kuasai: ${typeof step.title === 'string' ? step.title : `Topik ${i + 1}`}`,
    done: false,
    order: i,
  }))

  // Tambah item review di akhir
  items.push({
    id: nextId(),
    text: 'Kerjakan kuis sampai skor ≥ 80%',
    done: false,
    order: items.length,
  })

  return items
}

/** Validasi & sanitasi array ChecklistItem dari input API. */
export function validateChecklist(raw: unknown): ChecklistItem[] | null {
  if (!Array.isArray(raw)) return null
  const items: ChecklistItem[] = []
  for (const item of raw as unknown[]) {
    if (typeof item !== 'object' || item === null) return null
    const it = item as Record<string, unknown>
    if (typeof it.id !== 'string' || !it.id) return null
    if (typeof it.text !== 'string') return null
    const done = Boolean(it.done)
    const order = typeof it.order === 'number' ? it.order : items.length
    items.push({ id: it.id, text: it.text.slice(0, 200), done, order })
  }
  return items.length <= 50 ? items : null
}
