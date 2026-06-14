import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

type RouteContext = {
  params: Promise<{ userId: string }> | { userId: string }
}

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

function autoBadgesForProfile(profile: any) {
  const badges = new Set<string>()
  const email = normalizeEmail(profile?.email)

  if (profile?.plan === 'command' && profile?.plan_status === 'active') badges.add('command_elite')
  if (ownerEmails().includes(email)) badges.add('mythos_architect')

  return Array.from(badges)
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

  return NextResponse.json({
    profile: profile ?? null,
    badges: rows,
    pinnedBadges: rows.filter((item) => item.is_pinned),
    autoBadges: autoBadgesForProfile(profile),
  })
}
