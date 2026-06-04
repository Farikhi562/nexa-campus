import { NextRequest, NextResponse } from 'next/server'
import { askNexa } from '@/lib/ai/ask-nexa'
import type { GeminiDeadlineContext } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/server'

const MAX_QUESTION_LENGTH = 1000
const SAFE_ERROR = 'Tanya NEXA sedang tidak bisa menjawab. Coba lagi nanti.'

type AskNexaBody = {
  question?: unknown
  message?: unknown
  deadlines?: unknown
  userContext?: unknown
}

function sanitizeDeadlines(value: unknown): GeminiDeadlineContext[] {
  if (!Array.isArray(value)) return []

  return value.slice(0, 30).map((item) => {
    const source = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
    return {
      title: typeof source.title === 'string' ? source.title : null,
      course: typeof source.course === 'string' ? source.course : typeof source.course_name === 'string' ? source.course_name : null,
      type: typeof source.type === 'string' ? source.type : null,
      source: typeof source.source === 'string' ? source.source : null,
      due_date: typeof source.due_date === 'string' ? source.due_date : typeof source.deadline_date === 'string' ? source.deadline_date : null,
      due_time: typeof source.due_time === 'string' ? source.due_time : typeof source.deadline_time === 'string' ? source.deadline_time : null,
      priority: typeof source.priority === 'string' ? source.priority : null,
      status: typeof source.status === 'string' ? source.status : null,
      reminder_enabled: typeof source.reminder_enabled === 'boolean' ? source.reminder_enabled : null,
    }
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kamu perlu login dulu untuk pakai Tanya NEXA.' }, { status: 401 })
  }

  let body: AskNexaBody
  try {
    body = (await request.json()) as AskNexaBody
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const questionSource = typeof body.question === 'string' ? body.question : body.message
  const question = typeof questionSource === 'string' ? questionSource.trim() : ''

  if (!question) {
    return NextResponse.json({ error: 'Tulis pertanyaan dulu ya.' }, { status: 400 })
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: 'Pertanyaannya kepanjangan. Coba ringkas maksimal 1000 karakter.' }, { status: 400 })
  }

  const userContext = typeof body.userContext === 'object' && body.userContext !== null
    ? body.userContext as Record<string, unknown>
    : undefined

  try {
    const result = await askNexa({
      question,
      deadlines: sanitizeDeadlines(body.deadlines),
      userContext,
    })

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: SAFE_ERROR }, { status: 500 })
  }
}
