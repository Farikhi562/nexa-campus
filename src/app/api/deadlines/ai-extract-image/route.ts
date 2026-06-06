import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MODEL = process.env.GEMINI_VISION_MODEL || process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

const SYSTEM_PROMPT =
  'Kamu adalah asisten deadline extractor untuk mahasiswa Indonesia. Baca gambar (foto papan tulis, screenshot jadwal, atau pengumuman) lalu extract semua deadline/jadwal. Return JSON array dengan format: [{title, category (tugas/praktikum/kuis/ujian/pembayaran/lainnya), due_date (ISO 8601 atau null), priority (urgent/high/normal/low), source, notes}]. Jika tanggal tidak spesifik, gunakan null. Respond ONLY with JSON array, tanpa markdown.'

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status })
}

function extractJsonArray(raw: string) {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return { data: parsed }
  } catch {
    // continue
  }
  const start = cleaned.indexOf('[')
  const end = cleaned.lastIndexOf(']')
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(cleaned.slice(start, end + 1))
      if (Array.isArray(parsed)) return { data: parsed }
    } catch {
      // continue
    }
  }
  return { rawResponse: raw }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return jsonResponse({ error: 'Kamu perlu login dulu.' }, 401)

  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).maybeSingle()
  if (!profile || profile.plan === 'radar') {
    return jsonResponse({ error: 'AI dari foto tersedia untuk NEXA Pulse dan NEXA Command.', status: 'locked' }, 403)
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return jsonResponse(
      { error: 'AI feature is not configured yet. Untuk foto, AI wajib aktif — set GEMINI_API_KEY atau pakai input teks.', status: 'locked' },
      503
    )
  }

  let body: { image?: unknown; mimeType?: unknown }
  try {
    body = (await request.json()) as { image?: unknown; mimeType?: unknown }
  } catch {
    return jsonResponse({ error: 'Request tidak valid.' }, 400)
  }

  const base64 = typeof body.image === 'string' ? body.image.replace(/^data:[^;]+;base64,/, '') : ''
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'image/jpeg'

  if (!base64) return jsonResponse({ error: 'Upload fotonya dulu ya.' }, 400)
  if (!ALLOWED_MIME.has(mimeType)) return jsonResponse({ error: 'Format gambar tidak didukung (pakai JPG/PNG/WebP).' }, 400)
  if (Buffer.byteLength(base64, 'base64') > MAX_IMAGE_BYTES) {
    return jsonResponse({ error: 'Gambar terlalu besar. Maksimal 5MB.' }, 400)
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [
            {
              role: 'user',
              parts: [
                { text: 'Extract semua deadline dari gambar ini.' },
                { inline_data: { mime_type: mimeType, data: base64 } },
              ],
            },
          ],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1200, responseMimeType: 'application/json' },
        }),
      }
    )

    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      console.error('[AI Photo] Gemini error', response.status, MODEL, detail.slice(0, 500))
      return jsonResponse({ error: `AI gagal membaca gambar (HTTP ${response.status}). Cek GEMINI_API_KEY/model atau coba foto yang lebih jelas.` }, 502)
    }

    const result = (await response.json()) as GeminiResponse
    const rawResponse =
      result.candidates?.[0]?.content?.parts?.map((part) => part.text).filter(Boolean).join('\n').trim() || ''

    if (!rawResponse) {
      return jsonResponse({ error: 'AI tidak menemukan deadline di gambar. Coba foto yang lebih jelas.' }, 502)
    }

    const parsed = extractJsonArray(rawResponse)
    if ('rawResponse' in parsed) {
      return jsonResponse(
        { error: 'Hasil AI belum bisa diparse otomatis.', rawResponse: parsed.rawResponse, provider: 'gemini', model: MODEL, status: 'parse_failed' },
        422
      )
    }

    return jsonResponse({ data: parsed.data, provider: 'gemini', model: MODEL, status: 'success' })
  } catch (err) {
    console.error('[AI Photo] request failed', err)
    return jsonResponse({ error: 'AI sedang tidak bisa membaca gambar. Coba lagi sebentar.' }, 500)
  }
}
