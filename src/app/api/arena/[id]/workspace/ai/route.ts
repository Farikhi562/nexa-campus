import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText, aiConfigured } from '@/lib/ai/llm'
import { checkRateLimit, rateLimitMessage } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 45

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  if (!aiConfigured()) return NextResponse.json({ error: 'AI belum aktif di server.' }, { status: 503 })

  const rl = await checkRateLimit(supabase, 'arena-ai', 10, 3600)
  if (!rl.allowed) return NextResponse.json({ error: rateLimitMessage(rl.retryAfterSeconds) }, { status: 429 })

  let body: { action?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const action = body.action
  if (!['tasks', 'analyze', 'brief'].includes(action ?? '')) {
    return NextResponse.json({ error: 'action harus "tasks", "analyze", atau "brief".' }, { status: 400 })
  }

  // Ambil data post + workspace + anggota tim
  const [postRes, workspaceRes, membersRes] = await Promise.all([
    supabase.from('nexa_arena_posts')
      .select('id, title, description, competition_name, competition_type, skills_needed, team_size_max, current_team_size, creator_id, event_date, registration_deadline')
      .eq('id', id).maybeSingle(),
    supabase.from('nexa_arena_workspaces').select('owner_task, team_status, checklist').eq('post_id', id).maybeSingle(),
    supabase.from('nexa_arena_team_members').select('user_id, role').eq('post_id', id).limit(20),
  ])

  const post = postRes.data as Record<string, unknown> | null
  if (!post) return NextResponse.json({ error: 'Arena post tidak ditemukan.' }, { status: 404 })

  // Verifikasi user adalah creator atau anggota tim
  const isCreator = post.creator_id === user.id
  const members = (membersRes.data ?? []) as Array<{ user_id: string; role: string }>
  const isMember = members.some((m) => m.user_id === user.id)
  if (!isCreator && !isMember) {
    return NextResponse.json({ error: 'Hanya creator atau anggota tim yang bisa menggunakan fitur AI ini.' }, { status: 403 })
  }

  const ws = workspaceRes.data as Record<string, unknown> | null
  const title = String(post.title ?? '')
  const compName = post.competition_name ? `(${post.competition_name})` : ''
  const compType = String(post.competition_type ?? 'lomba')
  const description = String(post.description ?? '')
  const skillsNeeded = Array.isArray(post.skills_needed) ? (post.skills_needed as string[]).join(', ') : ''
  const eventDate = post.event_date ? `Event: ${post.event_date}` : ''
  const regDeadline = post.registration_deadline ? `Deadline daftar: ${post.registration_deadline}` : ''
  const teamSize = `Tim: ${post.current_team_size}/${post.team_size_max} orang`
  const existingTasks = ws?.checklist ? JSON.stringify(ws.checklist) : '[]'

  const SYSTEM = `Kamu asisten AI untuk tim lomba mahasiswa Indonesia. 
Berikan jawaban konkret, praktis, dan langsung bisa dieksekusi.
Bahasa Indonesia natural. Jangan bertele-tele.`

  if (action === 'tasks') {
    // Generate task breakdown untuk kompetisi
    const prompt = `Tim "${title}" ${compName} sedang mempersiapkan kompetisi ${compType}.

${description ? `Deskripsi: ${description}` : ''}
${skillsNeeded ? `Skill tim: ${skillsNeeded}` : ''}
${eventDate}  ${regDeadline}  ${teamSize}

Task yang sudah ada: ${existingTasks}

Buat breakdown task yang KONKRET dan BISA LANGSUNG DIKERJAKAN untuk persiapan kompetisi ini. 
Format: JSON array berisi string, maks 15 task. 
Contoh format output (respond ONLY JSON array, no markdown fence):
["Riset tema kompetisi dan baca panduan resmi","Bagi role: siapa handle UI, backend, presentasi","Buat mockup/wireframe awal","Validasi ide ke dosen/mentor","..."]

Prioritaskan task yang paling krusial duluan. Task harus spesifik dan actionable, bukan generic.`

    const { text } = await generateText({ system: SYSTEM, user: prompt, temperature: 0.4, maxTokens: 600, json: true })
    let tasks: string[] = []
    try {
      const clean = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
      const parsed = JSON.parse(clean)
      if (Array.isArray(parsed)) tasks = parsed.filter((t) => typeof t === 'string' && t.trim()).slice(0, 15)
    } catch { /* pakai empty */ }

    return NextResponse.json({ action, tasks, raw: text })

  } else if (action === 'analyze') {
    // Ambil skills tiap anggota tim
    const memberIds = members.map((m) => m.user_id)
    const profilesRes = memberIds.length > 0
      ? await supabase.from('profiles').select('id, full_name, profile_skills').in('id', memberIds)
      : { data: [] }
    const profiles = (profilesRes.data ?? []) as Array<{ id: string; full_name: string | null; profile_skills: string[] | null }>
    const memberSkills = profiles.map((p) => `- ${p.full_name ?? 'Anggota'}: ${(p.profile_skills ?? []).join(', ') || '(belum isi skill)'}`)

    const prompt = `Tim "${title}" ${compName} — kompetisi ${compType}

Skill yang dibutuhkan: ${skillsNeeded || '(tidak ditentukan)'}
${description ? `Deskripsi lomba: ${description}` : ''}

Anggota tim dan skill mereka:
${memberSkills.join('\n')}

Analisis:
1. **Kekuatan tim** — skill yang sudah solid
2. **Gap skill** — apa yang kurang / belum ada di tim 
3. **Rekomendasi pembagian peran** — siapa cocok handle bagian apa berdasarkan skill
4. **Saran persiapan** — langkah konkret untuk menutup gap sebelum lomba

Jawab jujur, bukan sekadar memuji. Kalau ada gap serius, sebutkan dan kasih solusinya.`

    const { text } = await generateText({ system: SYSTEM, user: prompt, temperature: 0.5, maxTokens: 900 })
    return NextResponse.json({ action, result: text.trim() })

  } else { // brief
    // Generate/improve deskripsi post untuk menarik pelamar berkualitas
    const prompt = `Seorang mahasiswa membuat posting di NEXA Arena untuk mencari tim kompetisi.

Detail yang sudah diisi:
- Judul: ${title}
- Nama kompetisi: ${post.competition_name ?? '(belum diisi)'}
- Tipe: ${compType}
- Skill yang dicari: ${skillsNeeded || '(belum ditentukan)'}
- Ukuran tim: ${teamSize}
${eventDate}  ${regDeadline}

Deskripsi saat ini: ${description || '(belum ada)'}

Tulis deskripsi posting yang MENARIK, INFORMATIF, dan membuat pelamar kompeten mau bergabung.
Sertakan: apa yang dicari, kenapa kompetisi ini menarik, ekspektasi komitmen, apa yang akan didapat anggota.
Maksimal 200 kata. Bahasa natural, bukan kaku. Langsung bisa dipakai.`

    const { text } = await generateText({ system: SYSTEM, user: prompt, temperature: 0.6, maxTokens: 500 })
    return NextResponse.json({ action, result: text.trim() })
  }
}
