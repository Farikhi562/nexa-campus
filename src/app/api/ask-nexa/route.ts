import { NextRequest, NextResponse } from 'next/server'
import { askNexa } from '@/lib/ai/ask-nexa'
import { parseDeadlineFromText } from '@/lib/ai/deadline-parser'
import type { GeminiDeadlineContext, ChatTurn } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/server'
import { consumeFeatureUsage, getUserPlanAccess } from '@/lib/billing/server'
import { BILLING_PLANS } from '@/lib/billing/plans'

const MAX_QUESTION_LENGTH = 1000

type AskNexaBody = {
  question?: unknown
  message?: unknown
  deadlines?: unknown
  userContext?: unknown
  history?: unknown
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

function sanitizeHistory(value: unknown): ChatTurn[] {
  if (!Array.isArray(value)) return []
  return value
    .slice(-12)
    .map((item) => {
      const o = typeof item === 'object' && item !== null ? (item as Record<string, unknown>) : {}
      const role = o.role === 'assistant' ? 'assistant' : 'user'
      const content = typeof o.content === 'string' ? o.content.slice(0, 1000) : ''
      return { role, content } as ChatTurn
    })
    .filter((t) => t.content.length > 0)
}

function prettyDate(date?: string | null, time?: string | null) {
  if (!date) return 'tanggal belum kebaca'
  return `${date}${time ? ` jam ${time}` : ''}`
}

function upgradeLine(plan: 'pulse' | 'command') {
  const target = BILLING_PLANS[plan]
  return `Upgrade ke ${target.name} (${target.priceLabel}/bulan) buat buka fitur ini.`
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Kamu perlu login dulu untuk pakai NEXA Assistant.' }, { status: 401 })
  }

  const chatUsage = await consumeFeatureUsage({ userId: user.id, featureKey: 'nexa_assistant_chat' })
  if (!chatUsage.allowed) {
    return NextResponse.json({
      answer: chatUsage.message,
      status: chatUsage.status === 'locked' ? 'locked' : 'error',
      action: 'usage_limited' as const,
      usage: chatUsage,
    }, { status: chatUsage.status === 'locked' ? 402 : 429 })
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
    return NextResponse.json({ error: 'Tulis pesan dulu ya.' }, { status: 400 })
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return NextResponse.json({ error: 'Pesannya kepanjangan. Coba ringkas maksimal 1000 karakter.' }, { status: 400 })
  }

  const userContext = typeof body.userContext === 'object' && body.userContext !== null
    ? body.userContext as Record<string, unknown>
    : undefined

  const access = await getUserPlanAccess({ supabase, user: { id: user.id, email: user.email } })
  const plan = access?.plan ?? 'radar'

  try {
    const deadlineParse = await parseDeadlineFromText(question)

    if (deadlineParse.isDeadlineIntent) {
      const deadline = deadlineParse.deadline

      if (!deadline || deadline.missing_fields.length > 0) {
        const missing = deadline?.missing_fields.join(', ') || 'detail deadline'
        return NextResponse.json({
          answer:
            `Aku nangkep ini mau input deadline, tapi datanya kurang: ${missing}. Coba tulis kayak: “tambahin deadline tugas kalkulus besok jam 8 malam”. AI bisa pinter, tapi bukan dukun kalender, ANJJJ 😭`,
          provider: deadlineParse.provider,
          model: deadlineParse.model,
          status: 'success' as const,
          action: 'deadline_parse_failed' as const,
        })
      }

      if (plan === 'radar') {
        return NextResponse.json({
          answer:
            `Aku berhasil baca deadlinenya, tapi plan Radar cuma dapat preview AI parse, belum bisa langsung nyimpen deadline. Ini hasil bacanya:\n\nJudul: ${deadline.title}\nMatkul: ${deadline.course_name || '-'}\nWaktu: ${prettyDate(deadline.deadline_date, deadline.deadline_time)}\nPrioritas: ${deadline.priority || 'medium'}\n\n${upgradeLine('pulse')} Ya namanya juga gratis, jangan suruh robot kerja lembur tanpa token, ANJJJ 😭`,
          provider: deadlineParse.provider,
          model: deadlineParse.model,
          status: 'locked' as const,
          action: 'deadline_parse_preview' as const,
          parsed_deadline: deadline,
          required_plan: 'pulse' as const,
        }, { status: 402 })
      }

      const quickAddUsage = await consumeFeatureUsage({ userId: user.id, featureKey: 'ai_quick_add' })
      if (!quickAddUsage.allowed) {
        return NextResponse.json({
          answer:
            `${quickAddUsage.message}\n\nPreview deadline yang kebaca:\nJudul: ${deadline.title}\nMatkul: ${deadline.course_name || '-'}\nWaktu: ${prettyDate(deadline.deadline_date, deadline.deadline_time)}\nPrioritas: ${deadline.priority || 'medium'}`,
          provider: deadlineParse.provider,
          model: deadlineParse.model,
          status: quickAddUsage.status === 'locked' ? 'locked' : 'error',
          action: 'deadline_parse_preview' as const,
          parsed_deadline: deadline,
          usage: quickAddUsage,
        }, { status: quickAddUsage.status === 'locked' ? 402 : 429 })
      }

      const insertPayload = {
        user_id: user.id,
        title: deadline.title,
        course_name: deadline.course_name,
        type: deadline.type || 'assignment',
        source: 'nexa_assistant',
        deadline_date: deadline.deadline_date,
        deadline_time: deadline.deadline_time,
        priority: deadline.priority || 'medium',
        status: 'pending',
        reminder_enabled: true,
      }

      const { data: created, error } = await supabase
        .from('academic_deadlines')
        .insert(insertPayload)
        .select('id,title,course_name,type,deadline_date,deadline_time,priority,status,reminder_enabled,source')
        .single()

      if (error) {
        console.error('[NEXA Assistant] deadline insert failed', error)
        return NextResponse.json({
          answer:
            `Aku berhasil baca deadlinenya, tapi gagal nyimpen ke database. Kemungkinan nama tabel/kolom academic_deadlines di project lo beda. Detail yang kebaca:\n\nJudul: ${deadline.title}\nMatkul: ${deadline.course_name || '-'}\nTanggal: ${prettyDate(deadline.deadline_date, deadline.deadline_time)}\nPrioritas: ${deadline.priority || 'medium'}\n\nCek schema Supabase lo, jangan sampai database-nya cosplay jadi teka-teki silang.`,
          provider: deadlineParse.provider,
          model: deadlineParse.model,
          status: 'error' as const,
          action: 'deadline_parse_failed' as const,
        })
      }

      return NextResponse.json({
        answer:
          `Siap, deadline udah dicatat ✅\n\nJudul: ${created.title}\nMatkul: ${created.course_name || '-'}\nWaktu: ${prettyDate(created.deadline_date, created.deadline_time)}\nPrioritas: ${created.priority || 'medium'}\n\nPlan aktif: ${BILLING_PLANS[plan].name}. Reminder juga aktif, jadi nanti jangan pura-pura lupa, dosa digital itu.`,
        provider: deadlineParse.provider,
        model: deadlineParse.model,
        status: 'success' as const,
        action: 'deadline_created' as const,
        deadline: created,
        usage: quickAddUsage,
      })
    }

    const result = await askNexa({
      question,
      deadlines: sanitizeDeadlines(body.deadlines),
      userContext,
      history: sanitizeHistory(body.history),
    })

    return NextResponse.json({ ...result, action: 'chat' as const, usage: chatUsage, plan })
  } catch (err) {
    console.error('[NEXA Assistant] failed', err)
    return NextResponse.json({
      answer:
        'NEXA Assistant belum bisa menjawab sekarang. Kamu tetap bisa mencatat dan mengelola deadline secara manual.',
      provider: 'none' as const,
      model: process.env.AI_TEXT_MODEL || 'auto',
      status: 'error' as const,
    })
  }
}
