import { NextRequest, NextResponse } from 'next/server'
import { askNexa } from '@/lib/ai/ask-nexa'
import { parseDeadlineFromText } from '@/lib/ai/deadline-parser'
import { createClient } from '@/lib/supabase/server'
import { consumeFeatureUsage, getUserPlanAccess } from '@/lib/billing/server'
import type { ChatTurn, GeminiDeadlineContext } from '@/lib/ai/gemini'

type CommandAction =
  | 'mission_briefing'
  | 'risk_scan'
  | 'battle_plan'
  | 'deadline_executor'
  | 'reminder_architect'
  | 'arena_coach'
  | 'notification_copilot'
  | 'free_chat'

type CommandBody = {
  action?: unknown
  message?: unknown
  question?: unknown
  profile?: unknown
  deadlines?: unknown
  history?: unknown
}

const VALID_ACTIONS: CommandAction[] = [
  'mission_briefing',
  'risk_scan',
  'battle_plan',
  'deadline_executor',
  'reminder_architect',
  'arena_coach',
  'notification_copilot',
  'free_chat',
]

const ACTION_LABELS: Record<CommandAction, string> = {
  mission_briefing: 'Command Briefing',
  risk_scan: 'Deadline Risk Scan',
  battle_plan: 'Study Battle Plan',
  deadline_executor: 'Deadline Executor',
  reminder_architect: 'Reminder Architect',
  arena_coach: 'NEXA Arena Coach',
  notification_copilot: 'Notification Copilot',
  free_chat: 'Command Chat',
}

function isCommandAction(value: unknown): value is CommandAction {
  return typeof value === 'string' && VALID_ACTIONS.includes(value as CommandAction)
}

function sanitizeDeadlines(value: unknown): GeminiDeadlineContext[] {
  if (!Array.isArray(value)) return []

  return value.slice(0, 80).map((item) => {
    const source = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
    return {
      title: typeof source.title === 'string' ? source.title : null,
      course: typeof source.course_name === 'string'
        ? source.course_name
        : typeof source.course === 'string'
          ? source.course
          : null,
      type: typeof source.type === 'string' ? source.type : null,
      source: typeof source.source === 'string' ? source.source : null,
      due_date: typeof source.deadline_date === 'string'
        ? source.deadline_date
        : typeof source.due_date === 'string'
          ? source.due_date
          : null,
      due_time: typeof source.deadline_time === 'string'
        ? source.deadline_time
        : typeof source.due_time === 'string'
          ? source.due_time
          : null,
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
      const row = typeof item === 'object' && item !== null ? item as Record<string, unknown> : {}
      const role = row.role === 'assistant' ? 'assistant' : 'user'
      const content = typeof row.content === 'string' ? row.content.slice(0, 1200) : ''
      return { role, content } as ChatTurn
    })
    .filter((item) => item.content.length > 0)
}

function sanitizeProfile(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return {}
  const source = value as Record<string, unknown>
  return {
    full_name: typeof source.full_name === 'string' ? source.full_name : null,
    email: typeof source.email === 'string' ? source.email : null,
    nexa_id: typeof source.nexa_id === 'string' ? source.nexa_id : null,
    plan: 'command',
  }
}

function prettyDate(date?: string | null, time?: string | null) {
  if (!date) return 'tanggal belum kebaca'
  return `${date}${time ? ` jam ${time}` : ''}`
}

function buildCommandQuestion(params: {
  action: CommandAction
  message: string
  deadlines: GeminiDeadlineContext[]
}) {
  const actionGuide: Record<CommandAction, string> = {
    mission_briefing:
      'Buat briefing ala command center: situasi sekarang, 3 prioritas utama, deadline terdekat, risiko, quick wins, dan langkah 24 jam ke depan.',
    risk_scan:
      'Lakukan risk scan: beri risk score 0-100, sebutkan deadline paling bahaya, alasan risikonya, mitigation plan, dan urutan penyelamatan.',
    battle_plan:
      'Buat battle plan 3-7 hari: bagi tugas per hari, estimasi sesi fokus, urutan pengerjaan, buffer, dan checkpoint selesai.',
    deadline_executor:
      'Kalau ini bukan perintah input deadline yang lengkap, bantu user memperjelas title, course, date, time, priority, dan reminder.',
    reminder_architect:
      'Rancang reminder premium Command: H-7, H-3, H-1, hari-H, jam custom, channel in-app/Telegram/Gmail, dan wording singkat.',
    arena_coach:
      'Buat strategi NEXA Arena: role tim, target badge, leaderboard tactics, weekly sprint, dan cara menang kompetisi tanpa ngaco.',
    notification_copilot:
      'Buat template notifikasi yang bikin user balik ke web app: in-app, Telegram, Gmail subject/body, tone singkat dan action-oriented.',
    free_chat:
      'Jawab sebagai NEXA Command Assistant: taktis, konkret, bisa dieksekusi, dan tidak terlalu panjang.',
  }

  return [
    'MODE: NEXA COMMAND ASSISTANT, khusus plan Command.',
    `MODULE: ${ACTION_LABELS[params.action]}`,
    '',
    'Gaya output: bahasa Indonesia santai-profesional, bullet/actionable, prioritas jelas, jangan klaim sudah menyimpan data kecuali API bilang deadline_created.',
    'Berpikir seperti academic ops assistant: prioritization, risk, schedule, reminders, notification, execution.',
    '',
    `Instruksi module: ${actionGuide[params.action]}`,
    '',
    `Pesan user: ${params.message}`,
    '',
    `Jumlah deadline yang dikirim: ${params.deadlines.length}`,
  ].join('\n')
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Login dulu buat pakai NEXA Command Assistant.' }, { status: 401 })
  }

  let body: CommandBody
  try {
    body = await request.json() as CommandBody
  } catch {
    return NextResponse.json({ error: 'Request tidak valid.' }, { status: 400 })
  }

  const action = isCommandAction(body.action) ? body.action : 'free_chat'
  const messageSource = typeof body.message === 'string' ? body.message : body.question
  const message = typeof messageSource === 'string' ? messageSource.trim() : ''

  if (!message) {
    return NextResponse.json({ error: 'Tulis instruksi dulu.' }, { status: 400 })
  }

  if (message.length > 1800) {
    return NextResponse.json({ error: 'Instruksi kepanjangan. Maksimal 1800 karakter dulu, biar AI nggak mimisan digital.' }, { status: 400 })
  }

  const access = await getUserPlanAccess({ supabase, user: { id: user.id, email: user.email } })
  if (!access || access.plan !== 'command') {
    return NextResponse.json({
      answer:
        'NEXA Command Assistant cuma buat plan Command. Radar/Pulse tetap dapat assistant basic, tapi mode overpower ini dikunci. Ya, kapitalisme SaaS mengetuk pintu, ANJJJ 😭',
      status: 'locked',
      required_plan: 'command',
      action,
    }, { status: 402 })
  }

  const actionUsage = await consumeFeatureUsage({ userId: user.id, featureKey: 'nexa_assistant_actions' })
  if (!actionUsage.allowed) {
    return NextResponse.json({
      answer: actionUsage.message,
      status: actionUsage.status === 'locked' ? 'locked' : 'error',
      action,
      usage: actionUsage,
    }, { status: actionUsage.status === 'locked' ? 402 : 429 })
  }

  const deadlines = sanitizeDeadlines(body.deadlines)
  const history = sanitizeHistory(body.history)
  const profile = {
    ...sanitizeProfile(body.profile),
    plan: access.plan,
    plan_status: 'active',
  }

  if (action === 'deadline_executor') {
    const parsed = await parseDeadlineFromText(message)

    if (parsed.isDeadlineIntent) {
      const deadline = parsed.deadline
      if (!deadline || deadline.missing_fields.length > 0) {
        return NextResponse.json({
          answer:
            `Gue nangkep ini perintah bikin deadline, tapi field-nya belum lengkap: ${deadline?.missing_fields.join(', ') || 'detail deadline'}.\n\nFormat aman: “tambahin deadline tugas kalkulus Jumat jam 20.00 prioritas tinggi”. Jangan bikin AI nebak kalender kayak dukun kos-kosan, ANJJJ 😭`,
          status: 'error',
          action,
          parsed_deadline: deadline ?? null,
          provider: parsed.provider,
          model: parsed.model,
        }, { status: 400 })
      }

      const quickAddUsage = await consumeFeatureUsage({ userId: user.id, featureKey: 'ai_quick_add' })
      if (!quickAddUsage.allowed) {
        return NextResponse.json({
          answer: quickAddUsage.message,
          status: quickAddUsage.status === 'locked' ? 'locked' : 'error',
          action,
          usage: quickAddUsage,
        }, { status: quickAddUsage.status === 'locked' ? 402 : 429 })
      }

      const insertPayload = {
        user_id: user.id,
        title: deadline.title,
        course_name: deadline.course_name,
        type: deadline.type || 'assignment',
        source: 'nexa_command_assistant',
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
        console.error('[NEXA Command Assistant] deadline insert failed', error)
        return NextResponse.json({
          answer:
            `Command berhasil parse deadline, tapi gagal simpan ke database. Kemungkinan schema academic_deadlines beda.\n\nYang kebaca:\n- Judul: ${deadline.title}\n- Matkul: ${deadline.course_name || '-'}\n- Waktu: ${prettyDate(deadline.deadline_date, deadline.deadline_time)}\n- Prioritas: ${deadline.priority || 'medium'}\n\nDatabase lu lagi cosplay jadi labirin, cek nama kolomnya dulu.`,
          status: 'error',
          action,
          provider: parsed.provider,
          model: parsed.model,
        }, { status: 500 })
      }

      return NextResponse.json({
        answer:
          `Command executed ✅\n\nDeadline berhasil disimpan:\n- Judul: ${created.title}\n- Matkul: ${created.course_name || '-'}\n- Waktu: ${prettyDate(created.deadline_date, created.deadline_time)}\n- Prioritas: ${created.priority || 'medium'}\n\nReminder aktif. Kalau mau reminder custom H-7/H-3/H-1/jam custom, pakai module Reminder Architect.`,
        status: 'success',
        action: 'deadline_created',
        deadline: created,
        provider: parsed.provider,
        model: parsed.model,
      })
    }
  }

  try {
    const result = await askNexa({
      question: buildCommandQuestion({ action, message, deadlines }),
      deadlines,
      userContext: profile,
      history,
    })

    return NextResponse.json({
      answer: result.answer,
      provider: result.provider,
      model: result.model,
      status: result.status,
      action,
    })
  } catch (error) {
    console.error('[NEXA Command Assistant] command failed', error)
    return NextResponse.json({
      answer: 'NEXA Command lagi gagal jawab. Cek konfigurasi AI provider atau server log. Bahkan robot premium pun bisa keseleo kalau env-nya kosong.',
      status: 'error',
      action,
    }, { status: 500 })
  }
}
