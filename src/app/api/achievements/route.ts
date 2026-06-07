import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AchievementStats } from '@/lib/badges'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const [
    createdRes, completedRes, ontimeRes, referralRes, profileRes, rankRes,
    studyRoomMemberRes, studyRoomOwnRes, focusRes, friendsRes,
  ] = await Promise.all([
    supabase.from('academic_deadlines').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('academic_deadlines').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'completed'),
    supabase.from('points_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('kind', 'ontime_bonus'),
    supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', user.id),
    supabase.from('profiles').select('plan, badges').eq('id', user.id).maybeSingle(),
    supabase.rpc('get_my_rank', { p_scope: 'all_time' }),
    // Study room joined (as member)
    supabase.from('study_room_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    // Study rooms owned
    supabase.from('study_rooms').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    // Focus sessions completed
    supabase.from('focus_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('completed', true),
    // Friends count
    supabase.from('friendships').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'accepted'),
  ])

  const rank = Array.isArray(rankRes.data) && rankRes.data.length > 0 ? rankRes.data[0] : null
  const profileData = profileRes.data as { plan?: string; badges?: string[] } | null
  const plan = profileData?.plan ?? 'radar'
  const displayBadges = profileData?.badges ?? []

  // Streak tracking: if last_streak_date is not today/yesterday, streak = 0
  const currentStreak = (rank?.current_streak as number) ?? 0
  const maxStreak = (rank?.max_streak as number) ?? currentStreak

  const stats: AchievementStats = {
    created: createdRes.count ?? 0,
    completed: completedRes.count ?? 0,
    ontime: ontimeRes.count ?? 0,
    referrals: referralRes.count ?? 0,
    streak: currentStreak,
    maxStreak,
    points: (rank?.points as number) ?? 0,
    isPremium: plan !== 'radar',
    plan,
    studyRoomJoined: studyRoomMemberRes.count ?? 0,
    studyRoomCreated: studyRoomOwnRes.count ?? 0,
    focusSessions: focusRes.count ?? 0,
    friendsCount: friendsRes.count ?? 0,
  }

  return NextResponse.json({ stats, displayBadges })
}
