import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Kamu perlu login dulu.' }, { status: 401 })

  let body: { score?: unknown }
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 }) }

  const rawScore = Number(body.score)
  if (!Number.isInteger(rawScore) || rawScore < 0) {
    return NextResponse.json({ error: 'Skor tidak valid.' }, { status: 400 })
  }

  const { data: pack, error: fetchError } = await supabase
    .from('study_packs')
    .select('quiz, quiz_best_score, quiz_attempts')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!pack) return NextResponse.json({ error: 'Materi tidak ditemukan.' }, { status: 404 })

  // Validasi skor tidak melebihi jumlah soal asli (mencegah client kirim skor
  // mengarang/lebih besar dari kuis sebenarnya).
  const quizLength = Array.isArray(pack.quiz) ? pack.quiz.length : 0
  const score = Math.min(rawScore, quizLength)

  const currentBest = (pack as { quiz_best_score: number | null }).quiz_best_score
  const newBest = currentBest === null ? score : Math.max(currentBest, score)
  const attempts = ((pack as { quiz_attempts: number }).quiz_attempts ?? 0) + 1

  const { data, error } = await supabase
    .from('study_packs')
    .update({ quiz_best_score: newBest, quiz_attempts: attempts, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('quiz_best_score, quiz_attempts')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { ...data, score, total: quizLength } })
}
