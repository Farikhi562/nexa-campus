import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { checkRateLimit, rateLimitMessage } from '@/lib/rate-limit'
import { generateFromImage, aiConfigured, activeProviderInfo, LlmFailure } from '@/lib/ai/llm'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

const SYSTEM_PROMPT =
  'Kamu adalah asisten deadline extractor untuk mahasiswa Indonesia. Baca gambar (foto papan tulis, screenshot jadwal, atau pengumuman) lalu extract semua deadline/jadwal. Return JSON array dengan format: [{title, category (tugas/praktikum/kuis/ujian/pembayaran/lainnya), due_date (ISO 8601 atau null), priority (urgent/high/normal/low), source, notes}]. Jika tanggal tidak spesifik, gunakan null. Respond ONLY with JSON array, tanpa markdown.'

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status })
}

function extractJsonArray(raw: string) {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) return { data: parsed }
    if (parsed && typeof parsed === 'object') {
      for (const key of ['deadlines', 'data', 'items', 'result']) {
        const maybe = (parsed as Record<string, unknown>)[key]
        if (Array.isArray(maybe)) return { data: maybe }
      }
    }
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

  const rl = await checkRateLimit(supabase, 'ai-extract-image', 15, 3600)
  if (!rl.allowed) return jsonResponse({ error: rateLimitMessage(rl.retryAfterSeconds) }, 429)

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, plan, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id)
    .maybeSingle()
  if (getEffectivePlan({ ...(profile ?? {}), email: user.email }) === 'radar') {
    return jsonResponse({ error: 'AI dari foto tersedia untuk NEXA Pulse dan NEXA Command.', status: 'locked' }, 403)
  }

  if (!aiConfigured()) {
    return jsonResponse(
      { error: 'Fitur AI belum aktif. Untuk membaca foto, set AI_PROVIDER + API key, atau gunakan input teks.', status: 'locked' },
      503
    )
  }

  const info = activeProviderInfo()
  if (!info.supportsVision) {
    return jsonResponse(
      {
        error: `Provider AI aktif (${info.provider}) belum mendukung baca foto. Ganti ke Groq/OpenRouter/Gemini, atau gunakan input teks.`,
        status: 'no_vision',
      },
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
    const { text: rawResponse, provider, model } = await generateFromImage({
      system: SYSTEM_PROMPT,
      prompt: 'Extract semua deadline dari gambar ini.',
      base64,
      mimeType,
      temperature: 0.1,
      maxTokens: 1200,
      json: true,
    })

    if (!rawResponse) {
      return jsonResponse({ error: 'AI tidak menemukan deadline di gambar. Coba foto yang lebih jelas.' }, 502)
    }

    const parsed = extractJsonArray(rawResponse)
    if ('rawResponse' in parsed) {
      return jsonResponse(
        { error: 'Hasil AI belum bisa diparse otomatis.', rawResponse: parsed.rawResponse, provider, model, status: 'parse_failed' },
        422
      )
    }

    return jsonResponse({ data: parsed.data, provider, model, status: 'success' })
  } catch (err) {
    if (err instanceof LlmFailure && err.info.code === 'http_error') {
      return jsonResponse({ error: `AI gagal membaca gambar (HTTP ${err.info.status}). Coba foto yang lebih jelas atau cek API key.` }, 502)
    }
    console.error('[AI Photo] request failed', err)
    return jsonResponse({ error: 'AI sedang tidak bisa membaca gambar. Coba lagi sebentar.' }, 500)
  }
}
