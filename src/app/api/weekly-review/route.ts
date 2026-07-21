import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

function startOfJakartaDay(value: string) {
  return new Date(`${value}T00:00:00+07:00`).toISOString()
}

function endOfJakartaDay(value: string) {
  return new Date(`${value}T23:59:59.999+07:00`).toISOString()
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0
}

function trend(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

type WindowStats = {
  due: number
  completed: number
  overdue: number
  focusMinutes: number
  focusSessions: number
  checkins: number
  goalsCompleted: number
}

async function collectWindow(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  startDate: string,
  endDate: string,
): Promise<WindowStats> {
  const startIso = startOfJakartaDay(startDate)
  const endIso = endOfJakartaDay(endDate)

  const [deadlinesRes, focusRes, pulseRes] = await Promise.all([
    supabase
      .from('academic_deadlines')
      .select('id, status, deadline_date, updated_at')
      .eq('user_id', userId)
      .gte('deadline_date', startDate)
      .lte('deadline_date', endDate),
    supabase
      .from('focus_sessions')
      .select('duration_minutes, completed_at')
      .eq('user_id', userId)
      .gte('completed_at', startIso)
      .lte('completed_at', endIso),
    supabase
      .from('daily_checkins')
      .select('activity_date, goal_completed, checked_out_at')
      .eq('user_id', userId)
      .gte('activity_date', startDate)
      .lte('activity_date', endDate),
  ])

  const deadlines = deadlinesRes.error ? [] : deadlinesRes.data ?? []
  const focus = focusRes.error ? [] : focusRes.data ?? []
  const pulse = pulseRes.error ? [] : pulseRes.data ?? []
  const completed = deadlines.filter((item) => item.status === 'completed').length
  const overdue = deadlines.filter((item) => item.status !== 'completed' && item.deadline_date < jakartaDate()).length

  return {
    due: deadlines.length,
    completed,
    overdue,
    focusMinutes: focus.reduce((sum, row) => sum + Number(row.duration_minutes ?? 0), 0),
    focusSessions: focus.length,
    checkins: pulse.length,
    goalsCompleted: pulse.filter((row) => row.goal_completed === true).length,
  }
}

function recommendation(stats: WindowStats) {
  const completionRate = percent(stats.completed, stats.due)
  const goalRate = percent(stats.goalsCompleted, stats.checkins)

  if (stats.overdue > 0) {
    return {
      title: 'Beresin utang deadline dulu',
      body: `Ada ${stats.overdue} deadline lewat. Pakai Smart Reschedule untuk pindahin ke hari yang lebih ringan, lalu fokus satu tugas sampai progress-nya nyata.`,
      actionLabel: 'Buka deadline',
      actionHref: '/dashboard/deadlines',
    }
  }
  if (stats.due > 0 && completionRate < 60) {
    return {
      title: 'Target mingguan terlalu padat',
      body: 'Pecah tugas besar jadi checklist kecil dan kasih estimasi waktu. Kalender bukan gudang rasa bersalah yang terus ditumpuk.',
      actionLabel: 'Rapikan deadline',
      actionHref: '/dashboard/deadlines',
    }
  }
  if (stats.focusMinutes < 120) {
    return {
      title: 'Tambah dua blok fokus',
      body: 'Total fokus masih di bawah dua jam. Dua sesi 45 menit minggu depan sudah cukup buat menaikkan ritme tanpa cosplay jadi mesin.',
      actionLabel: 'Mulai Focus Mode',
      actionHref: '/dashboard/focus',
    }
  }
  if (stats.checkins > 0 && goalRate < 60) {
    return {
      title: 'Kecilkan target harian',
      body: 'Check-in sudah jalan, tapi target sering belum tercapai. Pilih satu hasil konkret per hari, bukan daftar ambisi satu kementerian.',
      actionLabel: 'Atur Daily Pulse',
      actionHref: '/dashboard',
    }
  }
  return {
    title: 'Ritme minggu ini sehat',
    body: 'Pertahankan pola yang sama dan tambah beban pelan-pelan. Jangan mendadak bikin 17 target cuma karena lagi semangat.',
    actionLabel: 'Lanjut fokus',
    actionHref: '/dashboard/focus',
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const endDate = jakartaDate()
  const startDate = shiftDate(endDate, -6)
  const previousEnd = shiftDate(startDate, -1)
  const previousStart = shiftDate(previousEnd, -6)

  const [current, previous] = await Promise.all([
    collectWindow(supabase, user.id, startDate, endDate),
    collectWindow(supabase, user.id, previousStart, previousEnd),
  ])

  const completionRate = percent(current.completed, current.due)
  const previousCompletionRate = percent(previous.completed, previous.due)
  const goalRate = percent(current.goalsCompleted, current.checkins)

  return NextResponse.json({
    data: {
      range: { startDate, endDate },
      metrics: {
        ...current,
        completionRate,
        goalRate,
      },
      trends: {
        completed: trend(current.completed, previous.completed),
        focusMinutes: trend(current.focusMinutes, previous.focusMinutes),
        completionRate: completionRate - previousCompletionRate,
      },
      recommendation: recommendation(current),
    },
  })
}
