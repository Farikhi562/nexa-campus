import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, getUserPlanAccess } from '@/lib/billing/server'

function normalizeEmail(email?: string | null) {
  return (email || '').trim().toLowerCase()
}

function envEmailList(value?: string) {
  return (value || '')
    .split(',')
    .map((item) => normalizeEmail(item))
    .filter(Boolean)
}

function ownerEmails() {
  return [
    ...envEmailList(process.env.NEXA_OWNER_EMAILS),
    ...envEmailList(process.env.COMMAND_LIFETIME_EMAILS),
    ...envEmailList(process.env.ADMIN_EMAILS),
  ]
}

function autoBadgesForPlan(plan?: string | null, email?: string | null) {
  const badges = new Set<string>()
  const normalizedEmail = normalizeEmail(email)

  if (plan === 'command') badges.add('command_elite')
  if (ownerEmails().includes(normalizedEmail)) badges.add('mythos_architect')

  return Array.from(badges)
}

export async function GET() {
  const supabase = await createClient()
  const user = await getCurrentUser(supabase)

  if (!user) {
    return NextResponse.json({ error: 'Login dulu buat lihat badge.' }, { status: 401 })
  }

  const access = await getUserPlanAccess({ supabase, user })
  const admin = createAdminClient()

  const { data: badges, error } = await admin
    .from('nexa_user_badges')
    .select('badge_key,unlocked_at,is_pinned,source')
    .eq('user_id', user.id)
    .order('is_pinned', { ascending: false })
    .order('unlocked_at', { ascending: false })

  if (error && !String(error.message || '').includes('does not exist')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const autoBadges = autoBadgesForPlan(access?.plan, user.email)

  return NextResponse.json({
    profile: access?.profile ?? null,
    plan: access?.plan ?? 'radar',
    badges: badges || [],
    autoBadges,
  })
}
