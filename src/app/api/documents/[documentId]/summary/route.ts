import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { geminiGenerate } from '@/lib/gemini'
import { hasProAccess } from '@/lib/plans'
import type { Profile } from '@/types'

export async function POST(_: Request, { params }: { params: { documentId: string } }) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await service.from('profiles').select('plan, seat_owner_id').eq('id', user.id).single()
  if (!hasProAccess(profile as Pick<Profile, 'plan' | 'seat_owner_id'> | null)) {
    return NextResponse.json({ error: 'Ringkasan otomatis khusus Pro.' }, { status: 403 })
  }

  const { data: doc } = await service
    .from('documents')
    .select('id, user_id, title, extracted_text, summary')
    .eq('id', params.documentId)
    .single()

  if (!doc || doc.user_id !== user.id) return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 })
  if (doc.summary) return NextResponse.json({ summary: doc.summary })
  if (!doc.extracted_text) return NextResponse.json({ error: 'Teks dokumen belum tersedia.' }, { status: 422 })

  const summary = await geminiGenerate(
    `Buat ringkasan komprehensif dokumen ini dalam Bahasa Indonesia. Format output: 1) Poin-poin utama (bullet), 2) Konsep kunci dan definisinya, 3) Hal yang perlu diingat untuk ujian. Maksimal 500 kata.\n\nJudul: ${doc.title}\n\n${doc.extracted_text}`
  )

  await service.from('documents').update({ summary }).eq('id', doc.id)
  return NextResponse.json({ summary })
}
