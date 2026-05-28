import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `Kamu adalah NEXA Assistant untuk NEXA Campus Ecosystem v1.0.

Konteks produk:
- NEXA adalah platform mahasiswa untuk mock exam AI, smart reminder, marketplace kampus, study room, dan Campus Tools.
- Paket Free: coba belajar dasar, 1 dokumen, 1 mock exam, lihat marketplace, reminder dasar.
- Paket Basic: Rp15.000/bulan, 5 dokumen, mock exam lebih leluasa, export PDF, bisa jual barang dan jasa kampus.
- Paket Pro: Rp25.000/bulan, dokumen unlimited, study room, WhatsApp reminder otomatis, analytics, AI mentor.
- Pembayaran diarahkan melalui Midtrans checkout atau admin.
- Seller marketplace hanya untuk Basic dan Pro. Free bisa browse dan kontak seller.
- Jika user punya masalah login, profil, pembayaran, atau aktivasi, arahkan ke halaman Contact atau Pricing.

Aturan:
- Jawab dalam Bahasa Indonesia yang ramah, ringkas, dan praktis.
- Jangan mengklaim pembayaran sudah sukses. Untuk aktivasi paket, minta user cek Midtrans/admin.
- Jangan meminta password, service role key, atau secret lain.
- Jika pertanyaan teknis terlalu sensitif, arahkan ke admin.
- Gunakan maksimal 5 bullet kecuali user minta detail.`

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function getOpenAIStatus(error: unknown) {
  const candidate = error as { status?: unknown; code?: unknown }
  const message = error instanceof Error ? error.message : ''
  const status = typeof candidate.status === 'number' ? candidate.status : undefined
  const code = typeof candidate.code === 'string' ? candidate.code : ''
  return { status, code, message }
}

function openAIErrorResponse(error: unknown) {
  const { status, code, message } = getOpenAIStatus(error)
  const normalized = `${code} ${message}`.toLowerCase()

  if (status === 429 || normalized.includes('quota') || normalized.includes('rate_limit')) {
    return NextResponse.json(
      {
        error:
          'AI sedang tidak tersedia karena kuota OpenAI server habis atau terkena limit. Chatbot tetap aman; admin perlu cek billing/limit OpenAI atau memakai API key dengan kuota aktif.',
      },
      { status: 429 }
    )
  }

  return NextResponse.json(
    { error: 'AI sedang bermasalah. Coba lagi sebentar lagi atau hubungi admin dari halaman Contact.' },
    { status: 502 }
  )
}

function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return []

  const output: ChatMessage[] = []
  for (const item of input.slice(-8)) {
    if (!item || typeof item !== 'object') continue
    const candidate = item as { role?: unknown; content?: unknown }
    if (
      (candidate.role === 'user' || candidate.role === 'assistant') &&
      typeof candidate.content === 'string'
    ) {
      output.push({
        role: candidate.role,
        content: candidate.content.slice(0, 3000),
      })
    }
  }
  return output
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY belum diisi di environment server.' },
        { status: 500 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const messages = sanitizeMessages(body.messages)

    if (!messages.length) {
      return NextResponse.json({ error: 'Pesan kosong.' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.4,
      max_tokens: 700,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
      ],
    })

    const reply = completion.choices[0]?.message?.content?.trim()

    return NextResponse.json({
      reply: reply || 'Maaf, aku belum bisa menjawab. Coba tulis pertanyaan dengan lebih spesifik.',
    })
  } catch (error) {
    console.error('[Chatbot API] Error:', error)
    return openAIErrorResponse(error)
  }
}
