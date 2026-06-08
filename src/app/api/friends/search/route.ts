import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const NEXA_FOUNDER_EMAIL = 'fauzanalfa36@gmail.com'
function founderVerified(email: unknown) { return String(email ?? '').trim().toLowerCase() === NEXA_FOUNDER_EMAIL }

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''
  const campus = request.nextUrl.searchParams.get('campus')?.trim() ?? ''
  const major = request.nextUrl.searchParams.get('major')?.trim() ?? ''

  // Select email only server-side to compute founder verification. Response keeps email hidden.
  let query = supabase
    .from('profiles')
    .select('id, email, full_name, campus_name, major, avatar_url, plan, nexa_id, featured_badge, public_profile_headline, profile_skills, profile_skills_visibility, online_status_visibility, dm_privacy, created_at')
    .eq('is_public_profile', true)
    .neq('id', user.id)
    .limit(30)

  if (q) {
    // Cek apakah query adalah Nexa ID (6 digit angka)
    const isNexaId = /^\d{6}$/.test(q.trim())
    if (isNexaId) {
      query = query.eq('nexa_id', q.trim())
    } else {
      query = query.ilike('full_name', `%${q}%`)
    }
  }
  if (campus) query = query.ilike('campus_name', `%${campus}%`)
  if (major) query = query.ilike('major', `%${major}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sanitized = (data ?? []).map((row) => ({
    ...row,
    email: null,
    founder_verified: founderVerified((row as { email?: string | null }).email),
    profile_skills: row.profile_skills_visibility === 'private' ? [] : row.profile_skills ?? [],
  }))

  return NextResponse.json({ data: sanitized })
}
