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

// Poin per misi. Cuma misi yang beneran punya reward poin (bukan "Progress ...",
// yang sudah dapat poin dari sistemnya sendiri — streak, arena, study room) yang
// di-award di sini, biar nggak dobel hitung.
const MISSION_POINTS: Record<string, number> = {
  deadline_3: 60,
  friend_1: 20,
}
const WEEKLY_COMPLETE_BONUS = 50

function refFor(missionId: string, weekStart: Date) {
  return `weekly_mission:${missionId}:${weekStart.toISOString().slice(0, 10)}`
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
  const allDone = done === missions.length

  // Award poin buat tiap misi yang baru selesai. Idempoten lewat unique index
  // (user_id, kind, ref) di points_events — aman dipanggil berkali-kali tiap GET,
  // pola yang sama dengan auto-sync badge di /api/badges/me.
  const awardPromises: Array<Promise<unknown>> = []
  for (const mission of missions) {
    const points = MISSION_POINTS[mission.id]
    if (!points || mission.current < mission.goal) continue
    awardPromises.push(
      supabase.rpc('award_points', { p_kind: 'weekly_mission', p_points: points, p_ref: refFor(mission.id, start) }).then(undefined, () => null),
    )
  }
  if (allDone) {
    awardPromises.push(
      supabase.rpc('award_points', { p_kind: 'weekly_challenge_complete', p_points: WEEKLY_COMPLETE_BONUS, p_ref: `weekly_challenge_complete:${start.toISOString().slice(0, 10)}` }).then(undefined, () => null),
    )
  }
  await Promise.all(awardPromises)

  // Total poin yang sudah beneran didapat minggu ini dari misi (buat ditampilkan
  // di UI, jadi bukan cuma janji "+60 poin" tapi angka yang benar-benar masuk).
  const pointsThisWeek = await supabase
    .from('points_events')
    .select('points')
    .eq('user_id', user.id)
    .gte('created_at', startIso)
    .in('kind', ['weekly_mission', 'weekly_challenge_complete'])
    .then(
      (res) => (res.data ?? []).reduce((total: number, item: { points?: number | null }) => total + (item.points ?? 0), 0),
      () => 0,
    )

  return NextResponse.json({ weekLabel, missions, done, total: missions.length, rewardClaimed: allDone, pointsThisWeek })
}
