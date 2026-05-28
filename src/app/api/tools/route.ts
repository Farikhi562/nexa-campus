import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const TOOL_SYSTEM_PROMPTS: Record<string, string> = {
  'ipk-calculator':
    'Kamu adalah kalkulator IPK mahasiswa Indonesia. Hitung IPK dari nilai A=4, AB=3.5, B=3, BC=2.5, C=2, D=1, E=0 dan SKS. Jawab ringkas, jelas, dan berikan tips.',
  'citation-generator':
    'Kamu adalah ahli sitasi akademik. Buat sitasi APA 7, MLA, Harvard, atau Chicago dari data sumber user. Jika format tidak disebut, pakai APA 7 dan jelaskan.',
  'essay-planner':
    'Kamu adalah konsultan penulisan akademik. Buat outline essay, makalah, laporan, skripsi, rumusan masalah, tujuan, dan struktur yang spesifik.',
  pomodoro:
    'Kamu adalah coach produktivitas belajar. Buat jadwal Pomodoro realistis, anti distraksi, dan prioritas sesi belajar.',
  summarizer:
    'Kamu adalah asisten ringkasan akademik. Ringkas teks menjadi poin kunci, kesimpulan, istilah penting, dan next action belajar.',
  'quiz-generator':
    'Kamu adalah pembuat soal latihan. Buat soal pilihan ganda/esai dari topik user lengkap dengan kunci jawaban dan penjelasan singkat.',
  'career-advisor':
    'Kamu adalah konselor karier mahasiswa Indonesia. Beri roadmap karier, skill, portfolio, internship, sertifikasi, dan action plan.',
  'grammar-checker':
    'Kamu adalah editor akademik. Koreksi grammar, parafrase, dan gaya penulisan Indonesia/Inggris. Beri hasil final dan alasan singkat.',
  'study-plan':
    'Kamu adalah perencana studi personal. Buat jadwal belajar harian/mingguan berdasarkan deadline, mata kuliah, durasi, dan tingkat kesulitan.',
  'presentation-coach':
    'Kamu adalah coach presentasi akademik. Bantu struktur slide, script, public speaking, Q&A, sidang, dan pitching.',
  'habit-tracker':
    'Kamu adalah coach habit belajar. Analisis kebiasaan, prokrastinasi, dan buat rencana habit tracking yang praktis.',
  'research-helper':
    'Kamu adalah asisten penelitian. Bantu rumusan masalah, hipotesis, metodologi, instrumen, abstrak, dan interpretasi hasil.',
  'deadline-risk':
    'Kamu adalah planner deadline. Analisis risiko telat dari deadline, progres, kesulitan, dan buat rencana penyelesaian step-by-step.',
  'scholarship-radar':
    'Kamu adalah mentor beasiswa. Buat checklist dokumen, timeline persiapan, essay angle, dan strategi apply beasiswa.',
  'marketplace-copy':
    'Kamu adalah copywriter marketplace kampus. Buat judul, deskripsi, harga, trust signal, dan pesan balasan seller yang profesional.',
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY belum diisi di environment server.' }, { status: 500 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Kamu harus login untuk memakai Campus Tools.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const toolId = String(body.toolId || '')
    const messages = Array.isArray(body.messages) ? body.messages : []
    const system = TOOL_SYSTEM_PROMPTS[toolId]

    if (!system) {
      return NextResponse.json({ error: 'Tool tidak dikenal.' }, { status: 400 })
    }

    const safeMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []

    for (const item of messages.slice(-10)) {
      if (!item || typeof item !== 'object') continue
      const candidate = item as { role?: unknown; content?: unknown }
      if (
        (candidate.role === 'user' || candidate.role === 'assistant') &&
        typeof candidate.content === 'string'
      ) {
        safeMessages.push({
          role: candidate.role,
          content: candidate.content.slice(0, 8000),
        })
      }
    }

    if (!safeMessages.length) {
      return NextResponse.json({ error: 'Pesan kosong.' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      max_tokens: 1100,
      messages: [
        {
          role: 'system',
          content: `${system}\n\nJawab dalam Bahasa Indonesia. Beri output yang bisa langsung dipakai mahasiswa. Jangan mengarang fakta spesifik jika data user kurang; nyatakan asumsi seperlunya.`,
        },
        ...safeMessages,
      ],
    })

    const reply = completion.choices[0]?.message?.content?.trim()

    return NextResponse.json({
      reply: reply || 'Maaf, AI belum menghasilkan jawaban. Coba ulangi dengan instruksi yang lebih spesifik.',
    })
  } catch (error) {
    console.error('[Tools API] Error:', error)
    const message = error instanceof Error ? error.message : 'Gagal memproses tool.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
