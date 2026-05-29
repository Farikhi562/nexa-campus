import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { hasProAccess } from '@/lib/plans'
import type { Profile } from '@/types'

export async function POST(request: Request, { params }: { params: { documentId: string } }) {
  const supabase = await createClient()
  const service = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { teamId, revoke } = await request.json().catch(() => ({ teamId: '' }))
  if (!teamId) return NextResponse.json({ error: 'teamId wajib diisi.' }, { status: 400 })

  const { data: profile } = await service.from('profiles').select('plan, seat_owner_id').eq('id', user.id).single()
  if (!hasProAccess(profile as Pick<Profile, 'plan' | 'seat_owner_id'> | null)) {
    return NextResponse.json({ error: 'Share dokumen ke tim khusus Pro.' }, { status: 403 })
  }

  const { data: doc } = await service.from('documents').select('id, user_id').eq('id', params.documentId).single()
  if (!doc || doc.user_id !== user.id) return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 })

  if (revoke) {
    await service.from('team_documents').delete().eq('team_id', teamId).eq('document_id', doc.id).eq('shared_by', user.id)
    return NextResponse.json({ success: true })
  }

  const { error } = await service.from('team_documents').upsert({
    team_id: teamId,
    document_id: doc.id,
    shared_by: user.id,
  }, { onConflict: 'team_id,document_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
