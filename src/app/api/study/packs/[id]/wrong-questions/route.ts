import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 10

type RouteContext = { params: Promise<{ id: string }> }

// ─── POST /api/study/packs/[id]/wrong-questions ──────────────────────────────
// Simpan indeks soal yang dijawab salah di attempt terakhir.
// Dipakai oleh fitur Diagnose untuk highlight topik yang perlu diulang.

export async function POST(request: NextRequest, ctx: RouteContext) {
  const { id: packId } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: { wrong_indices?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  if (!Array.isArray(body.wrong_indices)) {
    return NextResponse.json({ error: 'wrong_indices harus berupa array.' }, { status: 400 })
  }

  const indices = (body.wrong_indices as unknown[])
    .filter((v): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0)
    .slice(0, 200) // safety cap

  // Validasi pack milik user
  const { data: pack, error: fetchErr } = await supabase
    .from('study_packs')
    .select('id, quiz')
    .eq('id', packId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchErr) {
    console.error('[api/wrong-questions]', fetchErr.message)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
  if (!pack) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })

  // Cross-check indeks tidak melebihi jumlah soal
  const quizLen = Array.isArray(pack.quiz) ? pack.quiz.length : 0
  const valid = indices.filter((i) => i < quizLen)

  const { error: updateErr } = await supabase
    .from('study_packs')
    .update({ quiz_last_wrong: valid })
    .eq('id', packId)
    .eq('user_id', user.id)

  if (updateErr) {
    console.error('[api/wrong-questions update]', updateErr.message)
    return NextResponse.json({ error: 'Gagal menyimpan data soal salah.' }, { status: 500 })
  }

  return NextResponse.json({ saved: valid.length, wrong_indices: valid })
}
