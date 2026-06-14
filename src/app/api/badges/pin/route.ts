import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUser, getUserPlanAccess } from '@/lib/billing/server'
import { BADGE_BY_KEY } from '@/lib/badges/catalog'

const MAX_PINNED_BADGES = 6

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
  const autoBadges = autoBadgesForPlan(access?.plan, user.email)

  const { data: existingRows, error: existingError } = await admin
    .from('nexa_user_badges')
    .select('badge_key,is_pinned')
    .eq('user_id', user.id)

  if (existingError && !String(existingError.message || '').includes('does not exist')) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  const existing = existingRows || []
  const earnedKeys = new Set([...existing.map((item) => item.badge_key), ...autoBadges])

  if (!earnedKeys.has(badgeKey)) {
    return NextResponse.json({ error: 'Badge ini belum kebuka. Ikutin syaratnya dulu, jangan nyolong prestasi digital.' }, { status: 403 })
  }

  if (pinned) {
    const pinnedCount = existing.filter((item) => item.is_pinned && item.badge_key !== badgeKey).length
    if (pinnedCount >= MAX_PINNED_BADGES) {
      return NextResponse.json({ error: `Maksimal ${MAX_PINNED_BADGES} badge tampil di profile. Sembunyikan salah satu dulu.` }, { status: 400 })
    }
  }

  const { error } = await admin
    .from('nexa_user_badges')
    .upsert(
      {
        user_id: user.id,
        badge_key: badgeKey,
        source: autoBadges.includes(badgeKey) ? 'auto_pin' : 'user_pin',
        is_pinned: pinned,
      },
      { onConflict: 'user_id,badge_key' }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, badge_key: badgeKey, pinned })
}
