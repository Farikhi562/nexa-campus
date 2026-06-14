import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, getUserPlanAccess } from '@/lib/billing/server'
import { autoBadgesForPlan, isOwnerEmail } from '@/lib/badges/owner'
import { syncUnlockedBadgesForUser } from '@/lib/badges/sync'
import { ALL_BADGE_KEYS, getProfileShowcaseBadges } from '@/lib/badges/catalog'

type BadgeRow = { badge_key: string; unlocked_at?: string | null; is_pinned?: boolean | null; source?: string | null }

function nowIso() {
  return new Date().toISOString()
}

function rowsFromKeys(keys: string[], source = 'auto_me'): BadgeRow[] {
  const ts = nowIso()
  return keys.map((badge_key) => ({ badge_key, unlocked_at: ts, is_pinned: false, source }))
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

function defaultPinned(rows: BadgeRow[], limit = 6) {
  const pinned = rows.filter((item) => item.is_pinned)
  if (pinned.length) return pinned.slice(0, limit)
  const topKeys = getProfileShowcaseBadges(rows.map((item) => item.badge_key), limit).map((badge) => badge.key)
  const byKey = new Map(rows.map((item) => [item.badge_key, item]))
  return topKeys.map((key) => byKey.get(key)).filter(Boolean) as BadgeRow[]
}

export async function GET() {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ error: 'Login dulu buat lihat badge.' }, { status: 401 })
  }

  const access = await getUserPlanAccess({ supabase, user })
  const admin = createAdminClient()

  // Auto-sync ringan supaya user yang sudah memenuhi syarat nggak harus ritual klik berkali-kali.
  await syncUnlockedBadgesForUser({ admin, user: { id: user.id, email: user.email }, profile: access?.profile }).catch(() => null)

  const { data: badges, error } = await admin
    .from('nexa_user_badges')
    .select('badge_key,unlocked_at,is_pinned,source')
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('unlocked_at', { ascending: false })

  if (error && !String(error.message || '').includes('does not exist')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const owner = isOwnerEmail(user.email || access?.profile?.email)
  const autoBadges = owner ? ALL_BADGE_KEYS : autoBadgesForPlan(access?.plan, user.email)
  const allRows = uniqueRows([...(badges || []), ...rowsFromKeys(autoBadges, owner ? 'owner_me_auto' : 'plan_me_auto')])
  const pinnedBadges = defaultPinned(allRows, 6)

  return NextResponse.json({
    profile: access?.profile ?? null,
    plan: access?.plan ?? 'radar',
    badges: allRows,
    pinnedBadges,
    autoBadges,
    ownerOverride: owner,
  })
}
