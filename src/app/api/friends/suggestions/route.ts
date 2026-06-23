import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

type ProfileRow = {
  id: string; full_name: string | null; avatar_url: string | null; campus_name: string | null; major: string | null; nexa_id: string | null; featured_badge: string | null; founder_verified?: boolean | null; profile_skills?: string[] | null; created_at?: string
}

function getReadClient(fallback: Awaited<ReturnType<typeof createClient>>) {
  try { return createServiceClient() } catch { return fallback }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const db = getReadClient(supabase)
  const { data: me } = await db.from('profiles').select('id, campus_name, major, profile_skills').eq('id', user.id).maybeSingle()

  const { data: requests } = await db
    .from('friend_requests')
    .select('requester_id, receiver_id, status')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)

  const statusById: Record<string, 'pending' | 'friend'> = {}
  for (const req of (requests ?? []) as Array<{ requester_id: string; receiver_id: string; status: string }>) {
    const other = req.requester_id === user.id ? req.receiver_id : req.requester_id
    if (req.status === 'accepted') statusById[other] = 'friend'
    else if (req.status === 'pending') statusById[other] = 'pending'
  }

  const { data: profiles, error } = await db
    .from('profiles')
    .select('id, full_name, avatar_url, campus_name, major, nexa_id, featured_badge, founder_verified, profile_skills, created_at')
    .neq('id', user.id)
    .limit(80)

  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  const mySkills = new Set(Array.isArray((me as { profile_skills?: string[] | null } | null)?.profile_skills) ? (me as { profile_skills?: string[] }).profile_skills?.map((s) => s.toLowerCase()) : [])
  const result = ((profiles ?? []) as ProfileRow[]).map((p) => {
    let score = 0
    const reasons: string[] = []
    if (p.campus_name && p.campus_name === (me as { campus_name?: string | null } | null)?.campus_name) { score += 40; reasons.push('Satu kampus') }
    if (p.major && p.major === (me as { major?: string | null } | null)?.major) { score += 30; reasons.push('Satu jurusan') }
    const sharedSkills = Array.isArray(p.profile_skills) ? p.profile_skills.filter((s) => mySkills.has(s.toLowerCase())) : []
    if (sharedSkills.length > 0) { score += 15 + sharedSkills.length * 4; reasons.push('Skill mirip') }
    if (statusById[p.id] === 'friend') score -= 20
    if (statusById[p.id] === 'pending') score -= 10
    if (score === 0) { score = 5; reasons.push('Aktif di NEXA') }
    return { ...p, email: null, status: statusById[p.id] ?? 'none', score, reason: reasons.slice(0, 2).join(' · ') }
  }).sort((a, b) => b.score - a.score).slice(0, 10)

  return NextResponse.json({ data: result })
}
