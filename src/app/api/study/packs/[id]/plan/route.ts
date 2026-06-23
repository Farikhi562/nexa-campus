import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { checkRateLimit, rateLimitMessage } from '@/lib/rate-limit'
import { generateStudyPlan } from '@/lib/study/plan'
import type { StudyPlan } from '@/lib/study/types'

export const runtime = 'nodejs'
export const maxDuration = 25

type RouteContext = { params: Promise<{ id: string }> }

// ─── Shared: fetch pack, check ownership ─────────────────────────────────────

async function getPackForUser(supabase: Awaited<ReturnType<typeof createClient>>, packId: string, userId: string) {
  const { data, error } = await supabase
    .from('study_packs')
    .select('id, topic, summary, roadmap, active_plan, plan_progress')
    .eq('id', packId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

// ─── GET /api/study/packs/[id]/plan ──────────────────────────────────────────
// Kembalikan plan aktif (atau null kalau belum ada).

export async function GET(_req: NextRequest, ctx: RouteContext) {
  const { id: packId } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const pack = await getPackForUser(supabase, packId, user.id).catch(() => null)
  if (!pack) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })

  return NextResponse.json({
    plan: pack.active_plan ?? null,
    progress: pack.plan_progress ?? [],
  })
}

// ─── POST /api/study/packs/[id]/plan ─────────────────────────────────────────
// Generate plan baru (timpa plan lama + reset progress).

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { id: packId } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id)
    .maybeSingle()

  if (getEffectivePlan({ ...(profile ?? {}), email: user.email }) === 'radar') {
    return NextResponse.json({ error: 'Study plan khusus NEXA Pulse & Command.', status: 'locked' }, { status: 403 })
  }

  const rl = await checkRateLimit(supabase, 'study-plan-generate', 5, 3600)
  if (!rl.allowed) return NextResponse.json({ error: rateLimitMessage(rl.retryAfterSeconds) }, { status: 429 })

  const pack = await getPackForUser(supabase, packId, user.id).catch(() => null)
  if (!pack) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })

  const roadmapTitles = Array.isArray(pack.roadmap)
    ? (pack.roadmap as Array<{ title?: unknown }>)
        .map((s) => (typeof s.title === 'string' ? s.title : ''))
        .filter(Boolean)
    : []

  const result = await generateStudyPlan({
    topic: pack.topic,
    summary: pack.summary as string | null,
    roadmapTitles,
  })

  if (!result.ok) {
    // Kembalikan error tapi dengan plan default jika tersedia (sudah di-handle dalam lib)
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  const { plan } = result

  const { error: updateErr } = await supabase
    .from('study_packs')
    .update({ active_plan: plan, plan_progress: [] })
    .eq('id', packId)
    .eq('user_id', user.id)

  if (updateErr) {
    console.error('[api/study/plan POST]', updateErr.message)
    return NextResponse.json({ error: 'Gagal menyimpan plan.' }, { status: 500 })
  }

  return NextResponse.json({ plan, progress: [] }, { status: 201 })
}

// ─── PATCH /api/study/packs/[id]/plan ────────────────────────────────────────
// Simpan progres (step mana saja yang sudah selesai).

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  const { id: packId } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: { completed_step_ids?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const completedIds = Array.isArray(body.completed_step_ids)
    ? (body.completed_step_ids as unknown[]).filter((x): x is string => typeof x === 'string')
    : []

  // Validasi pack ada + milik user, ambil plan untuk cross-check step ids
  const pack = await getPackForUser(supabase, packId, user.id).catch(() => null)
  if (!pack) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })
  if (!pack.active_plan) return NextResponse.json({ error: 'Belum ada study plan. Generate dulu.' }, { status: 409 })

  const plan = pack.active_plan as StudyPlan
  const validIds = new Set(plan.steps.map((s) => s.id))
  const filtered = completedIds.filter((id) => validIds.has(id))

  const { error: updateErr } = await supabase
    .from('study_packs')
    .update({ plan_progress: filtered })
    .eq('id', packId)
    .eq('user_id', user.id)

  if (updateErr) {
    console.error('[api/study/plan PATCH]', updateErr.message)
    return NextResponse.json({ error: 'Gagal menyimpan progres.' }, { status: 500 })
  }

  return NextResponse.json({ progress: filtered })
}
