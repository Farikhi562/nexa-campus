import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getEffectivePlan } from '@/lib/plans'
import { selectArmThompson, type ArmStats } from '@/lib/ml/bandit'
import { NUDGE_ARMS, buildNudgeMessage } from '@/lib/ml/nudge-arms'

export const runtime = 'nodejs'

/**
 * Bandit (Thompson Sampling) memilih 1 dari 4 gaya nudge untuk deadline
 * tertentu, mencatatnya di nudge_log. Reward (berhasil/tidak) baru diketahui
 * NANTI, saat deadline ini diselesaikan — lihat hook di
 * app/api/deadlines/[id]/route.ts.
 */
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
    return NextResponse.json({ error: 'Fitur ini khusus NEXA Command.' }, { status: 403 })
  }

  let body: { deadline_id?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const deadlineId = typeof body.deadline_id === 'string' ? body.deadline_id : ''
  if (!deadlineId) return NextResponse.json({ error: 'deadline_id wajib diisi.' }, { status: 400 })

  // Pastikan deadline ini benar milik user & masih pending (defense-in-depth,
  // selain RLS yang sudah ada di tabel academic_deadlines).
  const { data: deadline, error: deadlineError } = await supabase
    .from('academic_deadlines')
    .select('id, course_name, deadline_date, status')
    .eq('id', deadlineId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (deadlineError) return NextResponse.json({ error: deadlineError.message }, { status: 500 })
  if (!deadline) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })

  const db = createServiceClient()

  // Kalau sudah pernah ada nudge untuk deadline ini, pakai lagi yang sama
  // (unique(deadline_id) di nudge_log) — supaya bandit tidak "ganti pilihan"
  // di tengah jalan untuk deadline yang sama.
  const { data: existingLog } = await db
    .from('nudge_log')
    .select('arm_id')
    .eq('deadline_id', deadlineId)
    .maybeSingle()

  if (existingLog) {
    const arm = (existingLog as { arm_id: string }).arm_id as (typeof NUDGE_ARMS)[number]
    return NextResponse.json({
      armId: arm,
      message: buildNudgeMessage(arm, deadline.course_name as string, deadline.deadline_date as string),
      reused: true,
    })
  }

  // Ambil state bandit user saat ini (kalau belum ada arm tertentu, mulai
  // dari prior seragam Beta(1,1) — cold start, bandit akan eksplorasi).
  const { data: armRows } = await supabase
    .from('nudge_bandit_arms')
    .select('arm_id, alpha, beta')
    .eq('user_id', user.id)

  const armMap = new Map((armRows ?? []).map((r) => [(r as { arm_id: string }).arm_id, r as { alpha: number; beta: number }]))
  const arms: ArmStats[] = NUDGE_ARMS.map((armId) => ({
    armId,
    alpha: armMap.get(armId)?.alpha ?? 1,
    beta: armMap.get(armId)?.beta ?? 1,
  }))

  const chosenArm = selectArmThompson(arms) as (typeof NUDGE_ARMS)[number]

  // Pastikan baris state untuk arm terpilih ada (upsert prior default kalau
  // belum pernah dipakai user ini sama sekali).
  await db.from('nudge_bandit_arms').upsert(
    { user_id: user.id, arm_id: chosenArm, alpha: armMap.get(chosenArm)?.alpha ?? 1, beta: armMap.get(chosenArm)?.beta ?? 1 },
    { onConflict: 'user_id,arm_id', ignoreDuplicates: true }
  )

  const { error: logError } = await db.from('nudge_log').insert({
    user_id: user.id,
    deadline_id: deadlineId,
    arm_id: chosenArm,
  })

  if (logError && logError.code !== '23505') {
    // 23505 = unique violation (race: nudge sudah dibuat barusan oleh request lain) -> bukan error fatal.
    console.error('[ml/nudge] gagal mencatat nudge_log:', logError.message)
  }

  return NextResponse.json({
    armId: chosenArm,
    message: buildNudgeMessage(chosenArm, deadline.course_name as string, deadline.deadline_date as string),
    reused: false,
  })
}
