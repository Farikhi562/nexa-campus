import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AchievementStats } from '@/lib/badges'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const [createdRes, completedRes, ontimeRes, referralRes, profileRes, rankRes] = await Promise.all(
    [
      supabase
        .from('academic_deadlines')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('academic_deadlines')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed'),
      supabase
        .from('points_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('kind', 'ontime_bonus'),
      supabase
        .from('referrals')
        .select('id', { count: 'exact', head: true })
        .eq('referrer_id', user.id),
      supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle(),
      supabase.rpc('get_my_rank', { p_scope: 'all_time' }),
    ]
  )

  const rank = Array.isArray(rankRes.data) && rankRes.data.length > 0 ? rankRes.data[0] : null
  const plan = (profileRes.data as { plan?: string } | null)?.plan ?? 'radar'

  const stats: AchievementStats = {
    created: createdRes.count ?? 0,
    completed: completedRes.count ?? 0,
    ontime: ontimeRes.count ?? 0,
    referrals: referralRes.count ?? 0,
    streak: (rank?.current_streak as number) ?? 0,
    points: (rank?.points as number) ?? 0,
    isPremium: plan !== 'radar',
  }

  return NextResponse.json({ stats })
}
