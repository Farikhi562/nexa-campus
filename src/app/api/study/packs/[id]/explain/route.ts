import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { generateText, aiConfigured } from '@/lib/ai/llm'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles')
    .select('plan, email, pulse_trial_until, plan_expires_at, subscription_expires_at, command_expires_at, lifetime_command')
    .eq('id', user.id).maybeSingle()
  if (getEffectivePlan({ ...(profile ?? {}), email: user.email }) !== 'command') {
    return NextResponse.json({ error: 'Fitur ini khusus NEXA Command.' }, { status: 403 })
  }

  if (!aiConfigured()) {
    return NextResponse.json({ error: 'AI belum aktif di server.' }, { status: 503 })
  }

  let body: { concept?: unknown; description?: unknown }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }) }

  const concept = typeof body.concept === 'string' ? body.concept.trim().slice(0, 200) : ''
  if (!concept) return NextResponse.json({ error: 'concept wajib diisi.' }, { status: 400 })

  const { data: pack } = await supabase.from('study_packs')
    .select('topic, summary')
    .eq('id', id).eq('user_id', user.id).maybeSingle()
  if (!pack) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })

  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 500) : ''

  const { text } = await generateText({
    system: `Kamu tutor yang menjelaskan konsep secara mendalam untuk mahasiswa Indonesia. Gunakan bahasa yang mudah dipahami, berikan contoh nyata/analogi, dan jelaskan hal-hal yang sering membingungkan. Format respons pakai **bold** untuk istilah penting. Respons 300-500 kata.`,
    user: `Topik: ${pack.topic}
Konsep: ${concept}${description ? `\nDeskripsi singkat: ${description}` : ''}
${pack.summary ? `\nKonteks materi:\n${pack.summary.slice(0, 1500)}` : ''}

Jelaskan konsep ini secara mendalam: definisi lengkap, kenapa penting, contoh nyata, dan hal yang sering bikin bingung mahasiswa.`,
    temperature: 0.5,
    maxTokens: 1200,
  })

  return NextResponse.json({ explanation: text.trim() })
}
