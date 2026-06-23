import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkVerificationEligibility } from '@/lib/verification/eligibility'
import { isValidEvidenceUrl } from '@/lib/verification/url-validation'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const [{ data: profile }, { count: evidenceCount }, { data: completeApplication }, { data: verification }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avatar_url, campus_name, major, profile_skills, portfolio_url, github_url, is_nexa_verified')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_skill_evidence')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('nexa_arena_applications')
      .select('id')
      .eq('applicant_id', user.id)
      .not('role_applied', 'is', null)
      .maybeSingle(),
    supabase
      .from('user_verifications')
      .select('status, score, review_notes, verified_at, created_at')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const p = (profile ?? {}) as {
    full_name?: string | null; avatar_url?: string | null; campus_name?: string | null
    major?: string | null; profile_skills?: string[] | null; portfolio_url?: string | null
    github_url?: string | null; is_nexa_verified?: boolean | null
  }

  const { eligible, requirements } = checkVerificationEligibility({
    fullName: p.full_name ?? null,
    avatarUrl: p.avatar_url ?? null,
    campusName: p.campus_name ?? null,
    major: p.major ?? null,
    skillsCount: (p.profile_skills ?? []).length,
    hasProjectLink: isValidEvidenceUrl(p.portfolio_url) || isValidEvidenceUrl(p.github_url),
    evidenceCount: evidenceCount ?? 0,
    hasCompleteArenaApplication: Boolean(completeApplication),
  })

  return NextResponse.json({
    eligible,
    requirements,
    isNexaVerified: Boolean(p.is_nexa_verified),
    verification: verification ?? null,
  })
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const [{ data: profile }, { count: evidenceCount }, { data: completeApplication }, { data: existing }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avatar_url, campus_name, major, profile_skills, portfolio_url, github_url, is_nexa_verified')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_skill_evidence')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('nexa_arena_applications')
      .select('id')
      .eq('applicant_id', user.id)
      .not('role_applied', 'is', null)
      .maybeSingle(),
    supabase
      .from('user_verifications')
      .select('id, status')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const p = (profile ?? {}) as {
    full_name?: string | null; avatar_url?: string | null; campus_name?: string | null
    major?: string | null; profile_skills?: string[] | null; portfolio_url?: string | null
    github_url?: string | null; is_nexa_verified?: boolean | null
  }

  if (p.is_nexa_verified) {
    return NextResponse.json({ error: 'Akun kamu sudah terverifikasi.' }, { status: 400 })
  }

  const existingRow = existing as { id: string; status: string } | null
  if (existingRow?.status === 'pending_review') {
    return NextResponse.json({ error: 'Permintaan verifikasi kamu masih dalam review.' }, { status: 409 })
  }

  const { eligible, requirements } = checkVerificationEligibility({
    fullName: p.full_name ?? null,
    avatarUrl: p.avatar_url ?? null,
    campusName: p.campus_name ?? null,
    major: p.major ?? null,
    skillsCount: (p.profile_skills ?? []).length,
    hasProjectLink: isValidEvidenceUrl(p.portfolio_url) || isValidEvidenceUrl(p.github_url),
    evidenceCount: evidenceCount ?? 0,
    hasCompleteArenaApplication: Boolean(completeApplication),
  })

  if (!eligible) {
    return NextResponse.json({
      error: 'Belum memenuhi semua syarat verifikasi.',
      requirements,
    }, { status: 400 })
  }

  // Skor awal kasar berbasis kelengkapan syarat (bukan trust score lamaran
  // arena — ini skor verifikasi akun, dipakai admin sebagai sinyal awal saja,
  // keputusan akhir tetap manual).
  const score = Math.round((requirements.filter((r) => r.met).length / requirements.length) * 100)

  // Upsert: kalau sebelumnya 'rejected', user boleh ajukan ulang (jadi
  // 'pending_review' lagi). unique(user_id) di tabel menjamin 1 baris/user.
  const { data, error } = await supabase
    .from('user_verifications')
    .upsert(
      { user_id: user.id, status: 'pending_review', score, review_notes: null, reviewed_by: null, verified_at: null },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single()

  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  return NextResponse.json({ data }, { status: 201 })
}
