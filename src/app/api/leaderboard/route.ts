import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { LeaderboardScope } from '@/types'

const SCOPES: LeaderboardScope[] = ['weekly', 'monthly', 'all_time']
const NEXA_FOUNDER_EMAIL = 'fauzanalfa36@gmail.com'
function founderVerified(email: unknown) { return String(email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL }

function dataClient<T>(fallback: T): T {
  try {
    return createServiceClient() as T
  } catch {
    return fallback
  }
}

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
    // Jika fitur belum di-setup, kembalikan data kosong dan flag setup.
    return NextResponse.json({ scope, entries: [], me: null, setup: true })
  }

  const me = Array.isArray(rankRows) && rankRows.length > 0 ? rankRows[0] : null
  const list = Array.isArray(entries) ? entries : []

  // get_leaderboard RPC tidak membawa email. Enrich secukupnya agar status founder
  // tetap berbasis email asli, bukan tebakan nama.
  const ids = list.map((entry: { user_id?: string }) => entry.user_id).filter(Boolean)
  let emailMap = new Map<string, string | null>()
  if (ids.length > 0) {
    const db = dataClient(supabase)
    const { data: profiles } = await db
      .from('profiles')
      .select('id, email, founder_verified')
      .in('id', ids)
    emailMap = new Map((profiles ?? []).map((p: { id: string; email: string | null; founder_verified?: boolean | null }) => [p.id, p.founder_verified ? NEXA_FOUNDER_EMAIL : p.email]))
  }

  return NextResponse.json({
    scope,
    entries: list.map((entry: { user_id?: string }) => ({
      ...entry,
      email: null,
      founder_verified: entry.user_id ? founderVerified(emailMap.get(entry.user_id)) : false,
    })),
    me,
  })
}
