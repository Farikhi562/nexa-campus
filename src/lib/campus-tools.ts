import {
  BadgeCheck,
  BarChart3,
  BookMarked,
  Bot,
  BriefcaseBusiness,
  CalendarClock,
  FileSearch,
  GraduationCap,
  HeartPulse,
  LineChart,
  MessageSquareText,
  NotepadText,
  Quote,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type ToolStatus = 'active' | 'prototype' | 'next'
export type ToolAccess = 'free' | 'paid'
export type ToolCategory = 'Belajar' | 'Produktivitas' | 'Karier' | 'Kampus' | 'Wellbeing'

export type CampusTool = {
  id: string
  title: string
  desc: string
  status: ToolStatus
  access: ToolAccess
  category: ToolCategory
  icon: LucideIcon
  output: string
  prompt: string
  fomo: string
}

export const FREE_DAILY_LIMIT = 3

export const TOOL_CATEGORIES: Array<'Semua' | ToolCategory> = [
  'Semua',
  'Belajar',
  'Produktivitas',
  'Karier',
  'Kampus',
  'Wellbeing',
]

export const CAMPUS_TOOLS: CampusTool[] = [
  {
    id: 'summary',
    title: 'AI Ringkas Materi',
    desc: 'Ubah slide, PDF, atau catatan panjang menjadi poin penting, istilah kunci, dan topik ujian.',
    status: 'active',
    access: 'free',
    category: 'Belajar',
    icon: NotepadText,
    output: 'Ringkasan 5 poin, keyword, dan potensi soal.',
    prompt: 'Manajemen waktu kuliah butuh prioritas berdasarkan deadline, tingkat kesulitan, dan energi harian mahasiswa.',
    fomo: 'Ringkasan cepat bantu mulai belajar, tapi paket berbayar membuka tool lanjutan untuk planner, doc chat, dan latihan adaptif.',
  },
  {
    id: 'flashcard',
    title: 'Flashcard Otomatis',
    desc: 'Materi kuliah langsung jadi kartu tanya jawab untuk hafalan cepat.',
    status: 'active',
    access: 'free',
    category: 'Belajar',
    icon: BookMarked,
    output: 'Deck flashcard siap review sebelum kelas atau ujian.',
    prompt: 'Konsep utama: deadline, latihan aktif, self-test, dan review berkala.',
    fomo: 'Flashcard gratis cukup untuk coba, tapi mode adaptif berbayar bikin latihan mengikuti topik yang masih lemah.',
  },
  {
    id: 'risk',
    title: 'Deadline Risk Score',
    desc: 'Skor risiko deadline berdasarkan sisa hari, progress, dan prioritas.',
    status: 'active',
    access: 'free',
    category: 'Produktivitas',
    icon: LineChart,
    output: 'Status aman, waspada, atau kritis dengan langkah cepat.',
    prompt: 'Tugas presentasi tinggal 4 hari dengan progress 45 persen.',
    fomo: 'Risk score gratis memberi alarm awal, tapi planner berbayar bantu menyusun langkah mingguan sampai deadline selesai.',
  },
  {
    id: 'citation',
    title: 'Citation Generator',
    desc: 'Buat sitasi APA, IEEE, atau MLA dari judul, link, DOI, jurnal, atau buku.',
    status: 'active',
    access: 'free',
    category: 'Belajar',
    icon: Quote,
    output: 'Sitasi dan daftar pustaka rapi.',
    prompt: 'Santoso, B. (2025). Strategi Belajar Mahasiswa Digital. Jurnal Pendidikan Indonesia.',
    fomo: 'Citation membantu rapihin daftar pustaka, tapi cek plagiarisme ringan dan parafrase akademik ada di paket berbayar.',
  },
  {
    id: 'gpa',
    title: 'Transcript & IPK Tracker',
    desc: 'Hitung IP/IPK, target nilai, dan simulasi dampak nilai semester ini.',
    status: 'active',
    access: 'free',
    category: 'Belajar',
    icon: BarChart3,
    output: 'IP semester, prediksi IPK, dan target kenaikan.',
    prompt: 'Algoritma 88, Statistika 78, Basis Data 82.',
    fomo: 'Simulasi IPK gratis menunjukkan target, paket berbayar membantu bikin strategi belajar agar targetnya realistis dikejar.',
  },
  {
    id: 'events',
    title: 'Campus Event Hub',
    desc: 'Seminar, lomba, webinar, open recruitment, dan agenda kampus dalam satu tempat.',
    status: 'prototype',
    access: 'free',
    category: 'Kampus',
    icon: BadgeCheck,
    output: 'Daftar event terkurasi dan RSVP.',
    prompt: 'Cari event AI, karier, dan organisasi minggu ini.',
    fomo: 'Event hub gratis buat lihat peluang, paket berbayar membuka tracker beasiswa, magang, dan reminder follow-up.',
  },
  {
    id: 'habit',
    title: 'Mental Load & Habit Tracker',
    desc: 'Pantau fokus, tidur, mood, dan risiko burnout agar ritme kuliah lebih sehat.',
    status: 'active',
    access: 'free',
    category: 'Wellbeing',
    icon: HeartPulse,
    output: 'Skor beban mental dan rekomendasi recovery.',
    prompt: 'Tidur 6 jam, fokus 70, mood 62.',
    fomo: 'Habit tracker gratis memberi sinyal kondisi, paket berbayar membantu menyambungkan kondisi itu ke planner belajar.',
  },
  {
    id: 'planner',
    title: 'AI Study Planner Semester',
    desc: 'Rencana belajar otomatis dari jadwal kuliah, UTS/UAS, deadline, dan tingkat kesulitan.',
    status: 'active',
    access: 'paid',
    category: 'Produktivitas',
    icon: CalendarClock,
    output: 'Prioritas belajar mingguan, estimasi jam belajar, dan checkpoint sebelum deadline.',
    prompt: 'UTS Statistika 10 hari lagi, laporan Basis Data 6 hari lagi, praktikum Algoritma tiap Jumat.',
    fomo: 'Tool ini yang biasanya paling terasa saat deadline numpuk: jadwal belajar langsung dipecah jadi aksi harian.',
  },
  {
    id: 'doc-chat',
    title: 'AI Tanya Materi',
    desc: 'Chat dengan dokumen sendiri dan minta penjelasan sesuai level semester.',
    status: 'prototype',
    access: 'paid',
    category: 'Belajar',
    icon: MessageSquareText,
    output: 'Jawaban kontekstual dari materi yang dipilih.',
    prompt: 'Jelaskan normalisasi database sampai 3NF dengan contoh tabel mahasiswa.',
    fomo: 'Buka penjelasan dari dokumen sendiri tanpa bolak-balik cari bagian slide yang relevan.',
  },
  {
    id: 'adaptive',
    title: 'Mode Belajar Adaptif',
    desc: 'NEXA membaca pola salah dan memberi latihan tambahan di topik lemah.',
    status: 'prototype',
    access: 'paid',
    category: 'Belajar',
    icon: Target,
    output: 'Rekomendasi topik remedial dan latihan lanjutan.',
    prompt: 'Saya sering salah di probabilitas bersyarat dan query join.',
    fomo: 'Free user hanya coba tool statis, fitur ini menyesuaikan latihan dari pola salahmu.',
  },
  {
    id: 'project',
    title: 'Group Project Manager',
    desc: 'Pembagian tugas kelompok, status anggota, deadline, file, dan reminder.',
    status: 'active',
    access: 'paid',
    category: 'Produktivitas',
    icon: Users,
    output: 'Board kerja kelompok dan akuntabilitas anggota.',
    prompt: 'Anggota A membuat outline, anggota B mencari jurnal, anggota C merapikan slide.',
    fomo: 'Saat kerja kelompok mulai berantakan, board ini bikin PIC dan deadline kelihatan jelas.',
  },
  {
    id: 'tutor',
    title: 'Peer Tutor Matching',
    desc: 'Cocokkan mahasiswa yang butuh bantuan dengan tutor kampus yang relevan.',
    status: 'prototype',
    access: 'paid',
    category: 'Kampus',
    icon: GraduationCap,
    output: 'Match tutor berdasarkan jurusan, mata kuliah, rating, dan budget.',
    prompt: 'Butuh tutor Statistika untuk mahasiswa Sistem Informasi, budget Rp50.000.',
    fomo: 'Kalau sudah mepet ujian, matching tutor lebih cepat daripada cari rekomendasi manual.',
  },
  {
    id: 'plagiarism',
    title: 'AI Cek Plagiarisme Ringan',
    desc: 'Bantu cek kemiripan gaya, parafrase akademik, dan saran sitasi.',
    status: 'prototype',
    access: 'paid',
    category: 'Belajar',
    icon: FileSearch,
    output: 'Risk note, kalimat yang perlu sitasi, dan saran parafrase.',
    prompt: 'Paragraf teori ini perlu dibuat lebih akademik dan diberi saran sitasi.',
    fomo: 'Satu bagian teori yang kurang rapi bisa bikin revisi bolak-balik. Tool ini bantu cek sebelum submit.',
  },
  {
    id: 'scholarship',
    title: 'Scholarship & Internship Tracker',
    desc: 'Pantau beasiswa, magang, lomba, syarat dokumen, dan deadline.',
    status: 'active',
    access: 'paid',
    category: 'Karier',
    icon: BriefcaseBusiness,
    output: 'Pipeline peluang kampus dengan status dokumen.',
    prompt: 'Beasiswa prestasi 12 hari, magang Product Analyst 18 hari, lomba essay 25 hari.',
    fomo: 'Peluang sering hilang bukan karena tidak mampu, tapi karena dokumen telat siap.',
  },
  {
    id: 'career',
    title: 'AI Career Assistant',
    desc: 'Bikin CV, cover letter, simulasi interview, dan rekomendasi skill per jurusan.',
    status: 'active',
    access: 'paid',
    category: 'Karier',
    icon: Bot,
    output: 'CV angle, skill gap, dan latihan interview.',
    prompt: 'Saya mahasiswa Sistem Informasi ingin apply Product Analyst internship.',
    fomo: 'Buka angle CV dan latihan interview sebelum lowongan bagus keburu ditutup.',
  },
]

export function getCampusTool(id: string) {
  return CAMPUS_TOOLS.find((tool) => tool.id === id)
}

export function statusClass(status: ToolStatus) {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (status === 'prototype') return 'bg-brand-50 text-brand-700 border-brand-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

export function accessClass(access: ToolAccess) {
  if (access === 'paid') return 'bg-slate-950 text-white border-slate-950'
  return 'bg-emerald-50 text-emerald-700 border-emerald-200'
}
