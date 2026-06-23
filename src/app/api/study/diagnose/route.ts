import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { analyzeWeakness, generateWeaknessAdvice } from '@/lib/study/diagnose'

export const runtime = 'nodejs'
export const maxDuration = 20

// ─── GET /api/study/diagnose ──────────────────────────────────────────────────

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id)
    .maybeSingle()

  const plan = getEffectivePlan({ ...(profile ?? {}), email: user.email })
  if (plan === 'radar') {
    return NextResponse.json({ error: 'Diagnosa kelemahan khusus NEXA Pulse & Command.', status: 'locked' }, { status: 403 })
  }

  // Ambil semua pack + kolom yang dibutuhkan untuk diagnosa
  const { data: packs, error } = await supabase
    .from('study_packs')
    .select('id, topic, quiz, quiz_best_score, quiz_attempts, quiz_last_wrong, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[api/study/diagnose GET]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  if (!packs || packs.length === 0) {
    return NextResponse.json({
      weak_areas: [],
      strong_areas: [],
      total_packs: 0,
      ai_advice: null,
    })
  }

  const { weak_areas, strong_areas, total_packs } = analyzeWeakness(packs)

  // AI advice hanya untuk Command (opsional, tidak blokir response)
  const ai_advice = plan === 'command'
    ? await generateWeaknessAdvice(weak_areas).catch(() => null)
    : null

  return NextResponse.json({ weak_areas, strong_areas, total_packs, ai_advice })
}
