import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
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

const MONTHS_ID: Record<string, number> = {
  januari: 1, jan: 1, februari: 2, feb: 2, maret: 3, mar: 3, april: 4, apr: 4,
  mei: 5, juni: 6, jun: 6, juli: 7, jul: 7, agustus: 8, agu: 8, ags: 8,
  september: 9, sep: 9, oktober: 10, okt: 10, november: 11, nov: 11, desember: 12, des: 12,
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

// Parser sederhana untuk fallback tanpa Gemini. Tidak sepintar AI, tapi cukup
// untuk menarik tanggal & kategori dasar dari teks yang ditempel user.
function fallbackExtract(text: string): Array<Record<string, unknown>> {
  const today = new Date()
  const year = today.getFullYear()
  const lines = text
    .split(/\r?\n|(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 3)
    .slice(0, 20)

  const results: Array<Record<string, unknown>> = []

  for (const line of lines) {
    const lower = line.toLowerCase()
    let due: string | null = null

    const iso = lower.match(/(\d{4})-(\d{2})-(\d{2})/)
    const dmy = lower.match(/\b(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?\b/)
    const named = lower.match(/\b(\d{1,2})\s+([a-z]+)\b/)

    if (iso) {
      due = `${iso[1]}-${iso[2]}-${iso[3]}`
    } else if (dmy) {
      const d = Number(dmy[1])
      const m = Number(dmy[2])
      let y = dmy[3] ? Number(dmy[3]) : year
      if (y < 100) y += 2000
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12) due = `${y}-${pad(m)}-${pad(d)}`
    } else if (named && MONTHS_ID[named[2]]) {
      const d = Number(named[1])
      const m = MONTHS_ID[named[2]]
      if (d >= 1 && d <= 31) due = `${year}-${pad(m)}-${pad(d)}`
    } else if (/\bbesok\b/.test(lower)) {
      const t = new Date(today.getTime() + 86400000)
      due = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
    } else if (/\blusa\b/.test(lower)) {
      const t = new Date(today.getTime() + 2 * 86400000)
      due = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`
    } else if (/\bhari ini\b/.test(lower)) {
      due = `${year}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`
    }

    let category = 'lainnya'
    if (/\b(uts|uas|ujian)\b/.test(lower)) category = 'ujian'
    else if (/\b(praktikum|lab)\b/.test(lower)) category = 'praktikum'
    else if (/\b(kuis|quiz)\b/.test(lower)) category = 'kuis'
    else if (/\b(bayar|pembayaran|spp|ukt)\b/.test(lower)) category = 'pembayaran'
    else if (/\b(tugas|laporan|makalah|essay|paper)\b/.test(lower)) category = 'tugas'

    const priority = /\b(urgent|penting|deadline|terakhir|hari ini|besok)\b/.test(lower) ? 'high' : 'normal'

    // Buang potongan tanggal dari judul biar lebih rapi.
    const title = line
      .replace(/(\d{4})-(\d{2})-(\d{2})/, '')
      .replace(/\b\d{1,2}[/\-.]\d{1,2}(?:[/\-.]\d{2,4})?\b/, '')
      .replace(/[-–—:]\s*$/, '')
      .trim()

    if (!due && category === 'lainnya') continue

    results.push({
      title: title || line,
      category,
      due_date: due,
      priority,
      source: 'lainnya',
      notes: null,
    })
  }

  return results
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
    // Fallback parser sederhana tanpa Gemini: tetap bisa ekstrak deadline kasar.
    const data = fallbackExtract(text)
    return jsonResponse({
      data,
      provider: 'fallback',
      status: data.length > 0 ? 'fallback' : 'fallback_empty',
      notice: 'AI feature is not configured yet. Memakai parser sederhana — cek & rapikan hasilnya sebelum simpan.',
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
      const detail = await response.text().catch(() => '')
      console.error('[AI Quick Add] Gemini error', response.status, MODEL, detail.slice(0, 500))
      const data = fallbackExtract(text)
      return jsonResponse({
        data,
        provider: 'fallback',
        status: 'fallback',
        notice:
          `Gemini menolak permintaan (HTTP ${response.status}). Memakai parser sederhana — cek hasilnya. ` +
          'Cek GEMINI_API_KEY & GEMINI_MODEL kamu.',
      })
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
  } catch (err) {
    console.error('[AI Quick Add] request failed', err)
    const data = fallbackExtract(text)
    return jsonResponse({
      data,
      provider: 'fallback',
      status: 'fallback',
      notice: 'AI sedang tidak bisa dihubungi. Memakai parser sederhana — cek & rapikan hasilnya sebelum simpan.',
    })
  }
}
