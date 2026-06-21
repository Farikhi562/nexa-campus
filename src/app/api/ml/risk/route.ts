import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { trainAndPredict, type DeadlineForTraining, type DeadlineForPrediction } from '@/lib/ml/late-risk-model'

export const runtime = 'nodejs'

/**
 * Hitung risiko telat untuk deadline pending milik user, dilatih dari
 * histori deadline yang SUDAH SELESAI (completed). "wasOnTime" diturunkan
 * dari ada/tidaknya event points_events kind='ontime_bonus' untuk deadline
 * itu — field ini sudah dicatat sejak lama oleh /api/deadlines/[id] (lihat
 * cek `today <= deadline_date` di sana), jadi tidak perlu kolom baru.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id)
    .maybeSingle()

  if (getEffectivePlan({ ...(profile ?? {}), email: user.email }) !== 'command') {
    return NextResponse.json(
      { error: 'Prediksi risiko (machine learning) khusus NEXA Command.', status: 'locked' },
      { status: 403 }
    )
  }

  const [completedRes, pendingRes, ontimeEventsRes] = await Promise.all([
    supabase
      .from('academic_deadlines')
      .select('id, type, priority, created_at, deadline_date, deadline_time, reminder_enabled')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .limit(300),
    supabase
      .from('academic_deadlines')
      .select('id, course_name, title, type, priority, created_at, deadline_date, deadline_time, reminder_enabled')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in_progress'])
      .order('deadline_date', { ascending: true })
      .limit(50),
    supabase
      .from('points_events')
      .select('ref')
      .eq('user_id', user.id)
      .eq('kind', 'ontime_bonus'),
  ])

  if (completedRes.error) return NextResponse.json({ error: completedRes.error.message }, { status: 500 })
  if (pendingRes.error) return NextResponse.json({ error: pendingRes.error.message }, { status: 500 })

  const onTimeDeadlineIds = new Set((ontimeEventsRes.data ?? []).map((r) => (r as { ref: string | null }).ref).filter(Boolean))

  const history: DeadlineForTraining[] = (completedRes.data ?? []).map((d) => ({
    id: d.id as string,
    type: d.type as string,
    priority: d.priority as string,
    created_at: d.created_at as string,
    deadline_date: d.deadline_date as string,
    deadline_time: d.deadline_time as string,
    reminder_enabled: Boolean(d.reminder_enabled),
    wasOnTime: onTimeDeadlineIds.has(d.id as string),
  }))

  const pending: DeadlineForPrediction[] = (pendingRes.data ?? []).map((d) => ({
    id: d.id as string,
    course_name: d.course_name as string,
    title: d.title as string | null,
    type: d.type as string,
    priority: d.priority as string,
    created_at: d.created_at as string,
    deadline_date: d.deadline_date as string,
    deadline_time: d.deadline_time as string,
    reminder_enabled: Boolean(d.reminder_enabled),
  }))

  const result = trainAndPredict(history, pending)
  const sorted = [...result.predictions].sort((a, b) => b.riskScore - a.riskScore)

  return NextResponse.json({
    modelTrained: result.modelTrained,
    trainingSamples: result.trainingSamples,
    trainingAccuracy: result.trainingAccuracy,
    predictions: sorted,
  })
}
