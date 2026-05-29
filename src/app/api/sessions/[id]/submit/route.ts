import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { updateLearningProgress } from '@/lib/gamification'
import type { ClientAnswer } from '@/types'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase  = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id
    const { answers, timeTaken } = await request.json() as {
      answers: ClientAnswer[]
      timeTaken: number
    }

    // Verify session ownership
    const { data: session } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (!session) {
      return NextResponse.json({ error: 'Sesi tidak ditemukan.' }, { status: 404 })
    }

    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Sesi sudah selesai.' }, { status: 422 })
    }

    if (!Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({ error: 'Jawaban tidak valid.' }, { status: 400 })
    }

    const submittedIds = new Set(answers.map(a => a.questionId))
    if (submittedIds.size !== answers.length) {
      return NextResponse.json({ error: 'Jawaban mengandung soal duplikat.' }, { status: 400 })
    }

    // Fetch correct answers for the session document only.
    const { data: questions } = await supabase
      .from('questions')
      .select('id, correct_answer')
      .eq('document_id', session.document_id)

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Soal tidak ditemukan.' }, { status: 404 })
    }

    const expectedIds = new Set(questions.map(q => q.id))
    if (
      answers.length !== questions.length ||
      answers.some(a => !expectedIds.has(a.questionId))
    ) {
      return NextResponse.json({ error: 'Payload jawaban tidak sesuai dengan sesi ujian.' }, { status: 400 })
    }

    const correctMap = new Map(questions.map(q => [q.id, q.correct_answer]))

    // Calculate results
    let correctCount = 0
    const answerRows = answers.map(a => {
      const isCorrect = a.selectedAnswer !== null && correctMap.get(a.questionId) === a.selectedAnswer
      if (isCorrect) correctCount++
      return {
        session_id:      sessionId,
        question_id:     a.questionId,
        selected_answer: a.selectedAnswer,
        is_correct:      isCorrect,
      }
    })

    const score = Math.round((correctCount / answers.length) * 100)

    const serviceClient = createServiceClient()

    const { data: lockedSession, error: lockError } = await serviceClient
      .from('exam_sessions')
      .update({
        status:             'completed',
        score,
        correct_count:      correctCount,
        time_taken_seconds: Math.max(0, Math.floor(Number(timeTaken) || 0)),
        completed_at:       new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .eq('status', 'in_progress')
      .select('id')
      .single()

    if (lockError || !lockedSession) {
      return NextResponse.json({ error: 'Sesi sudah selesai atau tidak dapat dikunci.' }, { status: 409 })
    }

    // Insert answers in bulk
    const { error: answerError } = await serviceClient
      .from('session_answers')
      .insert(answerRows)

    if (answerError) {
      await serviceClient
        .from('exam_sessions')
        .update({ status: 'in_progress', score: null, correct_count: 0, completed_at: null })
        .eq('id', sessionId)
      return NextResponse.json({ error: answerError.message }, { status: 500 })
    }

    await updateLearningProgress({
      db: serviceClient,
      userId: user.id,
      documentId: session.document_id,
      sessionId,
      score,
    })

    return NextResponse.json({
      data: {
        score,
        correctCount,
        totalQuestions: answers.length,
        sessionId,
      },
    })
  } catch (err) {
    console.error('[Submit] Error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server.' }, { status: 500 })
  }
}
