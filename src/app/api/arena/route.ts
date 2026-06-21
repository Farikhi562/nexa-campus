import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ArenaPostRow = Record<string, unknown> & { id: string; creator_id: string }
type ArenaApplicationRow = { post_id: string; status: string }
type ArenaTeamMemberRow = { post_id: string; user_id: string; role: string; joined_at: string }

const ALLOWED_TYPES = new Set(['hackathon', 'bisnis', 'saintek', 'desain', 'akademik', 'seni', 'esport', 'olahraga', 'lainnya'])

function text(value: unknown, max = 2000) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function skills(value: unknown) {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean))).slice(0, 12)
}

function normalizeSkill(value: string) {
  return value.trim().toLowerCase()
}

function matchSkills(needed: unknown, owned: string[]) {
  const ownedSet = new Set(owned.map(normalizeSkill).filter(Boolean))
  const neededSkills = skills(needed)
  const matched = neededSkills.filter((skill) => ownedSet.has(normalizeSkill(skill)))
  return {
    matching_skills: matched,
    match_score: neededSkills.length > 0 ? Math.round((matched.length / neededSkills.length) * 100) : 0,
  }
}

function optionalDate(value: unknown) {
  const raw = text(value, 20)
  return raw ? raw : null
}

function buildPostPayload(body: Record<string, unknown>) {
  const title = text(body.title, 160)
  const competitionType = text(body.competition_type, 30)
  return {
    title,
    competition_name: text(body.competition_name, 160) || null,
    competition_type: ALLOWED_TYPES.has(competitionType) ? competitionType : 'lainnya',
    description: text(body.description, 3000) || null,
    skills_needed: skills(body.skills_needed),
    team_size_max: typeof body.team_size_max === 'number' ? Math.min(20, Math.max(2, Math.floor(body.team_size_max))) : 4,
    deadline_registration: optionalDate(body.deadline_registration),
    event_date: optionalDate(body.event_date),
    prize: text(body.prize, 200) || null,
    link_info: text(body.link_info, 500) || null,
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  const type = req.nextUrl.searchParams.get('type') ?? ''

  const { data: me } = await supabase
    .from('profiles')
    .select('profile_skills')
    .eq('id', user.id)
    .maybeSingle()
  const mySkills = skills((me as { profile_skills?: unknown } | null)?.profile_skills)

  let query = supabase
    .from('nexa_arena_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (q) query = query.or(`title.ilike.%${q}%,competition_name.ilike.%${q}%,description.ilike.%${q}%`)
  if (type) query = query.eq('competition_type', type)

  const { data: posts, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (posts ?? []) as ArenaPostRow[]
  const postIds = rows.map((row) => row.id)
  const creatorIds = Array.from(new Set(rows.map((row) => row.creator_id)))

  const creatorMap: Record<string, { full_name: string | null; featured_badge: string | null }> = {}
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, featured_badge')
      .in('id', creatorIds)

    for (const profile of (profiles ?? []) as Array<{ id: string; full_name: string | null; featured_badge: string | null }>) {
      creatorMap[profile.id] = {
        full_name: profile.full_name ?? 'User',
        featured_badge: profile.featured_badge ?? null,
      }
    }
  }

  const myApplicationMap: Record<string, string> = {}
  if (postIds.length > 0) {
    const { data: myApps } = await supabase
      .from('nexa_arena_applications')
      .select('post_id, status')
      .eq('applicant_id', user.id)
      .in('post_id', postIds)

    for (const app of (myApps ?? []) as ArenaApplicationRow[]) {
      myApplicationMap[app.post_id] = app.status
    }
  }

  const applicationCounts: Record<string, { total: number; pending: number }> = {}
  if (postIds.length > 0) {
    const { data: apps } = await supabase
      .from('nexa_arena_applications')
      .select('post_id, status')
      .in('post_id', postIds)

    for (const app of (apps ?? []) as ArenaApplicationRow[]) {
      applicationCounts[app.post_id] ??= { total: 0, pending: 0 }
      applicationCounts[app.post_id].total += 1
      if (app.status === 'pending') applicationCounts[app.post_id].pending += 1
    }
  }

  const memberRowsByPost: Record<string, ArenaTeamMemberRow[]> = {}
  if (postIds.length > 0) {
    const { data: members } = await supabase
      .from('nexa_arena_team_members')
      .select('post_id, user_id, role, joined_at')
      .in('post_id', postIds)
      .order('joined_at', { ascending: true })

    for (const member of (members ?? []) as ArenaTeamMemberRow[]) {
      memberRowsByPost[member.post_id] ??= []
      memberRowsByPost[member.post_id].push(member)
    }
  }

  const memberUserIds = Array.from(new Set(Object.values(memberRowsByPost).flat().map((member) => member.user_id)))
  const memberProfileMap: Record<string, { id: string; full_name: string | null; avatar_url: string | null; nexa_id: string | null; featured_badge: string | null; is_nexa_verified: boolean | null }> = {}
  if (memberUserIds.length > 0) {
    const { data: memberProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, nexa_id, featured_badge, is_nexa_verified')
      .in('id', memberUserIds)
    for (const profile of (memberProfiles ?? []) as Array<{ id: string; full_name: string | null; avatar_url: string | null; nexa_id: string | null; featured_badge: string | null; is_nexa_verified: boolean | null }>) {
      memberProfileMap[profile.id] = profile
    }
  }

  return NextResponse.json({
    data: rows.map((row) => {
      const match = matchSkills(row.skills_needed, mySkills)
      return {
        ...row,
        ...match,
        creator_name: creatorMap[row.creator_id]?.full_name ?? null,
        creator_featured_badge: creatorMap[row.creator_id]?.featured_badge ?? null,
        has_applied: Boolean(myApplicationMap[row.id]),
        my_application_status: myApplicationMap[row.id] ?? null,
        applications_count: applicationCounts[row.id]?.total ?? 0,
        pending_applications_count: applicationCounts[row.id]?.pending ?? 0,
        team_members: (memberRowsByPost[row.id] ?? []).map((member) => ({ ...member, profile: memberProfileMap[member.user_id] ?? null })),
      }
    }),
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid.' }, { status: 400 }) }

  const payload = buildPostPayload(body)
  if (!payload.title) return NextResponse.json({ error: 'Judul wajib diisi.' }, { status: 400 })

  const { data, error } = await supabase
    .from('nexa_arena_posts')
    .insert({ creator_id: user.id, ...payload })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('nexa_arena_team_members').upsert({
    post_id: data.id,
    user_id: user.id,
    role: 'creator',
    joined_at: new Date().toISOString(),
  }, { onConflict: 'post_id,user_id' }).then(undefined, () => null)

  await supabase.from('points_events').insert({
    user_id: user.id,
    kind: 'arena_post_created',
    points: 10,
    metadata: { post_id: data.id },
  }).then(undefined, () => null)

  return NextResponse.json({ data }, { status: 201 })
}
