import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as { deadlineId?: unknown; durationMinutes?: unknown }
  const deadlineId = typeof body.deadlineId === 'string' && body.deadlineId ? body.deadlineId : null
  const rawMinutes = Number(body.durationMinutes ?? 25)
  const durationMinutes = Math.min(Math.max(Number.isFinite(rawMinutes) ? Math.round(rawMinutes) : 25, 1), 600)

  let deadline: { id: string; progress_percent: number; status: string } | null = null
  let safeDeadlineId: string | null = null

  if (deadlineId) {
    const { data: current } = await supabase
      .from('academic_deadlines')
      .select('id, status, estimated_minutes, progress_percent')
      .eq('id', deadlineId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (current) safeDeadlineId = current.id

    if (current && current.status !== 'completed') {
      const { count: subtaskCount } = await supabase
        .from('deadline_subtasks')
        .select('id', { count: 'exact', head: true })
        .eq('deadline_id', deadlineId)
        .eq('user_id', user.id)

      const currentProgress = Number(current.progress_percent ?? 0)
      const estimate = Math.max(Number(current.estimated_minutes ?? 25), 5)
      const nextProgress = (subtaskCount ?? 0) > 0
        ? currentProgress
        : Math.min(95, currentProgress + Math.max(1, Math.round((durationMinutes / estimate) * 100)))

      const { data: updated } = await supabase
        .from('academic_deadlines')
        .update({ progress_percent: nextProgress, status: nextProgress > 0 ? 'in_progress' : current.status })
        .eq('id', deadlineId)
        .eq('user_id', user.id)
        .select('id, progress_percent, status')
        .maybeSingle()

      deadline = updated as typeof deadline
    }
  }

  const { error: sessionError } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: user.id,
      deadline_id: safeDeadlineId,
      duration_minutes: durationMinutes,
      preset_minutes: durationMinutes,
      completed_at: new Date().toISOString(),
    })

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  await supabase.rpc('award_points', { p_kind: 'focus_session', p_ref: `focus-${today}` }).then(undefined, () => null)

  return NextResponse.json({ ok: true, deadline, historySaved: !sessionError })
}
