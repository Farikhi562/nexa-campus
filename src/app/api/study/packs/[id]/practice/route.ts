import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { generatePracticeProblems } from '@/lib/study/generate-flashcards'
import { checkRateLimit, rateLimitMessage } from '@/lib/rate-limit'

type Params = { params: Promise<{ id: string }> }

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

  const rl = await checkRateLimit(supabase, 'study-practice', 20, 3600)
  if (!rl.allowed) return NextResponse.json({ error: rateLimitMessage(rl.retryAfterSeconds) }, { status: 429 })

  const { data: pack } = await supabase.from('study_packs')
    .select('topic, summary, quiz')
    .eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!pack) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })

  const existingQs = Array.isArray(pack.quiz)
    ? (pack.quiz as Array<{ question?: string }>).map((q) => q.question ?? '').filter(Boolean)
    : []

  const result = await generatePracticeProblems(pack.topic, pack.summary, existingQs)
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 422 })

  return NextResponse.json({ questions: result.questions })
}
