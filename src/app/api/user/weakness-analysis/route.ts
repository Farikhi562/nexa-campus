import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { geminiGenerate, parseGeminiJson } from '@/lib/gemini'
import { hasProAccess } from '@/lib/plans'
import type { Profile } from '@/types'
import { checkRateLimit } from '@/lib/server-security'

export const dynamic = 'force-dynamic'

type WeaknessAnalysis = {
  weakTopics: string[]
  patterns: string[]
  recommendations: string[]
  analyzedExamCount: number
  updatedAt: string
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Login dulu.' }, { status: 401 })

    const limit = checkRateLimit(`weakness-analysis:${user.id}`, 10, 60 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json(
        { error: 'Terlalu banyak request analisis. Coba lagi nanti.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
      )
    }

    const service = createServiceClient()
    const { data: profile } = await service.from('profiles').select('plan, seat_owner_id, weakness_analysis').eq('id', user.id).single()
    if (!hasProAccess(profile as Pick<Profile, 'plan' | 'seat_owner_id'> | null)) {
      return NextResponse.json({ error: 'Analisis kelemahan khusus Pro.' }, { status: 403 })
    }

    const { data: sessions } = await service
      .from('exam_sessions')
      .select('id, score, document_id, completed_at')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

    const completedCount = sessions?.length ?? 0
    if (completedCount < 3) {
      return NextResponse.json({ error: 'Minimal 3 exam selesai untuk analisis AI.' }, { status: 422 })
    }

    const cached = (profile?.weakness_analysis || null) as Partial<WeaknessAnalysis> | null
    if (cached?.analyzedExamCount && completedCount - cached.analyzedExamCount < 5) {
      return NextResponse.json({ data: cached })
    }

    const sessionIds = ((sessions || []) as Array<{ id: string }>).map((session: { id: string }) => session.id)
    const { data: answers } = await service
      .from('session_answers')
      .select('is_correct, questions:question_id(question_text, explanation, document_id)')
      .in('session_id', sessionIds)
      .eq('is_correct', false)
      .limit(80)

    const wrongItems = ((answers || []) as Array<{
      questions?: { document_id?: string; question_text?: string; explanation?: string | null } | null
    }>).map((answer) => ({
      documentId: answer.questions?.document_id,
      question: answer.questions?.question_text,
      explanation: answer.questions?.explanation,
    })).filter((item: { question?: string }) => item.question)

    const raw = await geminiGenerate(
      `Berdasarkan data jawaban mahasiswa berikut, identifikasi: 1) Topik/konsep yang paling lemah, 2) Pola kesalahan umum, 3) Rekomendasi spesifik cara belajar. Jawab dalam format JSON: {weakTopics: [], patterns: [], recommendations: []}\n\nData salah:\n${JSON.stringify(wrongItems).slice(0, 18000)}`,
      'Kamu adalah mentor belajar NEXA yang menganalisis pola kelemahan akademik mahasiswa secara etis.'
    )
    const parsed = parseGeminiJson<Partial<WeaknessAnalysis>>(raw, {})
    const analysis: WeaknessAnalysis = {
      weakTopics: Array.isArray(parsed.weakTopics) ? parsed.weakTopics.slice(0, 6).map(String) : [],
      patterns: Array.isArray(parsed.patterns) ? parsed.patterns.slice(0, 6).map(String) : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 6).map(String) : [],
      analyzedExamCount: completedCount,
      updatedAt: new Date().toISOString(),
    }

    await service.from('profiles').update({ weakness_analysis: analysis }).eq('id', user.id)
    return NextResponse.json({ data: analysis })
  } catch (error) {
    console.error('[Weakness Analysis] Error:', error)
    return NextResponse.json({ error: 'Gagal membuat analisis kelemahan.' }, { status: 500 })
  }
}
