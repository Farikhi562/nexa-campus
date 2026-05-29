import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PLAN_LIMITS } from '@/types'
import type { Plan } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { documentId, studyRoomId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'documentId wajib diisi.' }, { status: 400 })
    }

    // Check plan limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const plan   = (profile?.plan ?? 'free') as Plan
    const limits = PLAN_LIMITS[plan]

    if (limits.maxSessions !== null) {
      const { count } = await supabase
        .from('exam_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed')

      if ((count ?? 0) >= limits.maxSessions) {
        return NextResponse.json({
          error: `Paket ${plan} hanya memperbolehkan ${limits.maxSessions} sesi ujian. Upgrade untuk sesi tak terbatas.`,
        }, { status: 403 })
      }
    }

    // Verify document belongs to user and is completed
    const { data: doc } = await supabase
      .from('documents')
      .select('id, status, question_count')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (!doc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan.' }, { status: 404 })
    }

    if (doc.status !== 'completed') {
      return NextResponse.json({ error: 'Dokumen belum selesai diproses.' }, { status: 422 })
    }

    if (!doc.question_count || doc.question_count === 0) {
      return NextResponse.json({ error: 'Dokumen tidak memiliki soal.' }, { status: 422 })
    }

    if (studyRoomId) {
      const { data: room } = await supabase
        .from('room_participants')
        .select('room_id, study_rooms(document_id, is_active, expires_at)')
        .eq('room_id', studyRoomId)
        .eq('user_id', user.id)
        .single()

      const roomInfo = Array.isArray(room?.study_rooms) ? room?.study_rooms[0] : room?.study_rooms
      if (!room || !roomInfo || !roomInfo.is_active || new Date(roomInfo.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Study room tidak valid atau kamu belum bergabung.' }, { status: 403 })
      }

      if (roomInfo.document_id && roomInfo.document_id !== documentId) {
        return NextResponse.json({ error: 'Dokumen tidak sesuai dengan study room.' }, { status: 403 })
      }
    }

    // Create exam session
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .insert({
        user_id:         user.id,
        document_id:     documentId,
        study_room_id:   studyRoomId ?? null,
        total_questions: doc.question_count,
        status:          'in_progress',
      })
      .select()
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: sessionError?.message ?? 'Gagal membuat sesi.' }, { status: 500 })
    }

    return NextResponse.json({ data: { sessionId: session.id } })
  } catch (err) {
    console.error('[Sessions] Error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
