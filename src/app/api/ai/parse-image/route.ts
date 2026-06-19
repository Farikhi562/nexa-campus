import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { extractFromImage } from '@/lib/smart-input/extract'
import { normalizeCandidates } from '@/lib/smart-input/normalize'

export const runtime = 'nodejs'
export const maxDuration = 30

// PENTING: ini bukan limit "pilihan kami" — ini batas dari platform Vercel.
// Vercel Serverless Functions punya hard limit 4.5MB untuk request body
// (tidak bisa dikonfigurasi naik). Base64 menambah ~33% ukuran, jadi raw image
// harus dijaga di bawah ~3MB agar base64 + overhead JSON tetap < 4.5MB.
// Kalau nanti perlu upload lebih besar, solusinya adalah upload langsung ke
// Supabase Storage dari client lalu kirim path-nya saja ke API — bukan kirim
// base64 lewat body JSON. Lihat README untuk detail.
const MAX_IMAGE_BYTES = 3 * 1024 * 1024 // 3MB raw (~4MB setelah base64, aman di bawah cap 4.5MB Vercel)
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'])

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('campus_name, plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id)
    .maybeSingle()

  const plan = getEffectivePlan({ ...(profile ?? {}), email: user.email })
  if (plan === 'radar') {
    return NextResponse.json(
      { error: 'Upload Gambar pakai AI — upgrade ke NEXA Pulse/Command untuk membukanya. Kamu tetap bisa pakai input Manual.' },
      { status: 403 }
    )
  }

  let body: { image?: unknown; mimeType?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const base64 = typeof body.image === 'string' ? body.image : ''
  const mimeType = typeof body.mimeType === 'string' ? body.mimeType : 'image/jpeg'

  if (!base64) return NextResponse.json({ error: 'Gambar tidak ditemukan.' }, { status: 400 })
  if (!ALLOWED_MIME.has(mimeType)) {
    return NextResponse.json({ error: 'Format gambar tidak didukung (pakai JPG/PNG/WebP).' }, { status: 400 })
  }
  if (Buffer.byteLength(base64, 'base64') > MAX_IMAGE_BYTES) {
    return NextResponse.json({ error: 'Ukuran gambar maksimal 3MB. Kompres atau crop dulu kalau lebih besar.' }, { status: 400 })
  }

  const defaultCampus = (profile?.campus_name as string) || 'Kampus'
  const result = await extractFromImage(base64, mimeType)

  if (result.source === 'error') {
    await supabase.from('smart_input_logs').insert({
      user_id: user.id,
      input_type: 'image',
      raw_input: JSON.stringify({ mimeType, bytes: Buffer.byteLength(base64, 'base64') }),
      parsed_result: null,
      status: 'error',
    }).then(() => null, () => null)

    return NextResponse.json({ error: result.error, candidates: [], source: 'error' }, { status: 422 })
  }

  const candidates = normalizeCandidates(result.candidates, { defaultCampus })

  const { data: log } = await supabase
    .from('smart_input_logs')
    .insert({
      user_id: user.id,
      input_type: 'image',
      raw_input: JSON.stringify({ mimeType, bytes: Buffer.byteLength(base64, 'base64') }),
      parsed_result: candidates,
      status: candidates.length > 0 ? 'parsed' : 'error',
    })
    .select('id')
    .single()

  if (candidates.length === 0) {
    return NextResponse.json({
      error: 'Tidak ada tugas/deadline yang terbaca dari gambar ini. Coba foto yang lebih jelas, atau isi manual.',
      candidates: [],
      source: 'ai',
    }, { status: 422 })
  }

  return NextResponse.json({
    candidates,
    source: result.source,
    provider: result.provider,
    model: result.model,
    logId: log?.id ?? null,
  })
}
