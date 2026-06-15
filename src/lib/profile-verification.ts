export type ProfileVerificationInput = {
  full_name?: string | null
  campus_name?: string | null
  major?: string | null
  semester?: number | string | null
  avatar_url?: string | null
  public_profile_headline?: string | null
  profile_bio?: string | null
  profile_skills?: string[] | null
  portfolio_url?: string | null
  github_url?: string | null
  linkedin_url?: string | null
}

export type ProfileVerificationCheck = {
  key: string
  label: string
  done: boolean
}

function hasText(value: unknown, minLength = 1) {
  return typeof value === 'string' && value.trim().length >= minLength
}

function hasSemester(value: unknown) {
  const semester = Number(value)
  return Number.isFinite(semester) && semester >= 1 && semester <= 14
}

function skillCount(value: unknown) {
  return Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean).length : 0
}

function hasPublicProof(profile: ProfileVerificationInput | null | undefined) {
  return hasText(profile?.portfolio_url) || hasText(profile?.github_url) || hasText(profile?.linkedin_url)
}

export function getArenaProfileVerification(profile: ProfileVerificationInput | null | undefined) {
  const checks: ProfileVerificationCheck[] = [
    { key: 'name', label: 'Nama lengkap', done: hasText(profile?.full_name) },
    { key: 'campus', label: 'Kampus', done: hasText(profile?.campus_name) },
    { key: 'major', label: 'Jurusan', done: hasText(profile?.major) },
    { key: 'semester', label: 'Semester valid', done: hasSemester(profile?.semester) },
    { key: 'bio', label: 'Bio profil jelas', done: hasText(profile?.profile_bio, 40) },
    { key: 'skills', label: 'Minimal 2 skill', done: skillCount(profile?.profile_skills) >= 2 },
    { key: 'proof', label: 'Portfolio/GitHub/LinkedIn', done: hasPublicProof(profile) },
  ]

  const completed = checks.filter((item) => item.done)
  const missing = checks.filter((item) => !item.done).map((item) => item.label)

  return {
    verified: missing.length === 0,
    score: Math.round((completed.length / checks.length) * 100),
    completed: completed.map((item) => item.key),
    missing,
    checks,
  }
}

export function firstProfileProofUrl(profile: ProfileVerificationInput | null | undefined) {
  return [profile?.portfolio_url, profile?.github_url, profile?.linkedin_url]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find(Boolean) || ''
}

export function isHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
