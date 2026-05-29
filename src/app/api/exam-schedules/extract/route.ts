import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

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

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'GEMINI_API_KEY belum diisi di server.' }, { status: 500 })
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'PDF kalender wajib diupload.' }, { status: 400 })
  }

  const bytes = Buffer.from(await file.arrayBuffer())
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
    return NextResponse.json({ error: 'Gemini mengembalikan format yang belum valid.', raw: text }, { status: 422 })
  }

  return NextResponse.json({ data: Array.isArray(parsed) ? parsed : [] })
}
