import { NextResponse } from 'next/server'
import { geminiChat } from '@/lib/gemini'
import { validateAiUsage } from '@/lib/policy'
import { BRAND } from '@/lib/brand'
import { checkRateLimit, getClientIp } from '@/lib/server-security'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `Kamu adalah NEXA Assistant untuk ${BRAND.productName} v1.0.

Konteks produk:
- ${BRAND.productName} adalah produk resmi ${BRAND.companyName}.
- ${BRAND.founderTitle}: ${BRAND.founderName}.
- Domain resmi: ${BRAND.domain}.
- Produk ini adalah platform mahasiswa untuk mock exam AI, smart reminder, marketplace kampus, study room, dan Campus Tools.
- AI memakai ${BRAND.aiProvider} 1.5 Flash.
- Paket Free: coba belajar dasar, 1 dokumen, 1 mock exam, lihat marketplace, reminder dasar.
- Paket Basic: Rp19.000/bulan, 5 dokumen, mock exam lebih leluasa, export PDF, 5 Campus Tools pertama, bisa jual barang dan jasa kampus, dan bisa membuat room publik.
- Paket Pro: Rp39.000/bulan, dokumen unlimited, semua 15 Campus Tools, Chat with PDF, ringkasan otomatis, analisis kelemahan, room private, tim belajar, Telegram reminder/laporan mingguan, priority processing, export multi-format, dan 3 team seat.
- Reminder otomatis dikirim lewat Telegram Bot @NEXATchBot.
- Pembayaran diarahkan melalui ${BRAND.paymentProvider} checkout atau admin resmi ${BRAND.companyName}.
- Seller marketplace hanya untuk Basic dan Pro. Free bisa browse dan kontak seller.

Aturan:
- Jawab dalam Bahasa Indonesia yang ramah, ringkas, dan praktis.
- Jangan mengklaim pembayaran sudah sukses. Untuk aktivasi paket, minta user cek ${BRAND.paymentProvider}/admin.
- Jangan meminta password, service role key, token, atau secret lain.
- Jika pertanyaan teknis terlalu sensitif, arahkan ke admin.
- Gunakan maksimal 5 bullet kecuali user minta detail.`

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function sanitizeMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return []
  const output: ChatMessage[] = []
  for (const item of input.slice(-8)) {
    if (!item || typeof item !== 'object') continue
    const candidate = item as { role?: unknown; content?: unknown }
    if ((candidate.role === 'user' || candidate.role === 'assistant') && typeof candidate.content === 'string') {
      output.push({ role: candidate.role, content: candidate.content.slice(0, 2000) })
    }
  }
  return output
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ip = getClientIp(request)
    const limit = checkRateLimit(`chatbot:${ip}`, 20, 60 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Terlalu banyak request ke chatbot. Coba lagi nanti.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      )
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'GEMINI_API_KEY belum diisi di environment server.' }, { status: 500 })
    }

    const body = await request.json().catch(() => ({}))
    const messages = sanitizeMessages(body.messages)
    if (!messages.length) return NextResponse.json({ error: 'Pesan kosong.' }, { status: 400 })

    const joined = messages.map((message) => message.content).join('\n')
    if (joined.length > 8000) {
      return NextResponse.json({ error: 'Pesan terlalu panjang.' }, { status: 400 })
    }

    const policyCheck = validateAiUsage(joined)
    if (!policyCheck.ok) return NextResponse.json({ error: policyCheck.message }, { status: 400 })

    const reply = await geminiChat({ system: SYSTEM_PROMPT, messages, maxOutputTokens: 700 })
    return NextResponse.json({
      reply: reply || 'Maaf, aku belum bisa menjawab. Coba tulis pertanyaan dengan lebih spesifik.',
    })
  } catch (error) {
    console.error('[Chatbot API] Error:', error)
    return NextResponse.json(
      { error: 'Gemini sedang bermasalah. Coba lagi sebentar lagi.' },
      { status: 502 }
    )
  }
}
