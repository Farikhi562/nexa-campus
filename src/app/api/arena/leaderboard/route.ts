import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const limit = Math.min(Number(request.nextUrl.searchParams.get('limit') || 20), 50)
  const type = request.nextUrl.searchParams.get('type')?.trim() || ''

  let query = supabase
    .from('nexa_arena_team_leaderboard')
    .select('post_id, title, competition_name, competition_type, campus_name, placement, verified, member_count, members_points, team_score')
    .order('team_score', { ascending: false })
    .limit(limit)

  if (type) query = query.eq('competition_type', type)

  const { data: teams, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Badge kompetisi milik user yang sedang login.
  const { data: myBadges } = await supabase
    .from('nexa_arena_user_badges')
    .select('post_id, title, competition_name, placement, verified, badge_label, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    teams: (teams ?? []).map((t, i) => ({ ...t, rank: i + 1 })),
    myBadges: myBadges ?? [],
  })
}
