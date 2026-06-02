import { NextRequest, NextResponse } from 'next/server'
import { askNexa } from '@/lib/ai/ask-nexa'
import { createClient } from '@/lib/supabase/server'

const SAFE_ERROR = 'Tanya NEXA lagi penuh sebentar. Coba lagi nanti, atau cek FAQ dulu.'
const MAX_MESSAGE_LENGTH = 1000

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kamu perlu login dulu untuk pakai Tanya NEXA.' }, { status: 401 })
  }

  let body: { message?: unknown }
  try {
    body = (await request.json()) as { message?: unknown }
  } catch {
    return NextResponse.json({ error: SAFE_ERROR }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''

  if (!message) {
    return NextResponse.json({ error: 'Tulis pertanyaan dulu ya.' }, { status: 400 })
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: 'Pertanyaannya kepanjangan. Coba ringkas maksimal 1000 karakter.' }, { status: 400 })
  }

  // TODO: add per-user rate limiting so Gemini Free Tier does not get drained too quickly.
  try {
    const result = await askNexa(message)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: SAFE_ERROR }, { status: 500 })
  }
}
