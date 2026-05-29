const MARKETPLACE_PROHIBITED_KEYWORDS = [
  'narkoba',
  'narkotika',
  'ganja',
  'sabu',
  'senjata',
  'pistol',
  'alkohol',
  'vape',
  'rokok',
  'joki tugas',
  'joki skripsi',
  'joki ujian',
  'joki',
  'contekan',
  'kunci jawaban',
  'akun curian',
  'jual akun',
  'ktp',
  'kk',
  'ijazah palsu',
  'Dokumen palsu',
  'bajakan',
  'crack',
  'porn',
  'dewasa',
  'escort',
]

const SENSITIVE_DATA_KEYWORDS = [
  'ktp',
  'kartu keluarga',
  'kk',
  'nik',
  'npwp',
  'rekam medis',
  'diagnosa',
  'rekening',
  'kartu kredit',
  'password',
  'kata sandi',
  'token',
  'secret key',
  'private key',
  'data pribadi',
  'rahasia',
]

const AI_ABUSE_KEYWORDS = [
  'kerjakan ujian',
  'jawab ujian',
  'contekan',
  'bypass',
  'hack',
  'phishing',
  'malware',
  'spam',
  'penipuan',
  'Dokumen palsu',
  'plagiarisme',
  'joki',
]

function normalize(text: string) {
  return text.toLowerCase()
}

function findKeyword(text: string, keywords: string[]) {
  const normalized = normalize(text)
  return keywords.find((keyword) => normalized.includes(keyword))
}

export function validateMarketplaceListing(input: string) {
  const keyword = findKeyword(input, MARKETPLACE_PROHIBITED_KEYWORDS)
  if (!keyword) return { ok: true as const }

  return {
    ok: false as const,
    message: `Listing terindikasi melanggar aturan marketplace karena memuat "${keyword}". Hapus konten terlarang sebelum diterbitkan.`,
  }
}

export function validateSensitiveData(input: string) {
  const keyword = findKeyword(input, SENSITIVE_DATA_KEYWORDS)
  if (!keyword) return { ok: true as const }

  return {
    ok: false as const,
    message: `Judul atau nama file terindikasi memuat data sensitif ("${keyword}"). Jangan unggah KTP, data kesehatan, data keuangan, password, atau data pribadi orang lain.`,
  }
}

export function validateAiUsage(input: string) {
  const keyword = findKeyword(input, AI_ABUSE_KEYWORDS)
  if (!keyword) return { ok: true as const }

  return {
    ok: false as const,
    message: `Permintaan ditolak karena terindikasi penyalahgunaan AI atau pelanggaran akademik ("${keyword}"). Gunakan AI untuk belajar, memahami materi, dan menyusun rencana secara etis.`,
  }
}
