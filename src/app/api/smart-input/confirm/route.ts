import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseDeadlinePayload } from '@/lib/deadline-validation'

export const runtime = 'nodejs'
export const maxDuration = 20

type ConfirmBody = {
  candidates?: unknown
  logId?: unknown
  inputType?: unknown
}

type CandidateInput = {
  title?: unknown
  course_name?: unknown
  type?: unknown
  source?: unknown
  deadline_date?: unknown
  deadline_time?: unknown
  campus?: unknown
  room?: unknown
  notes?: unknown
  priority?: unknown
  reminder_enabled?: unknown
}

const INPUT_TYPES = new Set(['manual', 'nlp', 'image', 'file'])

/**
 * Endpoint tunggal untuk menyimpan hasil Smart Input — dipakai oleh SEMUA mode
 * (Manual, Bahasa Natural, Upload Gambar, Upload File) setelah user mereview
 * Smart Preview. TIDAK di-gate plan: input Manual harus tetap bisa dipakai
 * semua pengguna (Radar termasuk).
 *
 * Tiap kandidat divalidasi lewat `parseDeadlinePayload` yang SAMA dengan
 * endpoint /api/deadlines biasa — jadi aturan & data konsisten.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: ConfirmBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const candidatesRaw = Array.isArray(body.candidates) ? (body.candidates as CandidateInput[]) : []
  if (candidatesRaw.length === 0) {
    return NextResponse.json({ error: 'Tidak ada data untuk disimpan.' }, { status: 400 })
  }
  if (candidatesRaw.length > 10) {
    return NextResponse.json({ error: 'Maksimal 10 item sekaligus.' }, { status: 400 })
  }

  const logId = typeof body.logId === 'string' ? body.logId : null
  const inputType = typeof body.inputType === 'string' && INPUT_TYPES.has(body.inputType) ? body.inputType : 'manual'

  const inserted: string[] = []
  const errors: Array<{ index: number; error: string }> = []
  const finalCandidates: unknown[] = []

  for (let i = 0; i < candidatesRaw.length; i++) {
    const c = candidatesRaw[i]
    const parsed = parseDeadlinePayload({
      title: c.title,
      course_name: c.course_name,
      type: c.type,
      source: c.source ?? 'lainnya',
      deadline_date: c.deadline_date,
      deadline_time: c.deadline_time || '23:59',
      campus: c.campus,
      room: c.room,
      notes: c.notes,
      priority: c.priority ?? 'normal',
      status: 'pending',
      reminder_enabled: c.reminder_enabled !== false, // default true kecuali user matikan
    })

    if (parsed.error) {
      errors.push({ index: i, error: parsed.error })
      finalCandidates.push({ ...c, _error: parsed.error })
      continue
    }

    const { data, error } = await supabase
      .from('academic_deadlines')
      .insert({ ...parsed.data, user_id: user.id })
      .select('id')
      .single()

    if (error) {
      errors.push({ index: i, error: error.message })
      finalCandidates.push({ ...c, _error: error.message })
      continue
    }

    inserted.push(data.id as string)
    finalCandidates.push({ ...parsed.data, id: data.id })

    // Poin leaderboard, selaras dengan /api/deadlines — diabaikan kalau gagal.
    await supabase.rpc('award_points', { p_kind: 'create_deadline', p_ref: data.id }).then(undefined, () => null)
  }

  // Catat hasil akhir ke smart_input_logs.
  if (logId) {
    await supabase
      .from('smart_input_logs')
      .update({
        status: inserted.length > 0 ? 'confirmed' : 'discarded',
        parsed_result: finalCandidates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', logId)
      .eq('user_id', user.id)
      .then(() => null, () => null)
  } else {
    // Input manual (tanpa log sebelumnya) — buat 1 log ringkas untuk audit.
    await supabase
      .from('smart_input_logs')
      .insert({
        user_id: user.id,
        input_type: inputType,
        raw_input: null,
        parsed_result: finalCandidates,
        status: inserted.length > 0 ? 'confirmed' : 'error',
      })
      .then(() => null, () => null)
  }

  if (inserted.length === 0) {
    return NextResponse.json({ inserted, errors }, { status: 422 })
  }

  return NextResponse.json({ inserted, errors }, { status: 201 })
}
