import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('universitas').eq('id', user.id).single()
  const own = supabase
    .from('exam_schedules')
    .select('*')
    .eq('user_id', user.id)
    .order('exam_date', { ascending: true })

  const suggested = profile?.universitas
    ? supabase
        .from('exam_schedules')
        .select('*')
        .eq('is_public', true)
        .eq('university', profile.universitas)
        .neq('user_id', user.id)
        .order('exam_date', { ascending: true })
        .limit(10)
    : Promise.resolve({ data: [] })

  const [ownRes, suggestedRes] = await Promise.all([own, suggested])
  if (ownRes.error) return NextResponse.json({ error: ownRes.error.message }, { status: 500 })
  return NextResponse.json({ data: ownRes.data ?? [], suggested: suggestedRes.data ?? [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const subject = String(body.subject || '').trim()
  const type = String(body.type || 'UTS').trim()
  const examDate = String(body.exam_date || '').trim()
  const room = String(body.room || '').trim()
  const isPublic = Boolean(body.is_public)
  const notes = String(body.notes || '').trim()

  if (!subject || !examDate) {
    return NextResponse.json({ error: 'subject dan exam_date wajib diisi.' }, { status: 400 })
  }

  if (subject.length > 160 || room.length > 80 || notes.length > 500) {
    return NextResponse.json({ error: 'Input jadwal terlalu panjang.' }, { status: 400 })
  }

  if (!['UTS', 'UAS', 'Quiz'].includes(type)) {
    return NextResponse.json({ error: 'Tipe ujian tidak valid.' }, { status: 400 })
  }

  const parsedDate = new Date(examDate)
  if (isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: 'Tanggal ujian tidak valid.' }, { status: 400 })
  }

  const { data: profile } = await supabase.from('profiles').select('universitas').eq('id', user.id).single()
  const db = createServiceClient()
  const { count } = await db
    .from('exam_schedules')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if ((count ?? 0) >= 100) {
    return NextResponse.json({ error: 'Batas jadwal ujian tercapai.' }, { status: 429 })
  }

  const { data, error } = await db
    .from('exam_schedules')
    .insert({
      user_id: user.id,
      subject,
      type,
      exam_date: examDate,
      room: room || null,
      notes: notes || null,
      university: profile?.universitas ?? null,
      is_public: Boolean(isPublic && profile?.universitas),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const examTime = new Date(examDate).getTime()
  const reminders = [7, 1].map((days) => ({
    user_id: user.id,
    title: `${type} ${subject}`,
    message: `${type} ${subject} tinggal ${days} hari lagi.`,
    type: 'reminder',
    created_at: new Date(examTime - days * 24 * 60 * 60 * 1000).toISOString(),
  }))
  await db.from('notifications').insert(reminders)

  return NextResponse.json({ data })
}
