import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { extractFromText, extractFromImage } from '@/lib/smart-input/extract'
import { extractTextFromFile } from '@/lib/smart-input/file-extract'
import { normalizeCandidates } from '@/lib/smart-input/normalize'
import { checkRateLimit, rateLimitMessage } from '@/lib/rate-limit'

// pdf-parse & mammoth butuh Node APIs (Buffer/fs) — paksa Node runtime,
// jangan Edge. maxDuration disesuaikan kalau plan Vercel mendukung (Hobby
// dibatasi 10s; Pro/Enterprise bisa lebih — sesuaikan kalau perlu).
export const runtime = 'nodejs'
export const maxDuration = 30

// Sama seperti parse-image: dibatasi oleh hard cap 4.5MB Vercel Serverless
// Functions untuk request body. Base64 menambah ~33% ukuran.
const MAX_FILE_BYTES = 3 * 1024 * 1024 // 3MB raw (~4MB setelah base64, aman di bawah cap 4.5MB Vercel)
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const rl = await checkRateLimit(supabase, 'smart-input-file', 15, 3600)
  if (!rl.allowed) return NextResponse.json({ error: rateLimitMessage(rl.retryAfterSeconds) }, { status: 429 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campus_name, plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id)
    .maybeSingle()

  const plan = getEffectivePlan({ ...(profile ?? {}), email: user.email })
  if (plan === 'radar') {
    return NextResponse.json(
      { error: 'Upload File pakai AI — upgrade ke NEXA Pulse/Command untuk membukanya. Kamu tetap bisa pakai input Manual.' },
      { status: 403 }
    )
  }

  let body: { file?: unknown; mimeType?: unknown; filename?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const base64 = typeof body.file === 'string' ? body.file : ''
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'application/octet-stream'
  const filename = typeof body.filename === 'string' ? body.filename : undefined

  if (!base64) return NextResponse.json({ error: 'File tidak ditemukan.' }, { status: 400 })
  if (Buffer.byteLength(base64, 'base64') > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'Ukuran file maksimal 3MB. Kalau PDF-nya besar, coba kompres dulu atau salin teksnya ke tab Bahasa Natural.' }, { status: 400 })
  }

  const defaultCampus = (profile?.campus_name as string) || 'Kampus'
  const meta = JSON.stringify({ filename, mimeType, bytes: Buffer.byteLength(base64, 'base64') })

  // File gambar (jpg/png) yang masuk lewat tab Upload File — arahkan ke pipeline vision,
  // biar tetap jalan tanpa user harus pindah tab.
  if (ALLOWED_IMAGE_MIME.has(mimeType)) {
    const result = await extractFromImage(base64, mimeType)

    if (result.source === 'error') {
      await supabase.from('smart_input_logs').insert({
        user_id: user.id, input_type: 'file', raw_input: meta, parsed_result: null, status: 'error',
      }).then(() => null, () => null)
      return NextResponse.json({ error: result.error, candidates: [], source: 'error' }, { status: 422 })
    }

    const candidates = normalizeCandidates(result.candidates, { defaultCampus })
    const { data: log } = await supabase
      .from('smart_input_logs')
      .insert({ user_id: user.id, input_type: 'file', raw_input: meta, parsed_result: candidates, status: candidates.length ? 'parsed' : 'error' })
      .select('id')
      .single()

    if (candidates.length === 0) {
      return NextResponse.json({ error: 'Tidak ada tugas/deadline yang terbaca dari gambar ini.', candidates: [], source: 'ai' }, { status: 422 })
    }
    return NextResponse.json({ candidates, source: result.source, provider: result.provider, model: result.model, logId: log?.id ?? null })
  }

  // PDF / DOCX → ekstrak teks dulu, lalu jalankan pipeline teks yang sama dengan tab NLP.
  const extracted = await extractTextFromFile(base64, mimeType, filename)

  if ('error' in extracted) {
    await supabase.from('smart_input_logs').insert({
      user_id: user.id, input_type: 'file', raw_input: meta, parsed_result: null, status: 'error',
    }).then(() => null, () => null)
    return NextResponse.json({ error: extracted.error, candidates: [], source: 'error' }, { status: 422 })
  }

  const result = await extractFromText(extracted.text)
  const candidates = normalizeCandidates(result.candidates, { defaultCampus })

  const { data: log } = await supabase
    .from('smart_input_logs')
    .insert({
      user_id: user.id,
      input_type: 'file',
      raw_input: `${meta}\n---\n${extracted.text.slice(0, 1500)}`,
      parsed_result: candidates,
      status: result.source === 'ai' ? 'parsed' : 'fallback',
    })
    .select('id')
    .single()

  if (candidates.length === 0) {
    return NextResponse.json({
      error: 'Tidak ada tugas/deadline yang terbaca dari isi file ini. Coba isi manual.',
      candidates: [],
      source: result.source,
    }, { status: 422 })
  }

  return NextResponse.json({
    candidates,
    source: result.source,
    intent: result.intent ?? 'unknown',
    provider: result.provider,
    model: result.model,
    logId: log?.id ?? null,
  })
}
