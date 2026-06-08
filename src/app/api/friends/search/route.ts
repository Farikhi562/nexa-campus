import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getEffectivePlan } from '@/lib/plans'

const NEXA_FOUNDER_EMAIL = 'fauzanalfa36@gmail.com'
function founderVerified(email: unknown) { return String(email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL }

function dataClient<T>(fallback: T): T {
  try {
    return createServiceClient() as T
  } catch {
    return fallback
  }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const campus = request.nextUrl.searchParams.get('campus')?.trim() ?? ''
  const major = request.nextUrl.searchParams.get('major')?.trim() ?? ''

  // Cari Teman sengaja tidak dikunci oleh toggle leaderboard.
  // Toggle itu cuma untuk papan peringkat; search tetap butuh basic identity supaya fitur sosial hidup.
  const db = dataClient(supabase)
  let query = db
    .from('profiles')
    .select('id, email, founder_verified, full_name, campus_name, major, avatar_url, plan, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command, nexa_id, featured_badge, public_profile_headline, profile_skills, profile_skills_visibility, online_status_visibility, dm_privacy, created_at')
    .neq('id', user.id)
    .limit(30)

  if (q) {
    // Cek apakah query adalah Nexa ID (6 digit angka)
    const isNexaId = /^\d{6}$/.test(q.trim())
    if (isNexaId) {
      query = query.eq('nexa_id', q.trim())
    } else {
      const escaped = q.replace(/[%_]/g, '')
      query = query.or(`full_name.ilike.%${escaped}%,campus_name.ilike.%${escaped}%,major.ilike.%${escaped}%`)
    }
  }
  if (campus) query = query.ilike('campus_name', `%${campus}%`)
  if (major) query = query.ilike('major', `%${major}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sanitized = (data ?? []).map((row) => ({
    ...row,
    email: null,
    founder_verified: founderVerified((row as { email?: string | null }).email) || Boolean((row as { founder_verified?: boolean | null }).founder_verified),
    plan: getEffectivePlan(row as never),
    profile_skills: row.profile_skills_visibility === 'private' ? [] : row.profile_skills ?? [],
  }))

  return NextResponse.json({ data: sanitized })
}
