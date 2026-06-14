import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, getUserPlanAccess } from '@/lib/billing/server'
import { syncUnlockedBadgesForUser } from '@/lib/badges/sync'

export async function POST() {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ error: 'Login dulu buat sync badge.' }, { status: 401 })
  }

  const access = await getUserPlanAccess({ supabase, user })
  const admin = createAdminClient()
  const sync = await syncUnlockedBadgesForUser({ admin, user, profile: access?.profile ?? null })

  return NextResponse.json({
    ok: !sync.error,
    unlockedKeys: sync.unlockedKeys,
    autoBadges: sync.autoBadges,
    stats: sync.stats,
    error: sync.error,
  })
}
