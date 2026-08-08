import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { autoBadgesForPlan, isOwnerEmail } from '@/lib/badges/owner'
import { ALL_BADGE_KEYS, getProfileShowcaseBadges } from '@/lib/badges/catalog'

type BadgeRow = { badge_key: string; unlocked_at?: string | null; is_pinned?: boolean | null; source?: string | null }
type ProfileRow = { id: string; email?: string | null; full_name?: string | null; name?: string | null; avatar_url?: string | null; plan?: string | null; plan_status?: string | null }

// Batas jumlah id per request biar query tetap ringan & nggak disalahgunakan jadi full-table scan.
const MAX_IDS = 100

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

function parseIds(req: NextRequest): string[] {
  const raw = req.nextUrl.searchParams.get('ids') || ''
  const ids = raw
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  return Array.from(new Set(ids)).slice(0, MAX_IDS)
}

export async function GET(req: NextRequest) {
  const ids = parseIds(req)

  if (!ids.length) {
    return NextResponse.json({ error: 'Parameter ids kosong. Contoh: /api/badges/batch?ids=id1,id2' }, { status: 400 })
  }

  const admin = createAdminClient()

  const [{ data: profiles }, { data: badges, error }] = await Promise.all([
    admin.from('profiles').select('id,email,full_name,name,avatar_url,plan,plan_status').in('id', ids),
    admin.from('nexa_user_badges').select('user_id,badge_key,unlocked_at,is_pinned,source').in('user_id', ids),
  ])

  if (error && !String(error.message || '').includes('does not exist')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const profileById = new Map<string, ProfileRow>((profiles || []).map((p: ProfileRow) => [p.id, p]))
  const badgesByUser = new Map<string, BadgeRow[]>()
  for (const row of (badges || []) as Array<BadgeRow & { user_id: string }>) {
    const list = badgesByUser.get(row.user_id) || []
    list.push(row)
    badgesByUser.set(row.user_id, list)
  }

  const result: Record<string, {
    profile: ProfileRow | null
    badges: BadgeRow[]
    pinnedBadges: BadgeRow[]
    autoBadges: string[]
    ownerOverride: boolean
  }> = {}

  for (const id of ids) {
    const profile = profileById.get(id) ?? null
    const owner = isOwnerEmail(profile?.email)
    const dbRows = badgesByUser.get(id) || []
    const autoBadges = owner ? ALL_BADGE_KEYS : autoBadgesForPlan(profile?.plan, profile?.email)
    const allRows = uniqueRows([...dbRows, ...rowsFromKeys(autoBadges, owner ? 'owner_public_auto' : 'plan_public_auto')])
    const pinnedBadges = defaultPinned(allRows, 1)

    result[id] = {
      profile,
      badges: allRows,
      pinnedBadges,
      autoBadges,
      ownerOverride: owner,
    }
  }

  return NextResponse.json({ results: result })
}
