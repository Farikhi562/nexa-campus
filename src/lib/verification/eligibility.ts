export type VerificationRequirementKey =
  | 'profile_complete' | 'avatar' | 'campus_major' | 'min_skills'
  | 'project_link' | 'evidence' | 'arena_application'

export type VerificationRequirement = {
  key: VerificationRequirementKey
  label: string
  met: boolean
}

export type VerificationEligibilityInput = {
  fullName: string | null
  avatarUrl: string | null
  campusName: string | null
  major: string | null
  skillsCount: number
  hasProjectLink: boolean
  evidenceCount: number
  hasCompleteArenaApplication: boolean
}

const MIN_SKILLS = 3

/**
 * Cek syarat pengajuan verifikasi akun ("Verified by NEXA"). Pure function —
 * dipakai baik oleh API (memutuskan boleh/tidak insert user_verifications)
 * maupun UI (VerificationProgressCard, menampilkan checklist).
 */
export function checkVerificationEligibility(input: VerificationEligibilityInput): {
  eligible: boolean
  requirements: VerificationRequirement[]
} {
  const requirements: VerificationRequirement[] = [
    { key: 'profile_complete', label: 'Nama lengkap terisi', met: Boolean(input.fullName?.trim()) },
    { key: 'avatar', label: 'Foto profil sudah diupload', met: Boolean(input.avatarUrl) },
    { key: 'campus_major', label: 'Universitas & jurusan terisi', met: Boolean(input.campusName?.trim() && input.major?.trim()) },
    { key: 'min_skills', label: `Minimal ${MIN_SKILLS} skill terisi di profil`, met: input.skillsCount >= MIN_SKILLS },
    { key: 'project_link', label: 'Minimal 1 link project/portfolio valid', met: input.hasProjectLink },
    { key: 'evidence', label: 'Minimal 1 bukti skill (evidence) diupload', met: input.evidenceCount >= 1 },
    { key: 'arena_application', label: 'Pernah apply ke NEXA Arena dengan data lengkap', met: input.hasCompleteArenaApplication },
  ]

  return { eligible: requirements.every((r) => r.met), requirements }
}
