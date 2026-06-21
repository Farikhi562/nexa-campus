import { redirect } from 'next/navigation'
import FocusMode from '@/components/dashboard/FocusMode'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Focus Mode · NEXA Campus',
  description: 'Timer Pomodoro untuk fokus mengerjakan tugas. Selesaikan sesi fokus harian dan kumpulkan poin.',
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default async function FocusPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Ambil riwayat 7 hari terakhir buat strip "minggu ini" — data ASLI dari
  // points_events (kind='focus_session', 1 baris/hari karena ref unik per
  // tanggal), bukan dummy. RLS sudah mengizinkan user baca baris miliknya
  // sendiri (points_events_select_own).
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  const { data: focusEvents } = await supabase
    .from('points_events')
    .select('ref, created_at')
    .eq('user_id', user.id)
    .eq('kind', 'focus_session')
    .gte('created_at', sevenDaysAgo.toISOString())

  const activeDates = new Set(
    (focusEvents ?? []).map((row) => {
      const ref = (row as { ref?: string | null }).ref
      // ref selalu berformat "focus-YYYY-MM-DD" (lihat /api/focus/complete).
      if (ref?.startsWith('focus-')) return ref.slice(6)
      return isoDate(new Date((row as { created_at: string }).created_at))
    })
  )

  const weekActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sevenDaysAgo)
    d.setDate(d.getDate() + i)
    return { date: isoDate(d), active: activeDates.has(isoDate(d)) }
  })

  return <FocusMode weekActivity={weekActivity} todayDone={activeDates.has(isoDate(today))} />
}
