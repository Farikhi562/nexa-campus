export type TrustLabel = 'low_trust' | 'medium_trust' | 'high_trust' | 'verified_candidate'

export type TrustScoreInput = {
  /** 0-1, proporsi field profil inti yang terisi (nama, kampus, jurusan, avatar, dll) */
  profileCompleteness: number
  /** Jumlah evidence (link/file/sertifikat) yang dilampirkan di lamaran ini */
  evidenceCount: number
  /** Jumlah skill yang ditawarkan yang relevan/cocok dengan skill yang dicari post */
  relevantSkillsCount: number
  /** Ada link project/portfolio yang valid (selain evidence di atas) */
  hasProjectLink: boolean
  /** Jumlah pertanyaan kompetensi yang dijawab dengan substantif (bukan kosong/asal) */
  competencyAnswersFilled: number
  /** Total pertanyaan kompetensi untuk role ini */
  competencyAnswersTotal: number
  /** Mini challenge dijawab dengan substantif */
  hasMiniChallengeAnswer: boolean
  /** Akun pelamar sudah berstatus is_nexa_verified sebelumnya */
  isNexaVerified: boolean
  /** Jumlah deadline yang sudah pernah diselesaikan di NEXA Campus (sinyal aktivitas nyata) */
  completedDeadlinesCount: number
}

export type TrustScoreResult = {
  score: number
  label: TrustLabel
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Hitung skor kepercayaan (0-100) dari sebuah lamaran NEXA Arena.
 * Pure function — tidak menyentuh DB, gampang di-unit-test.
 *
 * Bobot (total maks 100):
 *  - Kelengkapan profil      : 20
 *  - Evidence dilampirkan    : 20 (5 poin/evidence, maks 4)
 *  - Skill relevan           : 15 (3 poin/skill, maks 5)
 *  - Ada link project        : 10
 *  - Jawaban kompetensi      : 10 (proporsional)
 *  - Mini challenge dijawab  : 10
 *  - Akun sudah verified     : 10
 *  - Aktivitas sebelumnya    : 5 (berdasarkan deadline selesai, maks ringan)
 *
 * Label:
 *  - verified_candidate : skor >= 85 DAN akun sudah is_nexa_verified
 *  - high_trust         : skor >= 65
 *  - medium_trust        : skor >= 35
 *  - low_trust           : sisanya
 */
export function computeTrustScore(input: TrustScoreInput): TrustScoreResult {
  const profileScore = clamp(input.profileCompleteness, 0, 1) * 20
  const evidenceScore = clamp(input.evidenceCount, 0, 4) * 5
  const skillsScore = clamp(input.relevantSkillsCount, 0, 5) * 3
  const projectLinkScore = input.hasProjectLink ? 10 : 0
  const competencyScore =
    input.competencyAnswersTotal > 0
      ? clamp(input.competencyAnswersFilled / input.competencyAnswersTotal, 0, 1) * 10
      : 0
  const miniChallengeScore = input.hasMiniChallengeAnswer ? 10 : 0
  const verifiedScore = input.isNexaVerified ? 10 : 0
  const activityScore = clamp(input.completedDeadlinesCount, 0, 10) * 0.5 // maks 5

  const rawScore =
    profileScore +
    evidenceScore +
    skillsScore +
    projectLinkScore +
    competencyScore +
    miniChallengeScore +
    verifiedScore +
    activityScore

  const score = Math.round(clamp(rawScore, 0, 100))

  let label: TrustLabel
  if (score >= 85 && input.isNexaVerified) label = 'verified_candidate'
  else if (score >= 65) label = 'high_trust'
  else if (score >= 35) label = 'medium_trust'
  else label = 'low_trust'

  return { score, label }
}

export const TRUST_LABEL_TEXT: Record<TrustLabel, string> = {
  low_trust: 'Low Trust',
  medium_trust: 'Medium Trust',
  high_trust: 'High Trust',
  verified_candidate: 'Verified Candidate',
}

export const TRUST_LABEL_COLOR: Record<TrustLabel, string> = {
  low_trust: 'bg-slate-100 text-slate-600',
  medium_trust: 'bg-amber-50 text-amber-700',
  high_trust: 'bg-emerald-50 text-emerald-700',
  verified_candidate: 'bg-blue-50 text-blue-700',
}
