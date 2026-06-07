import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { LeaderboardScope } from '@/types'

const SCOPES: LeaderboardScope[] = ['weekly', 'monthly', 'all_time']

function parseScope(value: string | null): LeaderboardScope {
  return SCOPES.includes(value as LeaderboardScope) ? (value as LeaderboardScope) : 'all_time'
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })
  }

  const scope = parseScope(request.nextUrl.searchParams.get('scope'))

  const [{ data: entries, error: listError }, { data: rankRows, error: rankError }] = await Promise.all([
    supabase.rpc('get_leaderboard', { p_scope: scope, p_limit: 100 }),
    supabase.rpc('get_my_rank', { p_scope: scope }),
  ])

  if (listError || rankError) {
    console.error('[Leaderboard] rpc error', listError?.message, rankError?.message)
    return NextResponse.json({ scope, entries: [], me: null, setup: true })
  }

  const rawEntries = Array.isArray(entries) ? entries : []

  // Fetch display_badges for all users in leaderboard
  const userIds = rawEntries.map((e: Record<string, unknown>) => e.user_id as string).filter(Boolean)
  let badgeMap: Record<string, string[]> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, badges')
      .in('id', userIds)

    if (profiles) {
      for (const p of profiles) {
        badgeMap[p.id] = (p.badges as string[] | null) ?? []
      }
    }
  }

  const enrichedEntries = rawEntries.map((e: Record<string, unknown>) => ({
    ...e,
    display_badges: badgeMap[e.user_id as string] ?? [],
  }))

  const me = Array.isArray(rankRows) && rankRows.length > 0 ? rankRows[0] : null

  return NextResponse.json({
    scope,
    entries: enrichedEntries,
    me,
  })
}
