import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

function jakartaDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date)
}

function shiftDate(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function dayOfWeek(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { data: deadline, error: deadlineError } = await supabase
    .from('academic_deadlines')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (deadlineError) return NextResponse.json({ error: deadlineError.message }, { status: 500 })
  if (!deadline) return NextResponse.json({ error: 'Deadline tidak ditemukan.' }, { status: 404 })
  if (deadline.status === 'completed') return NextResponse.json({ error: 'Deadline yang sudah selesai tidak perlu dijadwal ulang.' }, { status: 400 })

  const today = jakartaDate()
  const firstCandidate = shiftDate(deadline.deadline_date < today ? today : deadline.deadline_date, 1)
  const lastCandidate = shiftDate(firstCandidate, 9)

  const { data: nearby, error: nearbyError } = await supabase
    .from('academic_deadlines')
    .select('id, deadline_date, priority, estimated_minutes, status')
    .eq('user_id', user.id)
    .neq('id', id)
    .neq('status', 'completed')
    .gte('deadline_date', firstCandidate)
    .lte('deadline_date', lastCandidate)

  if (nearbyError) return NextResponse.json({ error: nearbyError.message }, { status: 500 })

  const candidates = Array.from({ length: 10 }, (_, index) => shiftDate(firstCandidate, index))
  const ranked = candidates.map((date, index) => {
    const sameDay = (nearby ?? []).filter((item) => item.deadline_date === date)
    const estimatedLoad = sameDay.reduce((sum, item) => sum + Number(item.estimated_minutes ?? 25), 0)
    const priorityLoad = sameDay.reduce((sum, item) => sum + (item.priority === 'urgent' ? 5 : item.priority === 'high' ? 3 : 1), 0)
    const dow = dayOfWeek(date)
    const weekendPenalty = dow === 0 ? 4 : dow === 6 ? 1.5 : 0
    const distancePenalty = index * 0.25
    return {
      date,
      count: sameDay.length,
      estimatedLoad,
      score: sameDay.length * 5 + estimatedLoad / 45 + priorityLoad + weekendPenalty + distancePenalty,
    }
  }).sort((a, b) => a.score - b.score || a.date.localeCompare(b.date))

  const selected = ranked[0]
  const nextCount = Number(deadline.rescheduled_count ?? 0) + 1
  const nextStatus = Number(deadline.progress_percent ?? 0) > 0 ? 'in_progress' : 'pending'

  const { data: updated, error: updateError } = await supabase
    .from('academic_deadlines')
    .update({
      deadline_date: selected.date,
      status: nextStatus,
      rescheduled_count: nextCount,
      last_rescheduled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('*')
    .single()

  if (updateError) {
    const hint = updateError.message.toLowerCase().includes('rescheduled_')
      ? ' Jalankan migration 20260721_retention_intelligence.sql dulu.'
      : ''
    return NextResponse.json({ error: `${updateError.message}${hint}` }, { status: 500 })
  }

  return NextResponse.json({
    data: updated,
    meta: {
      previousDate: deadline.deadline_date,
      selectedDate: selected.date,
      deadlinesOnSelectedDay: selected.count,
      estimatedLoadMinutes: selected.estimatedLoad,
      explanation: selected.count === 0
        ? 'Dipilih karena belum ada deadline lain pada hari tersebut.'
        : `Dipilih karena bebannya paling ringan: ${selected.count} deadline lain, sekitar ${selected.estimatedLoad} menit.`,
    },
  })
}
