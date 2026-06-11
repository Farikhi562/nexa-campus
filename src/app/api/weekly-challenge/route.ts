import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function startOfWeekJakarta() {
  const now = new Date()
  const jakarta = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const day = jakarta.getDay() || 7
  jakarta.setDate(jakarta.getDate() - day + 1)
  jakarta.setHours(0, 0, 0, 0)
  return jakarta
}

async function safeCount(query: PromiseLike<{ count: number | null }>) {
  try {
    const result = await query
    return result.count ?? 0
  } catch { return 0 }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const start = startOfWeekJakarta()
  const startIso = start.toISOString()
  const weekLabel = start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

  const [completedDeadlines, checkins, friends, rooms, arena] = await Promise.all([
    safeCount(supabase.from('academic_deadlines').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed').gte('updated_at', startIso)),
    safeCount(supabase.from('daily_checkins').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('activity_date', start.toISOString().slice(0, 10))),
    safeCount(supabase.from('friend_requests').select('id', { count: 'exact', head: true }).eq('status', 'accepted').or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`).gte('updated_at', startIso)),
    safeCount(supabase.from('study_room_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('joined_at', startIso)),
    safeCount(supabase.from('nexa_arena_applications').select('id', { count: 'exact', head: true }).eq('applicant_id', user.id).gte('created_at', startIso)),
  ])

  const missions = [
    { id: 'deadline_3', label: 'Selesaikan 3 deadline', current: completedDeadlines, goal: 3, href: '/dashboard', reward: '+60 poin' },
    { id: 'pulse_5', label: 'Daily Pulse 5 hari', current: checkins, goal: 5, href: '/dashboard', reward: 'Progress streak' },
    { id: 'friend_1', label: 'Tambah 1 teman', current: friends, goal: 1, href: '/dashboard/friends', reward: '+20 poin sosial' },
    { id: 'room_1', label: 'Gabung 1 Study Room', current: rooms, goal: 1, href: '/dashboard/study-room', reward: 'Progress study partner' },
    { id: 'arena_1', label: 'Daftar 1 Arena', current: arena, goal: 1, href: '/dashboard/arena', reward: 'Progress Arena' },
  ]
  const done = missions.filter((m) => m.current >= m.goal).length

  return NextResponse.json({ weekLabel, missions, done, total: missions.length })
}
