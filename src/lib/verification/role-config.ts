export type ArenaRole =
  | 'frontend' | 'backend' | 'fullstack' | 'uiux' | 'qa'
  | 'data_analyst' | 'ai_ml' | 'devops' | 'business_marketing' | 'content_social'

export const ARENA_ROLES: Array<{ value: ArenaRole; label: string }> = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' },
  { value: 'fullstack', label: 'Fullstack' },
  { value: 'uiux', label: 'UI/UX' },
  { value: 'qa', label: 'QA Tester' },
  { value: 'data_analyst', label: 'Data Analyst' },
  { value: 'ai_ml', label: 'AI/ML' },
  { value: 'devops', label: 'DevOps' },
  { value: 'business_marketing', label: 'Business/Marketing' },
  { value: 'content_social', label: 'Content/Social Media' },
]

export type EvidenceType = 'github' | 'portfolio' | 'certificate' | 'file' | 'screenshot' | 'document' | 'other'

export const EVIDENCE_TYPES: Array<{ value: EvidenceType; label: string }> = [
  { value: 'github', label: 'Link GitHub' },
  { value: 'portfolio', label: 'Link Portfolio' },
  { value: 'certificate', label: 'Sertifikat' },
  { value: 'file', label: 'File pendukung' },
  { value: 'screenshot', label: 'Screenshot hasil kerja' },
  { value: 'document', label: 'Dokumen (laporan, dataset, dll)' },
  { value: 'other', label: 'Lainnya' },
]

type RoleConfig = {
  /** Evidence type yang paling relevan untuk role ini, ditampilkan duluan di form. */
  suggestedEvidence: EvidenceType[]
  /** Pertanyaan kompetensi singkat (2 pertanyaan), khusus per role. */
  competencyQuestions: Array<{ key: string; question: string }>
  /** Mini challenge opsional — 1 prompt singkat untuk menyaring yang beneran niat. */
  miniChallenge: string
}

export const ROLE_CONFIG: Record<ArenaRole, RoleConfig> = {
  frontend: {
    suggestedEvidence: ['github', 'portfolio', 'screenshot'],
    competencyQuestions: [
      { key: 'relevant_project', question: 'Project frontend paling relevan yang pernah kamu kerjakan?' },
      { key: 'tools', question: 'Framework/tools yang benar-benar pernah kamu pakai (bukan cuma pernah baca)?' },
    ],
    miniChallenge: 'Jelaskan singkat cara kamu bikin card yang responsive (mobile sampai desktop).',
  },
  backend: {
    suggestedEvidence: ['github', 'portfolio', 'document'],
    competencyQuestions: [
      { key: 'relevant_project', question: 'Project backend/API paling relevan yang pernah kamu kerjakan?' },
      { key: 'tools', question: 'Bahasa/framework/database yang benar-benar pernah kamu pakai?' },
    ],
    miniChallenge: 'Jelaskan singkat cara kamu merancang skema database untuk fitur sederhana (mis. sistem absensi).',
  },
  fullstack: {
    suggestedEvidence: ['github', 'portfolio', 'screenshot'],
    competencyQuestions: [
      { key: 'relevant_project', question: 'Project fullstack paling relevan yang pernah kamu kerjakan?' },
      { key: 'contribution', question: 'Di project itu, bagian mana yang kamu kerjakan sendiri?' },
    ],
    miniChallenge: 'Jelaskan singkat alur data dari frontend sampai database pada aplikasi yang pernah kamu buat.',
  },
  uiux: {
    suggestedEvidence: ['portfolio', 'screenshot', 'file'],
    competencyQuestions: [
      { key: 'relevant_project', question: 'Project desain (Figma/dll) paling relevan yang pernah kamu kerjakan?' },
      { key: 'process', question: 'Gimana proses kamu dari riset/wireframe sampai desain final?' },
    ],
    miniChallenge: 'Jelaskan alasan kamu memilih layout mobile-first untuk sebuah aplikasi baru.',
  },
  qa: {
    suggestedEvidence: ['document', 'screenshot', 'file'],
    competencyQuestions: [
      { key: 'relevant_project', question: 'Pengalaman testing/QA paling relevan yang pernah kamu kerjakan?' },
      { key: 'tools', question: 'Tools testing yang pernah kamu pakai (Postman, manual test case, dll)?' },
    ],
    miniChallenge: 'Tulis 3 test case singkat untuk fitur login (boleh poin-poin).',
  },
  data_analyst: {
    suggestedEvidence: ['github', 'document', 'screenshot'],
    competencyQuestions: [
      { key: 'relevant_project', question: 'Project analisis data paling relevan yang pernah kamu kerjakan?' },
      { key: 'tools', question: 'Tools/library yang benar-benar pernah kamu pakai (Excel, Python, SQL, dll)?' },
    ],
    miniChallenge: 'Jelaskan singkat insight apa yang bisa diambil dari data penjualan harian yang naik-turun setiap akhir pekan.',
  },
  ai_ml: {
    suggestedEvidence: ['github', 'document', 'certificate'],
    competencyQuestions: [
      { key: 'relevant_project', question: 'Project AI/ML paling relevan yang pernah kamu kerjakan?' },
      { key: 'tools', question: 'Library/model yang benar-benar pernah kamu pakai?' },
    ],
    miniChallenge: 'Jelaskan singkat bedanya supervised dan unsupervised learning, pakai contoh kasus nyata.',
  },
  devops: {
    suggestedEvidence: ['github', 'certificate', 'document'],
    competencyQuestions: [
      { key: 'relevant_project', question: 'Pengalaman deploy/infra paling relevan yang pernah kamu kerjakan?' },
      { key: 'tools', question: 'Tools yang benar-benar pernah kamu pakai (Docker, CI/CD, cloud, dll)?' },
    ],
    miniChallenge: 'Jelaskan singkat langkah-langkah deploy aplikasi web sederhana ke server/cloud.',
  },
  business_marketing: {
    suggestedEvidence: ['document', 'portfolio', 'screenshot'],
    competencyQuestions: [
      { key: 'relevant_project', question: 'Campaign/project bisnis-marketing paling relevan yang pernah kamu kerjakan?' },
      { key: 'contribution', question: 'Kontribusi spesifik kamu di project itu apa?' },
    ],
    miniChallenge: 'Buat contoh caption promosi singkat (2-3 kalimat) untuk produk/event kampus.',
  },
  content_social: {
    suggestedEvidence: ['portfolio', 'screenshot', 'file'],
    competencyQuestions: [
      { key: 'relevant_project', question: 'Konten/akun sosial media paling relevan yang pernah kamu kelola?' },
      { key: 'tools', question: 'Tools editing/desain yang benar-benar pernah kamu pakai?' },
    ],
    miniChallenge: 'Buat ide konten singkat (1 paragraf) untuk mempromosikan tim lomba ke mahasiswa lain.',
  },
}

export function isArenaRole(value: unknown): value is ArenaRole {
  return typeof value === 'string' && value in ROLE_CONFIG
}
