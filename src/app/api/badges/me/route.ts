import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, getUserPlanAccess } from '@/lib/billing/server'
import { autoBadgesForPlan } from '@/lib/badges/owner'
import { syncUnlockedBadgesForUser } from '@/lib/badges/sync'

export async function GET() {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ error: 'Login dulu buat lihat badge.' }, { status: 401 })
  }

  const access = await getUserPlanAccess({ supabase, user })
  const admin = createAdminClient()

  // Auto-sync setiap user buka halaman badge. Jadi kalau syarat udah terpenuhi, badge kebuka tanpa nunggu admin meniup terompet database.
  const sync = await syncUnlockedBadgesForUser({ admin, user, profile: access?.profile ?? null })

  const { data: badges, error } = await admin
    .from('nexa_user_badges')
    .select('badge_key,unlocked_at,is_pinned,source,metadata')
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('unlocked_at', { ascending: false })

  if (error && !String(error.message || '').includes('does not exist')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = badges || []
  const autoBadges = autoBadgesForPlan(access?.plan, user.email)

  return NextResponse.json({
    profile: access?.profile ?? null,
    plan: access?.plan ?? 'radar',
    badges: rows,
    pinnedBadges: rows.filter((item) => item.is_pinned),
    autoBadges: Array.from(new Set([...(sync.autoBadges || []), ...autoBadges])),
    syncedUnlockedKeys: sync.unlockedKeys,
    stats: sync.stats,
    syncError: sync.error,
    maxPinned: 6,
  })
}
