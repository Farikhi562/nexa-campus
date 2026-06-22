import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText, aiConfigured } from '@/lib/ai/llm'
import { checkRateLimit, rateLimitMessage } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 30

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  if (!aiConfigured()) return NextResponse.json({ error: 'AI belum aktif.' }, { status: 503 })

  const rl = await checkRateLimit(supabase, 'arena-brief', 15, 3600)
  if (!rl.allowed) return NextResponse.json({ error: rateLimitMessage(rl.retryAfterSeconds) }, { status: 429 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const title = typeof body.title === 'string' ? body.title.trim().slice(0, 160) : ''
  if (!title) return NextResponse.json({ error: 'Judul wajib diisi sebelum generate brief.' }, { status: 400 })

  const compName = typeof body.competition_name === 'string' ? body.competition_name.trim() : ''
  const compType = typeof body.competition_type === 'string' ? body.competition_type : 'lomba'
  const skills = Array.isArray(body.skills_needed) ? (body.skills_needed as unknown[]).map(String).filter(Boolean).join(', ') : ''
  const teamSize = body.team_size_max ? `Tim maks ${body.team_size_max} orang` : ''
  const deadline = typeof body.deadline_registration === 'string' ? body.deadline_registration : ''

  const { text } = await generateText({
    system: `Kamu penulis brief rekrutmen tim lomba mahasiswa Indonesia. 
Tulis deskripsi posting yang menarik, informatif, dan membuat kandidat kompeten tertarik bergabung.
Bahasa natural, bukan korporat. Jangan bertele-tele.`,
    user: `Tulis deskripsi untuk posting Arena ini:
Judul: ${title}
${compName ? `Nama kompetisi: ${compName}` : ''}
Tipe: ${compType}
${skills ? `Skill yang dicari: ${skills}` : ''}
${teamSize}
${deadline ? `Deadline daftar: ${deadline}` : ''}

Sertakan: lomba ini tentang apa, skill yang dicari dan kenapa, ekspektasi komitmen, apa yang tim ini tawarkan ke anggota baru.
Maks 200 kata. Langsung bisa dipakai.`,
    temperature: 0.65,
    maxTokens: 450,
  })

  return NextResponse.json({ result: text.trim() })
}
