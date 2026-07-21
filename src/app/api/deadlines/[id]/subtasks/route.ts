import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAuthedDeadline(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null, deadline: null }

  const { data: deadline } = await supabase
    .from('academic_deadlines')
    .select('id, user_id, deadline_date, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  return { supabase, user, deadline }
}

async function syncProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  deadlineId: string,
) {
  const { data: rows, error } = await supabase
    .from('deadline_subtasks')
    .select('id, is_completed')
    .eq('deadline_id', deadlineId)
    .eq('user_id', userId)

  if (error) throw error

  const total = rows?.length ?? 0
  const completed = (rows ?? []).filter((row: { is_completed: boolean }) => row.is_completed).length
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0
  const nextStatus = progressPercent >= 100 ? 'completed' : completed > 0 ? 'in_progress' : 'pending'

  const { data: deadline, error: updateError } = await supabase
    .from('academic_deadlines')
    .update({ progress_percent: progressPercent, status: nextStatus })
    .eq('id', deadlineId)
    .eq('user_id', userId)
    .select('id, status, progress_percent, deadline_date')
    .single()

  if (updateError) throw updateError

  if (nextStatus === 'completed') {
    await supabase.rpc('award_points', { p_kind: 'complete_deadline', p_ref: deadlineId }).then(undefined, () => null)
    const today = new Date().toISOString().slice(0, 10)
    if (deadline?.deadline_date && today <= deadline.deadline_date) {
      await supabase.rpc('award_points', { p_kind: 'ontime_bonus', p_ref: deadlineId }).then(undefined, () => null)
    }
  }

  return { total, completed, progressPercent, status: nextStatus }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, deadline } = await getAuthedDeadline(params.id)
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })
  if (!deadline) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })

  const { data, error } = await supabase
    .from('deadline_subtasks')
    .select('*')
    .eq('deadline_id', params.id)
    .eq('user_id', user.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, deadline } = await getAuthedDeadline(params.id)
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })
  if (!deadline) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })

  const body = await request.json().catch(() => ({})) as { title?: unknown }
  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 160) : ''
  if (!title) return NextResponse.json({ error: 'Judul checklist wajib diisi.' }, { status: 400 })

  const { count } = await supabase
    .from('deadline_subtasks')
    .select('id', { count: 'exact', head: true })
    .eq('deadline_id', params.id)
    .eq('user_id', user.id)

  const { data, error } = await supabase
    .from('deadline_subtasks')
    .insert({ deadline_id: params.id, user_id: user.id, title, position: count ?? 0 })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const progress = await syncProgress(supabase, user.id, params.id)
  return NextResponse.json({ data, progress }, { status: 201 })
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, deadline } = await getAuthedDeadline(params.id)
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })
  if (!deadline) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })

  const body = await request.json().catch(() => ({})) as {
    subtaskId?: unknown
    isCompleted?: unknown
    title?: unknown
  }
  const subtaskId = typeof body.subtaskId === 'string' ? body.subtaskId : ''
  if (!subtaskId) return NextResponse.json({ error: 'Checklist tidak valid.' }, { status: 400 })

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.isCompleted === 'boolean') patch.is_completed = body.isCompleted
  if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim().slice(0, 160)

  const { data, error } = await supabase
    .from('deadline_subtasks')
    .update(patch)
    .eq('id', subtaskId)
    .eq('deadline_id', params.id)
    .eq('user_id', user.id)
    .select('*')
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Checklist tidak ditemukan.' }, { status: 404 })

  const progress = await syncProgress(supabase, user.id, params.id)
  return NextResponse.json({ data, progress })
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { supabase, user, deadline } = await getAuthedDeadline(params.id)
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })
  if (!deadline) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })

  const body = await request.json().catch(() => ({})) as { subtaskId?: unknown }
  const subtaskId = typeof body.subtaskId === 'string' ? body.subtaskId : ''
  if (!subtaskId) return NextResponse.json({ error: 'Checklist tidak valid.' }, { status: 400 })

  const { error } = await supabase
    .from('deadline_subtasks')
    .delete()
    .eq('id', subtaskId)
    .eq('deadline_id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const progress = await syncProgress(supabase, user.id, params.id)
  return NextResponse.json({ ok: true, progress })
}
