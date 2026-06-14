import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { autoBadgesForPlan } from '@/lib/badges/owner'

type RouteContext = {
  params: Promise<{ userId: string }> | { userId: string }
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

  const rows = badges || []
  const autoBadges = autoBadgesForPlan(profile?.plan, profile?.email)

  // Publik tetap hanya menampilkan pinned + auto mythos owner, bukan semua badge orang dibocorin kayak aib grup WA.
  return NextResponse.json({
    profile: profile ?? null,
    badges: rows,
    pinnedBadges: rows.filter((item) => item.is_pinned),
    autoBadges: autoBadges.filter((key) => key === 'mythos_architect'),
  })
}
