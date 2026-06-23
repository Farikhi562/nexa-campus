import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { extractTextFromFile } from '@/lib/smart-input/file-extract'
import { generateStudyPack } from '@/lib/study/generate-study-pack'
import { checkRateLimit, rateLimitMessage } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 45

// Sama dengan batas Smart Input (Batch 7): Vercel Serverless Functions punya
// hard limit 4.5MB request body, base64 menambah ~33% ukuran. 3MB raw aman.
const MAX_FILE_BYTES = 3 * 1024 * 1024
const MAX_TEXT_CHARS = 12000

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id)
    .maybeSingle()

  if (getEffectivePlan({ ...(profile ?? {}), email: user.email }) !== 'command') {
    return NextResponse.json({ error: 'Belajar dari materi khusus NEXA Command.', status: 'locked' }, { status: 403 })
  }

  const rl = await checkRateLimit(supabase, 'study-generate', 10, 3600)
  if (!rl.allowed) return NextResponse.json({ error: rateLimitMessage(rl.retryAfterSeconds) }, { status: 429 })

  // Batasi jumlah study pack per user supaya tidak bisa di-spam (selain rate
  // limit di bawah) — generasi materi cukup berat (panggilan AI besar).
  const { count } = await supabase
    .from('study_packs')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= 100) {
    return NextResponse.json({ error: 'Sudah mencapai batas 100 materi tersimpan. Hapus yang lama dulu.' }, { status: 400 })
  }

  let body: { file?: unknown; mimeType?: unknown; filename?: unknown; text?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  let extractedText = ''
  let sourceType: 'file' | 'text' = 'text'
  let sourceFilename: string | null = null

  if (typeof body.file === 'string' && body.file) {
    const base64 = body.file
    const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'application/octet-stream'
    const filename = typeof body.filename === 'string' ? body.filename : undefined

    if (Buffer.byteLength(base64, 'base64') > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Ukuran file maksimal 3MB. Coba ringkas/potong materinya, atau tempel sebagai teks langsung.' }, { status: 400 })
    }

    const extracted = await extractTextFromFile(base64, mimeType, filename)
    if ('error' in extracted) {
      return NextResponse.json({ error: extracted.error }, { status: 422 })
    }
    extractedText = extracted.text
    sourceType = 'file'
    sourceFilename = filename ?? null
  } else if (typeof body.text === 'string') {
    extractedText = body.text.slice(0, MAX_TEXT_CHARS)
    sourceType = 'text'
  } else {
    return NextResponse.json({ error: 'Upload file atau tempel teks materi dulu.' }, { status: 400 })
  }

  const result = await generateStudyPack(extractedText)
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('study_packs')
    .insert({
      user_id: user.id,
      source_filename: sourceFilename,
      source_type: sourceType,
      topic: result.pack.topic,
      roadmap: result.pack.roadmap,
      summary: result.pack.summary,
      quiz: result.pack.quiz,
    })
    .select('*')
    .single()

  if (error) {
    console.error('[api]', error.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
