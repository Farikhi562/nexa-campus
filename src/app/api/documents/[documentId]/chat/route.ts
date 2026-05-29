import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { geminiGenerate } from '@/lib/gemini'
import { hasProAccess } from '@/lib/plans'
import type { Profile } from '@/types'

const SYSTEM = 'Kamu adalah asisten belajar mahasiswa Indonesia. Jawab pertanyaan HANYA berdasarkan dokumen berikut. Gunakan bahasa Indonesia yang santai tapi informatif. Jika pertanyaan di luar konteks dokumen, tolak dengan sopan.'

export async function GET(_: Request, { params }: { params: { documentId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('document_chats')
    .select('*')
    .eq('document_id', params.documentId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(request: Request, { params }: { params: { documentId: string } }) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { message } = await request.json().catch(() => ({ message: '' }))
  if (!String(message || '').trim()) return NextResponse.json({ error: 'Pertanyaan wajib diisi.' }, { status: 400 })

  const { data: profile } = await service.from('profiles').select('plan, seat_owner_id').eq('id', user.id).single()
  if (!hasProAccess(profile as Pick<Profile, 'plan' | 'seat_owner_id'> | null)) {
    return NextResponse.json({ error: 'Fitur Chat with PDF khusus Pro.' }, { status: 403 })
  }

  const { data: doc } = await service
    .from('documents')
    .select('id, user_id, title, extracted_text')
    .eq('id', params.documentId)
    .single()

  if (!doc || doc.user_id !== user.id) return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 })
  if (!doc.extracted_text) return NextResponse.json({ error: 'Teks dokumen belum tersedia. Proses ulang PDF dulu.' }, { status: 422 })

  await service.from('document_chats').insert({
    user_id: user.id,
    document_id: doc.id,
    role: 'user',
    message: String(message).trim(),
  })

  const reply = await geminiGenerate(
    `Dokumen: ${doc.title}\n\nISI DOKUMEN:\n${doc.extracted_text}\n\nPERTANYAAN USER:\n${String(message).trim()}`,
    SYSTEM
  )

  const { data: saved } = await service
    .from('document_chats')
    .insert({
      user_id: user.id,
      document_id: doc.id,
      role: 'assistant',
      message: reply,
    })
    .select()
    .single()

  return NextResponse.json({ reply, data: saved })
}
