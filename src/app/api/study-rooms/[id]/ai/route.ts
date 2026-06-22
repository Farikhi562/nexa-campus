import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText, aiConfigured } from '@/lib/ai/llm'
import { checkRateLimit, rateLimitMessage } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 45

type Params = { params: Promise<{ id: string }> }

type Msg = { content: string | null; message_type: string; sender?: { full_name: string | null } | null; created_at: string }

/** Format pesan sebagai konteks untuk AI — hanya teks, bukan file/gambar. */
function buildChatContext(messages: Msg[], limit = 80): string {
  return messages
    .filter((m) => m.message_type === 'text' && m.content?.trim())
    .slice(-limit)
    .map((m) => {
      const name = m.sender?.full_name ?? 'Anggota'
      return `${name}: ${(m.content ?? '').trim()}`
    })
    .join('\n')
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  // Verifikasi membership
  const { data: member } = await supabase
    .from('study_room_members')
    .select('role')
    .eq('room_id', id).eq('user_id', user.id).maybeSingle()
  if (!member) return NextResponse.json({ error: 'Kamu bukan anggota room ini.' }, { status: 403 })

  if (!aiConfigured()) return NextResponse.json({ error: 'AI belum aktif di server.' }, { status: 503 })

  const rl = await checkRateLimit(supabase, 'study-room-ai', 15, 3600)
  if (!rl.allowed) return NextResponse.json({ error: rateLimitMessage(rl.retryAfterSeconds) }, { status: 429 })

  let body: { action?: string; question?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const action = body.action
  if (!['summarize', 'ask', 'plan'].includes(action ?? '')) {
    return NextResponse.json({ error: 'action harus "summarize", "ask", atau "plan".' }, { status: 400 })
  }

  // Ambil data konteks: workspace + pesan terakhir
  const [workspaceRes, msgRes, roomRes] = await Promise.all([
    supabase.from('study_room_workspaces').select('group_goal, pinned_note, material_link, next_session_at, checklist').eq('room_id', id).maybeSingle(),
    supabase.from('study_room_messages').select('content, message_type, created_at, sender_id').eq('room_id', id).eq('deleted_at', null).order('created_at', { ascending: false }).limit(100),
    supabase.from('study_rooms').select('name, subject').eq('id', id).maybeSingle(),
  ])

  const ws = workspaceRes.data as { group_goal: string | null; pinned_note: string | null; material_link: string | null; next_session_at: string | null; checklist: unknown } | null
  const room = roomRes.data as { name: string | null; subject: string | null } | null

  // Enrich messages dengan nama sender
  const msgs = (msgRes.data ?? []) as Array<Msg & { sender_id: string }>
  const senderIds = Array.from(new Set(msgs.map((m) => m.sender_id)))
  const profileMap: Record<string, string> = {}
  if (senderIds.length > 0) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', senderIds)
    for (const p of (profiles ?? []) as Array<{ id: string; full_name: string | null }>) {
      profileMap[p.id] = p.full_name ?? 'Anggota'
    }
  }
  const enrichedMsgs: Msg[] = msgs.map((m) => ({ ...m, sender: { full_name: profileMap[m.sender_id] ?? 'Anggota' } }))
  const chatContext = buildChatContext(enrichedMsgs)

  const roomName = room?.name ?? 'Study Room'
  const subject = room?.subject ?? ''
  const goal = ws?.group_goal ?? ''
  const note = ws?.pinned_note ?? ''
  const materialLink = ws?.material_link ?? ''
  const nextSession = ws?.next_session_at ?? ''

  const SYSTEM = `Kamu AI tutor cerdas untuk Study Room mahasiswa Indonesia. 
Berikan jawaban yang langsung berguna, konkret, dan actionable. 
Gunakan Bahasa Indonesia yang natural dan ramah.
Jangan bertele-tele — langsung ke poin.`

  let prompt = ''
  let maxTokens = 800

  if (action === 'summarize') {
    if (!chatContext) return NextResponse.json({ error: 'Belum ada pesan teks di room ini untuk dirangkum.' }, { status: 400 })
    prompt = `Study Room: ${roomName}${subject ? ` (${subject})` : ''}
${goal ? `Target belajar: ${goal}` : ''}

Rangkum diskusi di bawah ini menjadi:
1. **Poin-poin penting yang dibahas** (bullet, ringkas)
2. **Hal yang belum selesai / butuh follow-up**
3. **Action items** (siapa harus melakukan apa)

Diskusi:
${chatContext}

Format ringkas, maksimal 300 kata. Fokus ke hal yang actionable.`
    maxTokens = 900
  } else if (action === 'ask') {
    const question = typeof body.question === 'string' ? body.question.trim().slice(0, 500) : ''
    if (!question) return NextResponse.json({ error: 'Pertanyaan tidak boleh kosong.' }, { status: 400 })
    prompt = `Kamu tutor untuk Study Room "${roomName}"${subject ? ` — mata kuliah ${subject}` : ''}.
${goal ? `Target belajar grup: ${goal}` : ''}
${note ? `Catatan dari anggota: ${note}` : ''}
${materialLink ? `Link materi: ${materialLink}` : ''}

Konteks diskusi terakhir (untuk referensi):
${chatContext ? chatContext.slice(-2000) : '(belum ada diskusi)'}

Pertanyaan dari anggota: ${question}

Jawab dengan jelas dan detail. Kalau butuh contoh, berikan. Kalau ada kaitannya dengan diskusi di atas, sebutkan.`
    maxTokens = 1000
  } else { // plan
    prompt = `Buat rencana belajar konkret untuk Study Room "${roomName}"${subject ? ` — ${subject}` : ''}.

Target/tujuan: ${goal || '(belum diisi, buat asumsi yang masuk akal untuk mahasiswa)'}
${nextSession ? `Sesi berikutnya: ${nextSession}` : ''}
${materialLink ? `Materi: ${materialLink}` : ''}
${note ? `Catatan: ${note}` : ''}

Diskusi terbaru (konteks topik yang sedang dibahas):
${chatContext ? chatContext.slice(-1500) : '(belum ada diskusi)'}

Buat rencana belajar 1-2 minggu yang berisi:
1. **Topik per sesi** (estimasi waktu per topik)  
2. **Pembagian tugas** (siapa bisa handle topik apa berdasarkan diskusi)
3. **Deadline internal** (kapan tiap topik harus selesai)
4. **Checklist persiapan sesi berikutnya**

Format rapi dengan heading, bullet point. Actionable dan realistis untuk mahasiswa.`
    maxTokens = 1100
  }

  const { text } = await generateText({ system: SYSTEM, user: prompt, temperature: 0.5, maxTokens })

  return NextResponse.json({ result: text.trim(), action })
}
