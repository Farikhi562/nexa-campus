import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { checkRateLimit, rateLimitMessage } from '@/lib/rate-limit'
import { evaluateFeynman } from '@/lib/study/feynman'

export const runtime = 'nodejs'
export const maxDuration = 25

const MAX_CONCEPT_LEN = 200
const MAX_EXPLANATION_LEN = 4000

// ─── GET /api/study/feynman?pack_id=xxx ──────────────────────────────────────
// Ambil riwayat sesi Feynman milik user (opsional filter per pack).

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const packId = request.nextUrl.searchParams.get('pack_id')

  let query = supabase
    .from('study_feynman_sessions')
    .select('id, pack_id, concept, score, feedback, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (packId) {
    query = query.eq('pack_id', packId)
  }

  const { data, error } = await query
  if (error) {
    console.error('[api/study/feynman GET]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [] })
}

// ─── POST /api/study/feynman ──────────────────────────────────────────────────
// Evaluasi penjelasan user → simpan sesi → kembalikan feedback.

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id)
    .maybeSingle()

  if (getEffectivePlan({ ...(profile ?? {}), email: user.email }) !== 'command') {
    return NextResponse.json({ error: 'Feynman mode khusus NEXA Command.', status: 'locked' }, { status: 403 })
  }

  const rl = await checkRateLimit(supabase, 'study-feynman', 15, 3600)
  if (!rl.allowed) return NextResponse.json({ error: rateLimitMessage(rl.retryAfterSeconds) }, { status: 429 })

  let body: { pack_id?: unknown; concept?: unknown; explanation?: unknown; topic_context?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const packId    = typeof body.pack_id      === 'string' && body.pack_id      ? body.pack_id      : null
  const concept   = typeof body.concept      === 'string' ? body.concept.trim()      : ''
  const expl      = typeof body.explanation  === 'string' ? body.explanation.trim()  : ''
  const topicCtx  = typeof body.topic_context === 'string' ? body.topic_context.trim() : undefined

  if (!concept || concept.length > MAX_CONCEPT_LEN) {
    return NextResponse.json({ error: 'Konsep tidak boleh kosong (maks 200 karakter).' }, { status: 400 })
  }
  if (!expl) {
    return NextResponse.json({ error: 'Penjelasanmu tidak boleh kosong.' }, { status: 400 })
  }
  if (expl.length > MAX_EXPLANATION_LEN) {
    return NextResponse.json({ error: `Penjelasan terlalu panjang (maks ${MAX_EXPLANATION_LEN} karakter).` }, { status: 400 })
  }

  // Kalau pack_id disuplai, pastikan itu milik user
  if (packId) {
    const { data: pack } = await supabase
      .from('study_packs')
      .select('id')
      .eq('id', packId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!pack) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })
  }

  const result = await evaluateFeynman({ concept, explanation: expl, topicContext: topicCtx })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  const { feedback } = result

  // Simpan sesi ke DB (score -1 = AI tidak aktif — tetap simpan sebagai catatan)
  const { data: session, error: insertErr } = await supabase
    .from('study_feynman_sessions')
    .insert({
      user_id: user.id,
      pack_id: packId,
      concept,
      user_explanation: expl.slice(0, 2000),
      score: Math.max(0, feedback.score), // -1 disimpan sebagai 0
      feedback,
    })
    .select('id, created_at')
    .single()

  if (insertErr) {
    console.error('[api/study/feynman POST]', insertErr.message)
    // Kembalikan feedback tetap walau DB gagal — user sudah tunggu AI
    return NextResponse.json({ feedback, session_id: null, ai_active: feedback.score >= 0 })
  }

  return NextResponse.json({
    feedback,
    session_id: session.id,
    ai_active: feedback.score >= 0,
  }, { status: 201 })
}
