import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { generateFlashcards } from '@/lib/study/generate-flashcards'
import type { RoadmapStep } from '@/lib/study/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data } = await supabase
    .from('study_packs')
    .select('flashcards, flashcard_boxes')
    .eq('id', id).eq('user_id', user.id).maybeSingle()

  if (!data) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })
  return NextResponse.json({ flashcards: data.flashcards ?? [], boxes: data.flashcard_boxes ?? {} })
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
    .select('topic, summary, roadmap, flashcards')
    .eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!pack) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })

  // Kalau sudah punya flashcard, kembalikan langsung (hemat kredit AI)
  if (Array.isArray(pack.flashcards) && pack.flashcards.length > 0) {
    return NextResponse.json({ flashcards: pack.flashcards, generated: false })
  }

  const roadmap = (Array.isArray(pack.roadmap) ? pack.roadmap : []) as RoadmapStep[]
   const roadmapText = roadmap.map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join('\n')

  const result = await generateFlashcards(pack.topic, pack.summary, roadmapText)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 })

  await supabase.from('study_packs')
    .update({ flashcards: result.cards, updated_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', user.id)

  return NextResponse.json({ flashcards: result.cards, generated: true })
}

/** PATCH — update flashcard_boxes (Leitner progress) */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: { boxes?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  if (!body.boxes || typeof body.boxes !== 'object' || Array.isArray(body.boxes)) {
    return NextResponse.json({ error: 'boxes harus berupa object.' }, { status: 400 })
  }

  // Validasi semua value adalah 1|2|3
  const sanitized: Record<string, number> = {}
  for (const [k, v] of Object.entries(body.boxes as Record<string, unknown>)) {
    const n = Number(v)
    if (n === 1 || n === 2 || n === 3) sanitized[k] = n
  }

  await supabase.from('study_packs')
    .update({ flashcard_boxes: sanitized, updated_at: new Date().toISOString() })
    .eq('id', id).eq('user_id', user.id)

  return NextResponse.json({ ok: true })
}
