import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isArenaRole, ROLE_CONFIG } from '@/lib/verification/role-config'
import { computeTrustScore } from '@/lib/verification/trust-score'
import { isValidEvidenceUrl } from '@/lib/verification/url-validation'

type Params = { params: Promise<{ id: string }> }

function text(value: unknown, max = 2000) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

function skills(value: unknown) {
  if (!Array.isArray(value)) return []
  return Array.from(new Set(value.map((item) => String(item).trim()).filter(Boolean))).slice(0, 12)
}

const EVIDENCE_TYPE_SET = new Set(['github', 'portfolio', 'certificate', 'file', 'screenshot', 'document', 'other'])

type EvidenceLink = { type: string; url: string; label: string }

/** Parse & validasi evidence_links dari body — tolak entry dengan URL tidak valid (spec G). */
function parseEvidenceLinks(value: unknown): { links: EvidenceLink[]; invalidCount: number } {
  if (!Array.isArray(value)) return { links: [], invalidCount: 0 }
  const links: EvidenceLink[] = []
  let invalidCount = 0
  for (const raw of value.slice(0, 10)) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Record<string, unknown>
    const type = EVIDENCE_TYPE_SET.has(String(item.type)) ? String(item.type) : 'other'
    const url = typeof item.url === 'string' ? item.url.trim() : ''
    const label = typeof item.label === 'string' ? item.label.trim().slice(0, 120) : ''
    if (!url) continue
    if (!isValidEvidenceUrl(url)) {
      invalidCount++
      continue
    }
    links.push({ type, url, label })
  }
  return { links, invalidCount }
}

/** Parse competency_answers, dibatasi hanya key pertanyaan yang sah untuk role ini. */
function parseCompetencyAnswers(value: unknown, role: string): Record<string, string> {
  if (!value || typeof value !== 'object' || !isArenaRole(role)) return {}
  const validKeys = new Set(ROLE_CONFIG[role].competencyQuestions.map((q) => q.key))
  const out: Record<string, string> = {}
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (!validKeys.has(key)) continue
    if (typeof val !== 'string') continue
    out[key] = val.trim().slice(0, 1000)
  }
  return out
}

async function notifyOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  creatorId: string,
  applicantId: string,
  postTitle: string
) {
  const { data: applicant } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', applicantId)
    .maybeSingle()

  const applicantName = (applicant as { full_name?: string | null } | null)?.full_name || 'Mahasiswa NEXA'
  await supabase.from('notifications').insert({
    user_id: creatorId,
    type: 'arena_application',
    title: 'Pelamar baru di NEXA Arena',
    message: `${applicantName} melamar ke postingan "${postTitle}". Cek latar belakang dan skill-nya dulu.`,
    link: '/dashboard/arena',
    is_read: false,
  })
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: post } = await supabase
    .from('nexa_arena_posts')
    .select('creator_id, title, status, current_team_size, team_size_max')
    .eq('id', id)
    .maybeSingle()

  if (!post) return NextResponse.json({ error: 'Post tidak ditemukan.' }, { status: 404 })

  const arenaPost = post as { creator_id: string; title: string; status: string; current_team_size: number; team_size_max: number }
  if (arenaPost.creator_id === user.id) return NextResponse.json({ error: 'Tidak bisa melamar ke post sendiri.' }, { status: 400 })
  if (arenaPost.status !== 'open') return NextResponse.json({ error: 'Post sudah ditutup.' }, { status: 400 })
  if (arenaPost.current_team_size >= arenaPost.team_size_max) return NextResponse.json({ error: 'Tim sudah penuh.' }, { status: 400 })

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* tetap bisa fallback */ }

  const applicantBackground = text(body.applicant_background, 2500)
  const skillsOffered = skills(body.skills_offered)
  const portfolioUrl = text(body.portfolio_url, 500)

  if (!applicantBackground) {
    return NextResponse.json({ error: 'Latar belakang wajib diisi supaya owner bisa menilai kamu.' }, { status: 400 })
  }
  if (skillsOffered.length === 0) {
    return NextResponse.json({ error: 'Minimal isi 1 skill yang kamu tawarkan.' }, { status: 400 })
  }
  if (portfolioUrl && !isValidEvidenceUrl(portfolioUrl)) {
    return NextResponse.json({ error: 'Link portfolio tidak valid (harus diawali http:// atau https://).' }, { status: 400 })
  }

  // --- Role-based application (spec A.2) ---
  const roleApplied = isArenaRole(body.role_applied) ? body.role_applied : null
  if (!roleApplied) {
    return NextResponse.json({ error: 'Pilih role yang kamu lamar dulu.' }, { status: 400 })
  }

  // --- Skill evidence (spec A.1) ---
  const { links: evidenceLinks, invalidCount: invalidEvidenceCount } = parseEvidenceLinks(body.evidence_links)
  if (invalidEvidenceCount > 0) {
    return NextResponse.json({ error: `${invalidEvidenceCount} link evidence formatnya tidak valid. Pastikan diawali http:// atau https://.` }, { status: 400 })
  }

  // --- Competency questions (spec A.3) ---
  const competencyAnswers = parseCompetencyAnswers(body.competency_answers, roleApplied)
  const roleQuestions = ROLE_CONFIG[roleApplied].competencyQuestions
  const competencyFilledCount = roleQuestions.filter((q) => (competencyAnswers[q.key]?.length ?? 0) >= 10).length

  // --- Mini challenge (spec A.4, opsional) ---
  const miniChallengeAnswer = text(body.mini_challenge_answer, 1500)

  // --- Hitung Application Score (spec A.5) ---
  const [{ data: applicantProfile }, { count: completedCount }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, avatar_url, campus_name, major, profile_skills, is_nexa_verified')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('academic_deadlines')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed'),
  ])

  const ap = (applicantProfile ?? {}) as {
    full_name?: string | null; avatar_url?: string | null; campus_name?: string | null
    major?: string | null; profile_skills?: string[] | null; is_nexa_verified?: boolean | null
  }
  const coreFieldsFilled = [ap.full_name, ap.avatar_url, ap.campus_name, ap.major].filter(Boolean).length
  const profileCompleteness = coreFieldsFilled / 4

  const skillsNeededLower = new Set((Array.isArray((post as { skills_needed?: unknown }).skills_needed)
    ? (post as { skills_needed?: string[] }).skills_needed ?? []
    : []
  ).map((s) => s.toLowerCase()))
  const relevantSkillsCount = skillsOffered.filter((s) => skillsNeededLower.has(s.toLowerCase())).length

  const hasProjectLink = Boolean(portfolioUrl) || evidenceLinks.some((e) => e.type === 'github' || e.type === 'portfolio')

  const { score: trustScore, label: trustLabel } = computeTrustScore({
    profileCompleteness,
    evidenceCount: evidenceLinks.length,
    relevantSkillsCount,
    hasProjectLink,
    competencyAnswersFilled: competencyFilledCount,
    competencyAnswersTotal: roleQuestions.length,
    hasMiniChallengeAnswer: miniChallengeAnswer.length >= 10,
    isNexaVerified: Boolean(ap.is_nexa_verified),
    completedDeadlinesCount: completedCount ?? 0,
  })

  const { data, error } = await supabase
    .from('nexa_arena_applications')
    .insert({
      post_id: id,
      applicant_id: user.id,
      message: text(body.message, 1500) || null,
      applicant_background: applicantBackground,
      skills_offered: skillsOffered,
      portfolio_url: portfolioUrl || null,
      role_applied: roleApplied,
      evidence_links: evidenceLinks,
      competency_answers: competencyAnswers,
      mini_challenge_answer: miniChallengeAnswer || null,
      trust_score: trustScore,
      trust_label: trustLabel,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Kamu sudah melamar ke post ini.' }, { status: 409 })
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  try { await notifyOwner(supabase, arenaPost.creator_id, user.id, arenaPost.title) } catch (error) { console.error('[Arena Application Notification]', error) }

  return NextResponse.json({ data }, { status: 201 })
}
