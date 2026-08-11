import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const MAX_LIMIT = 100
const ALLOWED_SNOOZE_MINUTES = new Set([60, 240, 720, 1440])

type NotificationRow = {
  id: string
  user_id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  related_deadline_id?: string | null
  snoozed_until?: string | null
  action_state?: string | null
}

function deadlineIdFromNotification(notification: NotificationRow) {
  if (notification.related_deadline_id) return notification.related_deadline_id
  const link = notification.link ?? ''
  const queryMatch = link.match(/[?&]deadline=([0-9a-f-]{36})/i)
  if (queryMatch?.[1]) return queryMatch[1]
  const pathMatch = link.match(/\/deadlines\/([0-9a-f-]{36})(?:\/|$)/i)
  return pathMatch?.[1] ?? null
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const limitParam = Number(request.nextUrl.searchParams.get('limit') ?? 30)
  const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 30, 1), MAX_LIMIT)
  const now = new Date().toISOString()

  let result = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .or(`snoozed_until.is.null,snoozed_until.lte.${now}`)
    .order('created_at', { ascending: false })
    .limit(limit)

  // Fallback transisi kalau code keburu deploy sebelum migration dijalankan.
  if (result.error?.message.toLowerCase().includes('snoozed_until')) {
    result = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
  }

  if (result.error) {
    console.error('[notifications]', result.error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  const rows = (result.data ?? []) as NotificationRow[]
  const unreadCount = rows.filter((n) => !n.is_read).length
  return NextResponse.json({ data: rows, unreadCount })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    ids?: unknown
    all?: unknown
    id?: unknown
    action?: unknown
    minutes?: unknown
  }

  const action = typeof body.action === 'string' ? body.action : ''
  const notificationId = typeof body.id === 'string' ? body.id : ''

  if (action && notificationId) {
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (notificationError) return NextResponse.json({ error: notificationError.message }, { status: 500 })
    if (!notification) return NextResponse.json({ error: 'Notifikasi tidak ditemukan.' }, { status: 404 })

    if (action === 'snooze') {
      const rawMinutes = Number(body.minutes ?? 60)
      const minutes = ALLOWED_SNOOZE_MINUTES.has(rawMinutes) ? rawMinutes : 60
      const snoozedUntil = new Date(Date.now() + minutes * 60_000).toISOString()
      const { error } = await supabase
        .from('notifications')
        .update({ snoozed_until: snoozedUntil, action_state: 'snoozed', is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ ok: true, snoozedUntil })
    }

    const deadlineId = deadlineIdFromNotification(notification as NotificationRow)

    if (action === 'mark_done') {
      if (!deadlineId) return NextResponse.json({ error: 'Deadline pada notifikasi ini tidak ditemukan.' }, { status: 400 })

      const { data: deadline, error } = await supabase
        .from('academic_deadlines')
        .update({ status: 'completed', progress_percent: 100 })
        .eq('id', deadlineId)
        .eq('user_id', user.id)
        .select('id, deadline_date')
        .maybeSingle()

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      if (!deadline) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })

      await supabase.rpc('award_points', { p_kind: 'complete_deadline', p_ref: deadlineId }).then(undefined, () => null)
      const today = new Date().toISOString().slice(0, 10)
      if (deadline.deadline_date && today <= deadline.deadline_date) {
        await supabase.rpc('award_points', { p_kind: 'ontime_bonus', p_ref: deadlineId }).then(undefined, () => null)
      }

      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString(), action_state: 'done' })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      return NextResponse.json({ ok: true, deadlineId })
    }

    if (action === 'start_focus') {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString(), action_state: 'read' })
        .eq('id', notificationId)
        .eq('user_id', user.id)

      return NextResponse.json({ ok: true, focusLink: deadlineId ? `/dashboard/focus?deadline=${deadlineId}` : '/dashboard/focus' })
    }

    return NextResponse.json({ error: 'Action tidak dikenal.' }, { status: 400 })
  }

  if (body.all) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString(), action_state: 'read' })
      .eq('user_id', user.id)
      .eq('is_read', false)
    if (error) return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  } else if (Array.isArray(body.ids) && body.ids.length > 0) {
    const ids = body.ids.map((id) => String(id)).filter(Boolean).slice(0, 100)
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString(), action_state: 'read' })
      .in('id', ids)
      .eq('user_id', user.id)
    if (error) return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const body = await request.json().catch(() => ({})) as {
    id?: unknown
    ids?: unknown
    all?: unknown
  }

  if (body.all) {
    const { error, count } = await supabase
      .from('notifications')
      .delete({ count: 'exact' })
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: 'Gagal menghapus notifikasi.' }, { status: 500 })
    return NextResponse.json({ ok: true, deleted: count ?? 0 })
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.map((id) => String(id)).filter(Boolean).slice(0, 100)
    : typeof body.id === 'string' && body.id
      ? [body.id]
      : []

  if (ids.length === 0) {
    return NextResponse.json({ error: 'Tidak ada notifikasi yang dipilih untuk dihapus.' }, { status: 400 })
  }

  const { error, count } = await supabase
    .from('notifications')
    .delete({ count: 'exact' })
    .in('id', ids)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: 'Gagal menghapus notifikasi.' }, { status: 500 })
  return NextResponse.json({ ok: true, deleted: count ?? 0 })
}
