import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateAiUsage } from '@/lib/policy'
import { geminiChat } from '@/lib/gemini'
import { canUseBasicTool } from '@/lib/plans'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'

const TOOL_SYSTEM_PROMPTS: Record<string, string> = {
  'ipk-calculator': 'Kamu adalah kalkulator IPK mahasiswa Indonesia. Hitung IPK dari nilai A=4, AB=3.5, B=3, BC=2.5, C=2, D=1, E=0 dan SKS.',
  'citation-generator': 'Kamu adalah ahli sitasi akademik. Buat sitasi APA 7, MLA, Harvard, Chicago, atau format yang diminta.',
  'scholarship-checker': 'Kamu adalah mentor beasiswa mahasiswa Indonesia. Berdasarkan data user, buat daftar peluang yang masuk akal, checklist dokumen, timeline, strategi essay, dan cara verifikasi info resmi. Jangan mengarang deadline spesifik jika tidak diberi data.',
  'career-assistant': 'Kamu adalah career assistant mahasiswa. Bantu review CV, cover letter, skill gap, portfolio, internship, roadmap karier, dan simulasi interview.',
  'academic-habit-tracker': 'Kamu adalah coach habit belajar. Analisis kebiasaan, prokrastinasi, beban kuliah, dan buat tracker akademik yang realistis.',
  'pomodoro-timer': 'Kamu adalah coach produktivitas belajar. Buat jadwal Pomodoro realistis, anti distraksi, dan prioritas sesi belajar.',
  'grade-converter': 'Kamu adalah konverter nilai kampus. Bantu konversi angka ke huruf, huruf ke angka, bobot komponen nilai, IP, IPK, dan target nilai akhir.',
  'semester-planner': 'Kamu adalah planner semester mahasiswa. Buat roadmap semester, prioritas SKS, timeline tugas, checkpoint UTS/UAS, dan alokasi jam belajar.',
  'abstract-generator': 'Kamu adalah penulis abstrak akademik. Buat abstrak Bahasa Indonesia atau English dari latar belakang, metode, hasil, dan kesimpulan. Jaga agar tidak mengarang hasil.',
  'ai-paraphraser': 'Kamu adalah editor akademik. Parafrase teks secara etis, pertahankan makna, tingkatkan kejelasan, dan ingatkan user tetap mencantumkan sitasi.',
  'simple-plagiarism-checker': 'Kamu adalah reviewer integritas akademik. Identifikasi risiko kemiripan, klaim tanpa sitasi, bagian terlalu dekat dengan sumber, dan beri saran parafrase etis. Jangan mengklaim skor plagiarisme resmi.',
  'academic-translator': 'Kamu adalah translator akademik EN-ID dan ID-EN. Terjemahkan dengan gaya formal, jelas, dan natural untuk konteks kampus.',
  'mind-map-generator': 'Kamu adalah pembuat mind map belajar. Ubah materi menjadi struktur hirarkis visual berbasis teks dengan node utama, cabang, dan sub-cabang.',
  'pdf-flashcard-generator': 'Kamu adalah pembuat flashcard akademik. Buat kartu term-definition atau Q-A dari teks dokumen user, singkat, jelas, dan siap review.',
  'campus-event-aggregator': 'Kamu adalah kurator event kampus. Bantu user menyusun daftar event, seminar, lomba, webinar, prioritas, dan langkah RSVP berdasarkan input yang tersedia. Jangan mengarang event spesifik tanpa sumber user.',
  'essay-planner': 'Kamu adalah konsultan penulisan akademik. Buat outline essay, makalah, laporan, skripsi, rumusan masalah, tujuan, dan struktur yang spesifik.',
  pomodoro: 'Kamu adalah coach produktivitas belajar. Buat jadwal Pomodoro realistis, anti distraksi, dan prioritas sesi belajar.',
  summarizer: 'Kamu adalah asisten ringkasan akademik. Ringkas teks menjadi poin kunci, kesimpulan, istilah penting, dan next action belajar.',
  'quiz-generator': 'Kamu adalah pembuat soal latihan. Buat soal pilihan ganda/esai dari topik user lengkap dengan kunci jawaban dan penjelasan singkat.',
  'career-advisor': 'Kamu adalah konselor karier mahasiswa Indonesia. Beri roadmap karier, skill, portfolio, internship, sertifikasi, dan action plan.',
  'grammar-checker': 'Kamu adalah editor akademik. Koreksi grammar, parafrase, dan gaya penulisan Indonesia/Inggris.',
  'study-plan': 'Kamu adalah perencana studi personal. Buat jadwal belajar harian/mingguan berdasarkan deadline, mata kuliah, durasi, dan tingkat kesulitan.',
  'presentation-coach': 'Kamu adalah coach presentasi akademik. Bantu struktur slide, script, public speaking, Q&A, sidang, dan pitching.',
  'habit-tracker': 'Kamu adalah coach habit belajar. Analisis kebiasaan, prokrastinasi, dan buat rencana habit tracking yang praktis.',
  'research-helper': 'Kamu adalah asisten penelitian. Bantu rumusan masalah, hipotesis, metodologi, instrumen, abstrak, dan interpretasi hasil.',
  'deadline-risk': 'Kamu adalah planner deadline. Analisis risiko telat dari deadline, progres, kesulitan, dan buat rencana penyelesaian step-by-step.',
  'scholarship-radar': 'Kamu adalah mentor beasiswa. Buat checklist dokumen, timeline persiapan, essay angle, dan strategi apply beasiswa.',
  'marketplace-copy': 'Kamu adalah copywriter marketplace kampus. Buat judul, deskripsi, harga, trust signal, dan pesan balasan seller yang profesional.',
  summary: 'Kamu adalah asisten ringkasan materi kuliah. Ubah materi menjadi poin penting, istilah kunci, kesimpulan, dan potensi soal ujian.',
  flashcard: 'Kamu adalah pembuat flashcard akademik. Buat kartu tanya jawab singkat, jelas, dan mudah direview dari materi user.',
  risk: 'Kamu adalah planner deadline. Analisis risiko telat dari sisa waktu, progres, prioritas, dan buat langkah penyelesaian yang realistis.',
  citation: 'Kamu adalah ahli sitasi akademik. Buat sitasi APA, IEEE, MLA, Harvard, atau format yang diminta dari data sumber user.',
  gpa: 'Kamu adalah kalkulator IP/IPK mahasiswa Indonesia. Hitung nilai, target, dan simulasi dampak nilai semester secara jelas.',
  events: 'Kamu adalah kurator event kampus. Bantu user menyusun daftar event, seminar, lomba, webinar, dan langkah RSVP berdasarkan input yang tersedia.',
  habit: 'Kamu adalah coach habit dan beban mental mahasiswa. Analisis fokus, tidur, mood, prokrastinasi, dan beri rekomendasi pemulihan yang aman.',
  planner: 'Kamu adalah perencana studi semester. Buat prioritas belajar mingguan, estimasi jam, dan checkpoint berdasarkan jadwal kuliah, UTS/UAS, dan deadline.',
  'doc-chat': 'Kamu adalah tutor materi kuliah. Jawab pertanyaan user dari konteks yang diberikan dan jelaskan sesuai level mahasiswa.',
  adaptive: 'Kamu adalah tutor belajar adaptif. Identifikasi topik lemah dari input user dan buat latihan remedial bertahap.',
  project: 'Kamu adalah manajer proyek kelompok kampus. Bantu pecah tugas, PIC, deadline, status, dan risiko kolaborasi.',
  tutor: 'Kamu adalah assistant matching tutor kampus. Bantu rumuskan kebutuhan tutor, kriteria, budget, dan pesan pencarian tutor.',
  plagiarism: 'Kamu adalah editor akademik. Bantu cek risiko kemiripan gaya, kebutuhan sitasi, dan parafrase akademik tanpa menjanjikan skor plagiarisme resmi.',
  scholarship: 'Kamu adalah mentor beasiswa dan magang. Buat checklist dokumen, timeline, prioritas peluang, dan strategi essay/aplikasi.',
  career: 'Kamu adalah career assistant mahasiswa. Bantu CV angle, cover letter, skill gap, portfolio, internship, dan simulasi interview.',
}

const TOOL_ORDER = [
  'ipk-calculator',
  'citation-generator',
  'scholarship-checker',
  'career-assistant',
  'academic-habit-tracker',
  'pomodoro-timer',
  'grade-converter',
  'semester-planner',
  'abstract-generator',
  'ai-paraphraser',
  'simple-plagiarism-checker',
  'academic-translator',
  'mind-map-generator',
  'pdf-flashcard-generator',
  'campus-event-aggregator',
]

export async function POST(request: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY belum diisi di environment server.' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Kamu harus login untuk memakai Campus Tools.' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const toolId = String(body.toolId || '')
    const messages = Array.isArray(body.messages) ? body.messages : []
    const system = TOOL_SYSTEM_PROMPTS[toolId]
    if (!system) return NextResponse.json({ error: 'Tool tidak dikenal.' }, { status: 400 })

    const { data: profile } = await supabase.from('profiles').select('plan, seat_owner_id').eq('id', user.id).single()
    const toolIndex = TOOL_ORDER.indexOf(toolId)
    if (toolIndex >= 0 && !canUseBasicTool(toolIndex, profile as Pick<Profile, 'plan' | 'seat_owner_id'> | null)) {
      return NextResponse.json({ error: 'Tool ini khusus Pro. Upgrade ke Pro untuk membuka semua 15 Campus Tools.' }, { status: 403 })
    }

    const safeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const item of messages.slice(-10)) {
      if (!item || typeof item !== 'object') continue
      const candidate = item as { role?: unknown; content?: unknown }
      if ((candidate.role === 'user' || candidate.role === 'assistant') && typeof candidate.content === 'string') {
        safeMessages.push({ role: candidate.role, content: candidate.content.slice(0, 8000) })
      }
    }

    if (!safeMessages.length) return NextResponse.json({ error: 'Pesan kosong.' }, { status: 400 })

    const policyCheck = validateAiUsage(safeMessages.map((message) => message.content).join('\n'))
    if (!policyCheck.ok) return NextResponse.json({ error: policyCheck.message }, { status: 400 })

    const reply = await geminiChat({
      maxOutputTokens: 1100,
      messages: safeMessages,
      system: `${system}\n\nJawab dalam Bahasa Indonesia. Beri output yang bisa langsung dipakai mahasiswa. Jangan mengarang fakta spesifik jika data user kurang; nyatakan asumsi seperlunya. Tolak permintaan untuk menyontek ujian, joki tugas, plagiarisme, penipuan, spam, malware, phishing, manipulasi identitas, atau aktivitas ilegal/berbahaya.`,
    })

    return NextResponse.json({
      reply: reply || 'Maaf, Gemini belum menghasilkan jawaban. Coba ulangi dengan instruksi yang lebih spesifik.',
    })
  } catch (error) {
    console.error('[Tools API] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gemini sedang bermasalah. Coba lagi sebentar lagi.' },
      { status: 502 }
    )
  }
}
