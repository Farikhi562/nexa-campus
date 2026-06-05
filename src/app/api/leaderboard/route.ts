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
    // Jangan 500 — fitur belum di-setup. Kembalikan kosong + flag setup.
    return NextResponse.json({ scope, entries: [], me: null, setup: true })
  }

  const me = Array.isArray(rankRows) && rankRows.length > 0 ? rankRows[0] : null

  return NextResponse.json({
    scope,
    entries: Array.isArray(entries) ? entries : [],
    me,
  })
}
