import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isValidEvidenceUrl } from '@/lib/verification/url-validation'

const EVIDENCE_TYPES = new Set(['github', 'portfolio', 'certificate', 'file', 'screenshot', 'document', 'other'])

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  // ?user_id= opsional — kalau diisi, ambil evidence user lain (untuk
  // ditampilkan ringkas di public profile, sesuai policy public-read).
  const targetUserId = request.nextUrl.searchParams.get('user_id') || user.id

  const { data, error } = await supabase
    .from('user_skill_evidence')
    .select('*')
    .eq('user_id', targetUserId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const skillName = typeof body.skill_name === 'string' ? body.skill_name.trim().slice(0, 100) : ''
  const evidenceType = EVIDENCE_TYPES.has(String(body.evidence_type)) ? String(body.evidence_type) : null
  const evidenceUrl = typeof body.evidence_url === 'string' ? body.evidence_url.trim() : ''
  const fileUrl = typeof body.file_url === 'string' ? body.file_url.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim().slice(0, 500) : null

  if (!skillName) return NextResponse.json({ error: 'Nama skill wajib diisi.' }, { status: 400 })
  if (!evidenceType) return NextResponse.json({ error: 'Jenis evidence tidak valid.' }, { status: 400 })
  if (!evidenceUrl && !fileUrl) {
    return NextResponse.json({ error: 'Isi link evidence atau upload file dulu.' }, { status: 400 })
  }
  if (evidenceUrl && !isValidEvidenceUrl(evidenceUrl)) {
    return NextResponse.json({ error: 'Link evidence tidak valid (harus diawali http:// atau https://).' }, { status: 400 })
  }
  if (fileUrl && !isValidEvidenceUrl(fileUrl)) {
    return NextResponse.json({ error: 'Link file tidak valid.' }, { status: 400 })
  }

  // Batasi jumlah evidence per user supaya tidak bisa di-spam.
  const { count } = await supabase
    .from('user_skill_evidence')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= 20) {
    return NextResponse.json({ error: 'Maksimal 20 evidence. Hapus yang lama dulu kalau mau tambah.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('user_skill_evidence')
    .insert({
      user_id: user.id,
      skill_name: skillName,
      evidence_type: evidenceType,
      evidence_url: evidenceUrl || null,
      file_url: fileUrl || null,
      description,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Login required.' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id wajib diisi.' }, { status: 400 })

  // .eq('user_id', user.id) sebagai defense-in-depth selain RLS — user hanya
  // bisa hapus evidence miliknya sendiri.
  const { error } = await supabase
    .from('user_skill_evidence')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
