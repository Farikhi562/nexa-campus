import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { generateFlashcards } from '@/lib/study/generate-flashcards'
import type { RoadmapStep } from '@/lib/study/types'

type Params = { params: Promise<{ id: string }> }

type ScheduleEntry = {
  nextReview: string
  lastReviewed: string
  intervalDays: number
  repetitions: number
}

function validDate(value: unknown) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data, error } = await supabase
    .from('study_packs')
    .select('flashcards, flashcard_boxes, flashcard_schedule')
    .eq('id', id).eq('user_id', user.id).maybeSingle()

  if (error) {
    const hint = error.message.toLowerCase().includes('flashcard_schedule')
      ? ' Jalankan migration 20260721_retention_intelligence.sql dulu.'
      : ''
    return NextResponse.json({ error: `${error.message}${hint}` }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({
    flashcards: data.flashcards ?? [],
    boxes: data.flashcard_boxes ?? {},
    schedule: data.flashcard_schedule ?? {},
  })
}

/** POST — generate flashcards (kalau belum ada) */
export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles')
    .select('plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id).maybeSingle()
  if (getEffectivePlan({ ...(profile ?? {}), email: user.email }) !== 'command') {
    return NextResponse.json({ error: 'Fitur ini khusus NEXA Command.' }, { status: 403 })
  }

  const { data: pack } = await supabase.from('study_packs')
    .select('topic, summary, roadmap, flashcards, flashcard_boxes, flashcard_schedule')
    .eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!pack) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })

  if (Array.isArray(pack.flashcards) && pack.flashcards.length > 0) {
    return NextResponse.json({ flashcards: pack.flashcards, boxes: pack.flashcard_boxes ?? {}, schedule: pack.flashcard_schedule ?? {}, generated: false })
  }

  const roadmap = (Array.isArray(pack.roadmap) ? pack.roadmap : []) as RoadmapStep[]
  const roadmapText = roadmap.map((step, index) => `${index + 1}. ${step.title}: ${step.description}`).join('\n')
  const result = await generateFlashcards(pack.topic, pack.summary, roadmapText)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 })

  await supabase.from('study_packs')
    .update({ flashcards: result.cards, flashcard_boxes: {}, flashcard_schedule: {}, updated_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', user.id)

  return NextResponse.json({ flashcards: result.cards, boxes: {}, schedule: {}, generated: true })
}

/** PATCH — update Leitner boxes dan jadwal spaced repetition. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: { boxes?: unknown; schedule?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  if (!body.boxes || typeof body.boxes !== 'object' || Array.isArray(body.boxes)) {
    return NextResponse.json({ error: 'boxes harus berupa object.' }, { status: 400 })
  }
  if (!body.schedule || typeof body.schedule !== 'object' || Array.isArray(body.schedule)) {
    return NextResponse.json({ error: 'schedule harus berupa object.' }, { status: 400 })
  }

  const boxes: Record<string, number> = {}
  for (const [key, value] of Object.entries(body.boxes as Record<string, unknown>)) {
    const box = Number(value)
    if (/^\d+$/.test(key) && (box === 1 || box === 2 || box === 3)) boxes[key] = box
  }

  const schedule: Record<string, ScheduleEntry> = {}
  for (const [key, raw] of Object.entries(body.schedule as Record<string, unknown>)) {
    if (!/^\d+$/.test(key) || !raw || typeof raw !== 'object' || Array.isArray(raw)) continue
    const item = raw as Record<string, unknown>
    const intervalDays = Math.min(30, Math.max(1, Math.round(Number(item.intervalDays) || 1)))
    const repetitions = Math.min(999, Math.max(0, Math.round(Number(item.repetitions) || 0)))
    if (!validDate(item.nextReview) || !validDate(item.lastReviewed)) continue
    schedule[key] = {
      nextReview: item.nextReview as string,
      lastReviewed: item.lastReviewed as string,
      intervalDays,
      repetitions,
    }
  }

  const { error } = await supabase.from('study_packs')
    .update({ flashcard_boxes: boxes, flashcard_schedule: schedule, updated_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
