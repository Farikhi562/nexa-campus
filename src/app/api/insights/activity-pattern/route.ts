import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * "NEXA belajar dari histori kamu" — bukan model AI/ML beneran, tapi
 * agregasi jujur dari histori deadline yang sudah user selesaikan sendiri:
 * jam berapa dia paling sering nyelesain deadline, hari apa paling
 * produktif, dan apakah completion rate-nya lagi naik/turun dibanding
 * 4 minggu terakhir. Dipakai buat kasih 1 saran konkret (jam reminder)
 * yang beneran didasarkan data user itu sendiri, bukan template generik.
 */

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

function jakartaHour(iso: string): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', hour: '2-digit', hour12: false }).format(new Date(iso)))
}
function jakartaWeekday(iso: string): number {
  const label = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'short' }).format(new Date(iso))
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(label)
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const since = new Date()
  since.setDate(since.getDate() - 56) // 8 minggu terakhir cukup buat lihat pola tanpa data terlalu basi

  const { data: deadlines } = await supabase
    .from('academic_deadlines')
    .select('status, updated_at, created_at')
    .eq('user_id', user.id)
    .gte('created_at', since.toISOString())

  const rows = deadlines ?? []
  const completed = rows.filter((d) => d.status === 'completed' && d.updated_at)

  const MIN_SAMPLE = 5
  if (completed.length < MIN_SAMPLE) {
    return NextResponse.json({
      data: {
        enoughData: false,
        sampleSize: completed.length,
        minSample: MIN_SAMPLE,
      },
    })
  }

  // Jam berapa paling sering nyelesain deadline
  const hourBuckets = new Array(24).fill(0)
  const dayBuckets = new Array(7).fill(0)
  for (const d of completed) {
    hourBuckets[jakartaHour(d.updated_at as string)]++
    dayBuckets[jakartaWeekday(d.updated_at as string)]++
  }
  const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets))
  const peakDay = dayBuckets.indexOf(Math.max(...dayBuckets))

  // Saran jam reminder: 2 jam sebelum jam biasa dia ngerjain, dibulatkan, dibatasi jam wajar (06.00–22.00)
  const suggestedHour = Math.min(22, Math.max(6, peakHour - 2))
  const suggestedTime = `${String(suggestedHour).padStart(2, '0')}:00`

  // Trend completion rate: 4 minggu terakhir vs 4 minggu sebelumnya
  const midpoint = new Date()
  midpoint.setDate(midpoint.getDate() - 28)
  const recentRows = rows.filter((d) => new Date(d.created_at as string) >= midpoint)
  const olderRows = rows.filter((d) => new Date(d.created_at as string) < midpoint)
  const rate = (arr: typeof rows) => arr.length > 0 ? Math.round((arr.filter((d) => d.status === 'completed').length / arr.length) * 100) : null
  const recentRate = rate(recentRows)
  const olderRate = rate(olderRows)

  return NextResponse.json({
    data: {
      enoughData: true,
      sampleSize: completed.length,
      peakHour,
      peakDayLabel: HARI[peakDay],
      suggestedTime,
      recentRate,
      olderRate,
      trendDelta: recentRate !== null && olderRate !== null ? recentRate - olderRate : null,
    },
  })
}
