import { NextRequest, NextResponse } from 'next/server'
import { parseDeadlinePayload, parseStatusPatch, type DeadlinePayload } from '@/lib/deadline-validation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { updateArm } from '@/lib/ml/bandit'

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

async function getAuthedClient() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthedClient()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { data, error } = await supabase
    .from('academic_deadlines')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })

  return NextResponse.json({ data })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthedClient()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: DeadlinePayload & { mode?: unknown }
  try {
    body = (await request.json()) as DeadlinePayload & { mode?: unknown }
  } catch {
    return badRequest('Request tidak valid.')
  }

  const parsed = body.mode === 'status'
    ? parseStatusPatch(body.status)
    : parseDeadlinePayload(body)

  if (parsed.error) return badRequest(parsed.error)
  if (!parsed.data) return badRequest('Request tidak valid.')

  const { data, error } = await supabase
    .from('academic_deadlines')
    .update(parsed.data)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })

  // Poin leaderboard saat deadline ditandai selesai (idempotent per deadline).
  // Diabaikan kalau fitur leaderboard belum di-setup.
  if (data?.status === 'completed') {
    await supabase.rpc('award_points', { p_kind: 'complete_deadline', p_ref: data.id }).then(undefined, () => null)
    const today = new Date().toISOString().slice(0, 10)
    const isOnTime = typeof data.deadline_date === 'string' && today <= data.deadline_date
    if (isOnTime) {
      await supabase.rpc('award_points', { p_kind: 'ontime_bonus', p_ref: data.id }).then(undefined, () => null)
    }

    // Catat reward bandit nudge (lib/ml/bandit.ts) kalau deadline ini pernah
    // dapat nudge yang belum di-resolve. reward=1 kalau selesai tepat waktu
    // (pakai pengecekan isOnTime yang SAMA dengan ontime_bonus di atas),
    // reward=0 kalau telat. Dibungkus try/catch terpisah supaya migrasi
    // ML yang belum dijalankan TIDAK memutus alur utama penyelesaian deadline.
    try {
      const db = createServiceClient()
      const { data: nudgeRow } = await db
        .from('nudge_log')
        .select('id, arm_id')
        .eq('deadline_id', data.id)
        .is('resolved_at', null)
        .maybeSingle()

      if (nudgeRow) {
        const armId = (nudgeRow as { arm_id: string }).arm_id
        const { data: armRow } = await db
          .from('nudge_bandit_arms')
          .select('alpha, beta')
          .eq('user_id', user.id)
          .eq('arm_id', armId)
          .maybeSingle()

        const current = { armId, alpha: (armRow as { alpha: number } | null)?.alpha ?? 1, beta: (armRow as { beta: number } | null)?.beta ?? 1 }
        const updated = updateArm(current, isOnTime ? 1 : 0)

        await db.from('nudge_bandit_arms').upsert(
          { user_id: user.id, arm_id: armId, alpha: updated.alpha, beta: updated.beta, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,arm_id' }
        )
        await db
          .from('nudge_log')
          .update({ resolved_at: new Date().toISOString(), reward: isOnTime ? 1 : 0 })
          .eq('id', (nudgeRow as { id: string }).id)
      }
    } catch (err) {
      console.error('[bandit] gagal mencatat reward (migrasi ML mungkin belum dijalankan):', err)
    }
  }

  return NextResponse.json({ data })
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user } = await getAuthedClient()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { error, count } = await supabase
    .from('academic_deadlines')
    .delete({ count: 'exact' })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!count) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })

  return NextResponse.json({ data: { id: params.id } })
}
