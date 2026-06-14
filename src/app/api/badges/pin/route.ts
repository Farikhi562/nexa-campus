import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, getUserPlanAccess } from '@/lib/billing/server'
import { BADGE_BY_KEY } from '@/lib/badges/catalog'
import { autoBadgesForPlan } from '@/lib/badges/owner'
import { syncUnlockedBadgesForUser } from '@/lib/badges/sync'

const MAX_PINNED_BADGES = 1

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ error: 'Login dulu buat ngatur badge profile.' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const badgeKey = String(body.badge_key || '').trim()
  const pinned = Boolean(body.pinned)

  if (!BADGE_BY_KEY[badgeKey]) {
    return NextResponse.json({ error: 'Badge tidak valid.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const access = await getUserPlanAccess({ supabase, user })

  // Sync dulu, biar user yang sudah memenuhi syarat tidak ditolak cuma gara-gara badge belum pernah diinsert.
  const sync = await syncUnlockedBadgesForUser({ admin, user, profile: access?.profile ?? null })
  const autoBadges = autoBadgesForPlan(access?.plan, user.email)

  const { data: existingRows, error: existingError } = await admin
    .from('nexa_user_badges')
    .select('badge_key,is_pinned')
    .eq('user_id', user.id)

  if (existingError && !String(existingError.message || '').includes('does not exist')) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  const existing = existingRows || []
  const earnedKeys = new Set([...existing.map((item) => item.badge_key), ...autoBadges, ...(sync.unlockedKeys || [])])

  if (!earnedKeys.has(badgeKey)) {
    return NextResponse.json({ error: 'Badge ini belum kebuka. Klik badge buat lihat syaratnya dulu, jangan cosplay jadi legenda prematur.' }, { status: 403 })
  }

  if (!pinned) {
    const { error } = await admin
      .from('nexa_user_badges')
      .update({ is_pinned: false })
      .eq('user_id', user.id)
      .eq('badge_key', badgeKey)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, badge_key: badgeKey, pinned: false, maxPinned: MAX_PINNED_BADGES })
  }

  // Single-showcase rule: pilih 1 badge utama saja. Semua badge lama dipadamkan dulu, baru badge ini dinyalakan.
  const { error: unpinError } = await admin
    .from('nexa_user_badges')
    .update({ is_pinned: false })
    .eq('user_id', user.id)

  if (unpinError) {
    return NextResponse.json({ error: unpinError.message }, { status: 500 })
  }

  const { error } = await admin
    .from('nexa_user_badges')
    .upsert(
      {
        user_id: user.id,
        badge_key: badgeKey,
        source: autoBadges.includes(badgeKey) ? 'auto_main_badge' : 'user_main_badge',
        is_pinned: true,
      },
      { onConflict: 'user_id,badge_key' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, badge_key: badgeKey, pinned: true, maxPinned: MAX_PINNED_BADGES })
}
