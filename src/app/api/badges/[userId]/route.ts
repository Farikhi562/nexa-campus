import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { autoBadgesForPlan, isOwnerEmail } from '@/lib/badges/owner'
import { ALL_BADGE_KEYS, getProfileShowcaseBadges } from '@/lib/badges/catalog'

type RouteContext = {
  params: Promise<{ userId: string }> | { userId: string }
}

type BadgeRow = { badge_key: string; unlocked_at?: string | null; is_pinned?: boolean | null; source?: string | null }

function nowIso() {
  return new Date().toISOString()
}

function uniqueRows(rows: BadgeRow[]) {
  const seen = new Set<string>()
  const out: BadgeRow[] = []
  for (const row of rows) {
    if (!row.badge_key || seen.has(row.badge_key)) continue
    seen.add(row.badge_key)
    out.push(row)
  }
  return out
}

function rowsFromKeys(keys: string[], source = 'auto_public'): BadgeRow[] {
  const ts = nowIso()
  return keys.map((badge_key) => ({ badge_key, unlocked_at: ts, is_pinned: false, source }))
}

function defaultPinned(rows: BadgeRow[], limit = 1) {
  const pinned = rows.filter((item) => item.is_pinned)
  if (pinned.length) return pinned.slice(0, limit)
  const topKeys = getProfileShowcaseBadges(rows.map((item) => item.badge_key), limit).map((badge) => badge.key)
  const byKey = new Map(rows.map((item) => [item.badge_key, item]))
  return topKeys.map((key) => byKey.get(key)).filter(Boolean) as BadgeRow[]
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const params = await context.params
  const userId = String(params.userId || '').trim()

  if (!userId) {
    return NextResponse.json({ error: 'User id kosong.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('id,email,full_name,name,avatar_url,plan,plan_status')
    .eq('id', userId)
    .maybeSingle()

  const { data: badges, error } = await admin
    .from('nexa_user_badges')
    .select('badge_key,unlocked_at,is_pinned,source')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('unlocked_at', { ascending: false })

  if (error && !String(error.message || '').includes('does not exist')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const owner = isOwnerEmail(profile?.email)
  const dbRows = (badges || []) as BadgeRow[]
  const autoBadges = owner ? ALL_BADGE_KEYS : autoBadgesForPlan(profile?.plan, profile?.email)
  const allRows = uniqueRows([...dbRows, ...rowsFromKeys(autoBadges, owner ? 'owner_public_auto' : 'plan_public_auto')])
  const pinnedBadges = defaultPinned(allRows, 1)

  return NextResponse.json({
    profile: profile ?? null,
    badges: allRows,
    pinnedBadges,
    autoBadges,
    ownerOverride: owner,
  })
}
