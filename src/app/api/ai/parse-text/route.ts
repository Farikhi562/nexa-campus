import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEffectivePlan } from '@/lib/plans'
import { extractFromText } from '@/lib/smart-input/extract'
import { normalizeCandidates } from '@/lib/smart-input/normalize'

const MAX_TEXT_LENGTH = 4000

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
      { error: 'Bahasa Natural pakai AI — upgrade ke NEXA Pulse/Command untuk membukanya. Kamu tetap bisa pakai input Manual.' },
      { status: 403 }
    )
  }

  let body: { text?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const text = typeof body.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'Tulis dulu tugas/jadwalnya ya.' }, { status: 400 })
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: `Teks kepanjangan (maks ${MAX_TEXT_LENGTH} karakter). Ringkas dulu ya.` }, { status: 400 })
  }

  const defaultCampus = (profile?.campus_name as string) || 'Kampus'
  const result = await extractFromText(text)
  const candidates = normalizeCandidates(result.candidates, { defaultCampus })

  const { data: log } = await supabase
    .from('smart_input_logs')
    .insert({
      user_id: user.id,
      input_type: 'nlp',
      raw_input: text.slice(0, 2000),
      parsed_result: candidates,
      status: result.source === 'ai' ? 'parsed' : 'fallback',
    })
    .select('id')
    .single()

  return NextResponse.json({
    candidates,
    source: result.source,
    provider: result.provider,
    model: result.model,
    logId: log?.id ?? null,
  })
}
