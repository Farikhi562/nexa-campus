import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const MAX_TEXT_LENGTH = 6000

const SYSTEM_PROMPT =
  'Kamu adalah asisten deadline extractor untuk mahasiswa Indonesia. Extract semua deadline dari teks berikut. Return JSON array dengan format: [{title, category (tugas/praktikum/kuis/ujian/pembayaran/lainnya), due_date (ISO 8601), priority (urgent/high/normal/low), source, notes}]. Jika tanggal tidak spesifik, gunakan null. Respond ONLY with JSON array, no markdown.'

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
  }>
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status })
}

function extractJsonArray(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return { data: parsed }
  } catch {
    // Fall through to bracket extraction below.
  }

  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start >= 0 && end > start) {
    const sliced = cleaned.slice(start, end + 1)
    try {
      const parsed = JSON.parse(sliced)
      if (Array.isArray(parsed)) return { data: parsed }
    } catch {
      // The client can still show raw response for manual editing.
    }
  }

  return { rawResponse: raw }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return jsonResponse({ error: 'Kamu perlu login dulu.' }, 401)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.plan === 'radar') {
    return jsonResponse(
      {
        error: 'AI Quick Add tersedia untuk NEXA Pulse dan NEXA Command.',
        status: 'locked',
      },
      403
    )
  }

  let body: { text?: unknown }
  try {
    body = (await request.json()) as { text?: unknown }
  } catch {
    return jsonResponse({ error: 'Request tidak valid.' }, 400)
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) return jsonResponse({ error: 'Paste info deadline dulu ya.' }, 400)
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonResponse({ error: `Teks terlalu panjang. Maksimal ${MAX_TEXT_LENGTH} karakter.` }, 400)
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return jsonResponse({
      answer:
        'AI Quick Add belum aktif karena konfigurasi AI belum tersedia. Kamu tetap bisa menambah deadline manual.',
      provider: 'none',
      status: 'locked',
    })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text }],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1200,
            responseMimeType: 'application/json',
          },
        }),
      }
    )

    if (!response.ok) {
      return jsonResponse({ error: 'AI Quick Add sedang tidak bisa dipakai. Coba lagi nanti.' }, 502)
    }

    const result = (await response.json()) as GeminiResponse
    const rawResponse =
      result.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join('\n')
        .trim() || ''

    if (!rawResponse) {
      return jsonResponse({ error: 'AI tidak mengembalikan hasil. Coba paste teks yang lebih jelas.' }, 502)
    }

    const parsed = extractJsonArray(rawResponse)
    if ('rawResponse' in parsed) {
      return jsonResponse(
        {
          error: 'Hasil AI belum bisa diparse otomatis. Kamu bisa edit raw response di form.',
          rawResponse: parsed.rawResponse,
          provider: 'gemini',
          model: MODEL,
          status: 'parse_failed',
        },
        422
      )
    }

    return jsonResponse({
      data: parsed.data,
      provider: 'gemini',
      model: MODEL,
      status: 'success',
    })
  } catch {
    return jsonResponse({ error: 'AI Quick Add sedang tidak bisa dipakai. Coba lagi nanti.' }, 500)
  }
}
