import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { checkRateLimit, isPdfBytes, MAX_GEMINI_PDF_SIZE } from '@/lib/server-security'

export const runtime = 'nodejs'
export const maxDuration = 60

const PROMPT =
  'Extract all exam/UTS/UAS schedule dates from this academic calendar PDF. Return JSON array with fields: subject, type (UTS/UAS/Quiz), date (ISO format), notes'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = checkRateLimit(`schedule-extract:${user.id}`, 10, 60 * 60 * 1000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Terlalu banyak ekstraksi jadwal. Coba lagi nanti.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    )
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY belum diisi di server.' }, { status: 500 })
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'PDF kalender wajib diupload.' }, { status: 400 })
  }

  if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
    return NextResponse.json({ error: 'Hanya file PDF yang didukung.' }, { status: 400 })
  }

  if (file.size <= 0 || file.size > MAX_GEMINI_PDF_SIZE) {
    return NextResponse.json({ error: 'PDF kalender maksimal 5MB.' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  if (!isPdfBytes(bytes)) {
    return NextResponse.json({ error: 'File tidak valid. Pastikan file benar-benar PDF.' }, { status: 400 })
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' })
  const result = await model.generateContent([
    PROMPT,
    {
      inlineData: {
        mimeType: file.type || 'application/pdf',
        data: bytes.toString('base64'),
      },
    },
  ])

  const text = result.response.text()
  const jsonText = text.replace(/```json|```/g, '').trim()
  let parsed: unknown = []
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    console.warn('[Exam schedule extract] Invalid Gemini JSON:', text.slice(0, 500))
    return NextResponse.json({ error: 'Gemini mengembalikan format yang belum valid.' }, { status: 422 })
  }

  return NextResponse.json({ data: Array.isArray(parsed) ? parsed : [] })
}
