import 'server-only'
import { askGemini } from '@/lib/ai/gemini'

export type AskNexaProvider = 'gemini' | 'static'

const STATIC_FAQ = [
  {
    keywords: ['apa itu', 'nexa campus', 'nexa'],
    answer:
      'NEXA Campus adalah dashboard anti-lupa deadline untuk mahasiswa. Fokusnya mencatat, melihat, dan mengingat deadline tugas/praktikum dari berbagai sumber kampus dalam satu tempat.',
  },
  {
    keywords: ['password', 'vclass', 'ilab', 'studentsite', 'login kampus', 'npm'],
    answer:
      'NEXA tidak meminta atau menyimpan password kampus. Untuk sekarang, deadline dicatat dari input manual user.',
  },
  {
    keywords: ['resmi', 'kampus resmi', 'official'],
    answer:
      'NEXA Campus bukan sistem resmi kampus. Selalu cek informasi final dari kanal resmi kampus.',
  },
  {
    keywords: ['tambah deadline', 'menambah deadline', 'input deadline', 'deadline praktikum'],
    answer:
      'Untuk menambah deadline, buka Dashboard, pilih Tambah Deadline, isi mata kuliah/kegiatan, tipe, sumber, tanggal, jam, lokasi, dan prioritas. Kalau judul kosong, NEXA otomatis bikin judul seperti “Tugas Algoritma”.',
  },
  {
    keywords: ['radar', 'pulse', 'command', 'beda paket', 'plan'],
    answer:
      'Radar cocok buat mulai rapi dengan batas 5 active deadlines. Pulse untuk deadline yang butuh reminder dasar. Command untuk kontrol lebih lengkap seperti custom reminder dan akses beta feature.',
  },
  {
    keywords: ['reminder', 'pengingat', 'gagal'],
    answer:
      'Reminder membantu, tapi tetap bisa gagal karena provider, jaringan, konfigurasi, atau sistem. Selalu cek kanal resmi kampus untuk info final.',
  },
  {
    keywords: ['ai quick add', 'quick add ai', 'ask nexa'],
    answer:
      'AI Quick Add belum aktif untuk produksi. Untuk sekarang, deadline ditambahkan manual lewat form Quick Add. Tanya NEXA hanya bantu menjawab pertanyaan ringan seputar penggunaan NEXA.',
  },
]

const DEFAULT_STATIC_ANSWER =
  'NEXA Campus bantu kamu merapikan deadline tugas/praktikum dalam satu dashboard. Untuk sekarang, catat deadline manual dari sumber seperti VClass, iLab, dosen, grup WA, Studentsite, BAAK, atau Lepkom. NEXA tidak meminta password kampus dan bukan sistem resmi kampus.'

const SCOPE_KEYWORDS = [
  'nexa',
  'deadline',
  'tugas',
  'praktikum',
  'kuis',
  'ujian',
  'presentasi',
  'administrasi',
  'pembayaran',
  'organisasi',
  'vclass',
  'ilab',
  'dosen',
  'wa',
  'studentsite',
  'baak',
  'lepkom',
  'reminder',
  'pengingat',
  'radar',
  'pulse',
  'command',
  'privacy',
  'aman',
  'password',
  'kampus',
  'kuliah',
  'belajar',
  'produktif',
  'jadwal',
  'status',
  'prioritas',
  'sumber',
  'tambah',
  'catat',
  'lupa',
]

function isInScope(message: string) {
  const normalized = message.toLowerCase()
  return SCOPE_KEYWORDS.some((keyword) => normalized.includes(keyword))
}

function staticFallback(message: string) {
  const normalized = message.toLowerCase()
  const matched = STATIC_FAQ.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword))
  )

  return `Tanya NEXA lagi penuh sebentar. Tapi ini jawaban singkat dari FAQ: ${matched?.answer ?? DEFAULT_STATIC_ANSWER}`
}

export async function askNexa(message: string): Promise<{ answer: string; provider: AskNexaProvider }> {
  if (!isInScope(message)) {
    return {
      answer: 'Aku fokus bantu urusan deadline dan penggunaan NEXA Campus dulu.',
      provider: 'static',
    }
  }

  try {
    const answer = await askGemini(message)
    return { answer, provider: 'gemini' }
  } catch {
    return { answer: staticFallback(message), provider: 'static' }
  }
}
