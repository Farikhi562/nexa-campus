import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAchievementStatsFor } from '@/lib/achievement-stats'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  // Logic perhitungan stats dipindah ke lib/achievement-stats.ts (dipakai
  // bersama oleh /api/profile/[id] dan /api/profile/me untuk fix bug badge
  // tidak konsisten — lihat README). Perilaku endpoint ini TIDAK berubah.
  const stats = await getAchievementStatsFor(user.id, user.email)

  return NextResponse.json({ stats })
}
