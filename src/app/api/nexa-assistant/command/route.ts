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

function todayJakarta() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  return new Date(Date.UTC(year, month - 1, day))
}

function daysUntil(date?: string | null) {
  if (!date) return null
  const target = new Date(`${date}T00:00:00Z`)
  if (Number.isNaN(target.getTime())) return null
  const today = todayJakarta()
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function priorityWeight(priority?: string | null) {
  if (priority === 'high') return 18
  if (priority === 'medium') return 10
  if (priority === 'low') return 4
  return 8
}

function riskScore(deadline: GeminiDeadlineContext) {
  const days = daysUntil(deadline.due_date)
  let base = 35
  if (days === null) base = 45
  else if (days < 0) base = 100
  else if (days === 0) base = 95
  else if (days === 1) base = 88
  else if (days <= 3) base = 75
  else if (days <= 7) base = 55
  else if (days <= 14) base = 38
  else base = 22

  return Math.min(100, Math.max(0, base + priorityWeight(deadline.priority)))
}

function activeDeadlines(deadlines: GeminiDeadlineContext[]) {
  return deadlines
    .filter((deadline) => deadline.status !== 'done' && deadline.status !== 'completed')
    .map((deadline) => ({ ...deadline, risk: riskScore(deadline), days: daysUntil(deadline.due_date) }))
    .sort((a, b) => b.risk - a.risk)
}

function deadlineLine(deadline: GeminiDeadlineContext & { risk?: number; days?: number | null }, index: number) {
  const daysText = deadline.days === null || deadline.days === undefined
    ? 'tanpa tanggal jelas'
    : deadline.days < 0
      ? `telat ${Math.abs(deadline.days)} hari`
      : deadline.days === 0
        ? 'hari ini'
        : `${deadline.days} hari lagi`

  return `${index + 1}. ${deadline.title || 'Deadline tanpa judul'} (${deadline.course || '-'})\n   Risk: ${deadline.risk ?? riskScore(deadline)}/100 | ${prettyDate(deadline.due_date, deadline.due_time)} | ${daysText} | priority: ${deadline.priority || 'medium'}`
}

function buildFallbackAnswer(params: {
  action: CommandAction
  message: string
  deadlines: GeminiDeadlineContext[]
  warning?: string | null
}) {
  const ranked = activeDeadlines(params.deadlines)
  const top = ranked.slice(0, 5)
  const urgent = ranked.filter((deadline) => (deadline.days ?? 99) <= 3)
  const warningText = params.warning ? `\n\nCatatan sistem: ${params.warning}` : ''

  if (params.action === 'deadline_executor') {
    return [
      'Deadline Executor aktif, tapi pesan ini belum cukup kebaca sebagai perintah simpan deadline.',
      '',
      'Format paling aman:',
      '“tambahin deadline tugas kalkulus besok jam 8 malam prioritas tinggi”',
      '',
      'Kalau mau custom reminder Command:',
      '“tambahin deadline laporan AI Jumat jam 20.00, ingetin H-3 H-1 dan hari-H jam 09.00”',
      '',
      'AI boleh pinter, tapi jangan disuruh nebak tanggal kayak dukun kalender kos-kosan.',
      warningText,
    ].join('\n')
  }

  if (ranked.length === 0) {
    return [
      'Command Center aktif, tapi gue belum nerima deadline yang bisa discan.',
      '',
      'Yang harus lu lakukan:',
      '1. Masukin deadline dulu dari Quick Add atau Deadline Executor.',
      '2. Tulis minimal judul + tanggal.',
      '3. Balik lagi ke Risk Scan / Battle Plan.',
      '',
      'Tanpa deadline, risk scan cuma jadi ramalan zodiak akademik. Lucu, tapi nggak guna. ANJJJ 😭',
      warningText,
    ].join('\n')
  }

  if (params.action === 'risk_scan') {
    return [
      'Deadline Risk Scan selesai. Ini hasil mode fallback lokal, jadi tetap jalan walau AI provider lagi ngambek.',
      '',
      `Total aktif: ${ranked.length}`,
      `Area bahaya 0-3 hari: ${urgent.length}`,
      `Risk tertinggi: ${top[0]?.risk ?? 0}/100`,
      '',
      'Top risiko:',
      ...top.map((deadline, index) => deadlineLine(deadline, index)),
      '',
      'Cara nyelametin:',
      '1. Kerjain risk tertinggi dulu, bukan yang paling “mood”. Mood itu penipu bersertifikat.',
      '2. Pecah tiap deadline jadi 3 task: riset/bahan, eksekusi, final check.',
      '3. Untuk deadline <= 3 hari, target minimal versi submit-able dulu. Bagus belakangan, selamat dulu.',
      '4. Set reminder H-1 + hari-H. Kalau Command, tambah H-3 buat yang risk >= 75.',
      warningText,
    ].join('\n')
  }

  if (params.action === 'battle_plan') {
    return [
      'Study Battle Plan 7 hari:',
      '',
      ...top.slice(0, 3).map((deadline, index) => (
        `D-${index + 1}: ${deadline.title || 'Deadline'}\n- Fokus: ${deadline.course || 'general'}\n- Target: bikin progres minimal 60%, jangan nunggu “inspirasi”. Inspirasi itu biasanya datang setelah panik.`
      )),
      '',
      'Template harian:',
      '- Sesi 1: 45 menit ngerjain bagian paling susah.',
      '- Break: 10 menit, jangan berubah jadi 2 jam TikTok, manusia lemah.',
      '- Sesi 2: 45 menit rapihin output.',
      '- Malam: 15 menit cek deadline besok.',
      warningText,
    ].join('\n')
  }

  if (params.action === 'reminder_architect') {
    return [
      'Reminder Architecture Command:',
      '',
      ...top.slice(0, 5).map((deadline, index) => (
        `${index + 1}. ${deadline.title || 'Deadline'}\n- H-7: mulai cicil bahan\n- H-3: wajib 50% jadi\n- H-1: finalisasi + cek format\n- Hari-H pagi: submit/siapkan file\n- Channel: in-app + Telegram${deadline.risk >= 75 ? ' + Gmail' : ''}`
      )),
      '',
      'Rule brutal: deadline high risk harus punya minimal 3 reminder. Satu reminder doang itu bukan sistem, itu harapan.',
      warningText,
    ].join('\n')
  }

  if (params.action === 'notification_copilot') {
    return [
      'Notification copy siap:',
      '',
      'In-app:',
      `Deadline paling rawan: ${top[0]?.title || 'deadline kamu'}. Buka NEXA sekarang dan selesaikan step pertama sebelum panik jadi fitur permanen.`,
      '',
      'Telegram:',
      `🚨 NEXA Alert: ${top[0]?.title || 'Deadline'} masuk zona risiko. Target hari ini: bikin progres minimal 30%. Buka dashboard NEXA buat battle plan.`,
      '',
      'Gmail subject:',
      `[NEXA Command] Deadline risk scan: ${urgent.length} tugas butuh perhatian`,
      '',
      'Gmail body:',
      'Ada deadline yang mulai rawan. Buka NEXA Campus untuk lihat prioritas, reminder, dan rencana eksekusi. Jangan tunggu chaos jadi budaya organisasi pribadi.',
      warningText,
    ].join('\n')
  }

  if (params.action === 'arena_coach') {
    return [
      'NEXA Arena Coach:',
      '',
      'Strategi menang:',
      '1. Bentuk tim kecil 3-5 orang. Kebanyakan orang = rapat banyak, kerja sedikit. Klasik.',
      '2. Bagi role: lead, executor, researcher, designer, QA.',
      '3. Kejar badge mingguan dulu sebelum leaderboard besar.',
      '4. Pakai Study Room buat koordinasi dan call Command.',
      '5. Set target: 1 deliverable kecil tiap 24 jam.',
      '',
      'Badge target: konsistensi dulu, mythos belakangan. Jangan baru daftar langsung cosplay legenda.',
      warningText,
    ].join('\n')
  }

  return [
    'Command Center aktif ✅',
    '',
    'Lu bisa pakai:',
    '- “Scan semua deadline gue” buat risk score.',
    '- “Bikin battle plan 7 hari” buat jadwal eksekusi.',
    '- “Rancang reminder custom” buat H-7/H-3/H-1/hari-H.',
    '- “Tambahin deadline tugas kalkulus besok jam 8 malam” buat save deadline.',
    '',
    `Deadline aktif kebaca: ${ranked.length}`,
    ranked.length ? `Paling bahaya: ${top[0]?.title || '-'} (${top[0]?.risk ?? 0}/100)` : '',
    warningText,
  ].filter(Boolean).join('\n')
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

async function safeConsumeFeatureUsage(params: { userId: string; featureKey: 'nexa_assistant_actions' | 'ai_quick_add' }) {
  try {
    const usage = await consumeFeatureUsage(params)

    // Kalau migration usage belum jalan, jangan bikin Command Assistant mati total.
    // Biarkan Command jalan, tapi kirim warning buat admin.
    if (usage.status === 'error') {
      return { allowed: true, warning: usage.message, usage }
    }

    return { allowed: usage.allowed, warning: null as string | null, usage }
  } catch (error) {
    console.error('[NEXA Command Assistant] usage check crashed', error)
    return {
      allowed: true,
      warning: 'Usage limit gagal dicek, jadi sementara dilewati biar Command Assistant tetap hidup.',
      usage: null,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
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
          'NEXA Command Assistant cuma buat plan Command. Kalau akun lo owner tapi masih kekunci, cek COMMAND_LIFETIME_EMAILS / NEXA_OWNER_EMAILS di Vercel. Kapitalisme SaaS jangan sampai nge-lock foundernya sendiri, ANJJJ 😭',
        status: 'locked',
        required_plan: 'command',
        action,
      }, { status: 402 })
    }

    const deadlines = sanitizeDeadlines(body.deadlines)
    const history = sanitizeHistory(body.history)
    const profile = {
      ...sanitizeProfile(body.profile),
      plan: access.plan,
      plan_status: 'active',
    }

    const actionUsage = await safeConsumeFeatureUsage({ userId: user.id, featureKey: 'nexa_assistant_actions' })
    if (!actionUsage.allowed) {
      return NextResponse.json({
        answer: actionUsage.usage?.message || 'Command usage tidak diizinkan.',
        status: actionUsage.usage?.status === 'locked' ? 'locked' : 'error',
        action,
        usage: actionUsage.usage,
      }, { status: actionUsage.usage?.status === 'locked' ? 402 : 429 })
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
          })
        }

        const quickAddUsage = await safeConsumeFeatureUsage({ userId: user.id, featureKey: 'ai_quick_add' })
        if (!quickAddUsage.allowed) {
          return NextResponse.json({
            answer: quickAddUsage.usage?.message || 'AI Quick Add tidak diizinkan.',
            status: quickAddUsage.usage?.status === 'locked' ? 'locked' : 'error',
            action,
            usage: quickAddUsage.usage,
          }, { status: quickAddUsage.usage?.status === 'locked' ? 402 : 429 })
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
              `Command berhasil parse deadline, tapi gagal simpan ke database. Kemungkinan schema academic_deadlines beda.\n\nYang kebaca:\n- Judul: ${deadline.title}\n- Matkul: ${deadline.course_name || '-'}\n- Waktu: ${prettyDate(deadline.deadline_date, deadline.deadline_time)}\n- Prioritas: ${deadline.priority || 'medium'}\n\nDatabase lu lagi cosplay jadi labirin. Cek kolom academic_deadlines: user_id, title, course_name, deadline_date, deadline_time.`,
            status: 'error',
            action,
            provider: parsed.provider,
            model: parsed.model,
            db_error: error.message,
          })
        }

        return NextResponse.json({
          answer:
            `Command executed ✅\n\nDeadline berhasil disimpan:\n- Judul: ${created.title}\n- Matkul: ${created.course_name || '-'}\n- Waktu: ${prettyDate(created.deadline_date, created.deadline_time)}\n- Prioritas: ${created.priority || 'medium'}\n\nReminder aktif. Kalau mau reminder custom H-7/H-3/H-1/jam custom, pakai module Reminder Architect.`,
          status: 'success',
          action: 'deadline_created',
          deadline: created,
          provider: parsed.provider,
          model: parsed.model,
          warning: quickAddUsage.warning || actionUsage.warning,
        })
      }
    }

    const fallback = buildFallbackAnswer({
      action,
      message,
      deadlines,
      warning: actionUsage.warning,
    })

    try {
      const result = await askNexa({
        question: buildCommandQuestion({ action, message, deadlines }),
        deadlines,
        userContext: profile,
        history,
      })

      // Kalau AI belum dikonfigurasi, jangan balikin jawaban "belum aktif" doang.
      // Command harus tetap terasa hidup pakai fallback lokal.
      if (result.status === 'locked' || result.provider === 'none') {
        return NextResponse.json({
          answer: fallback,
          provider: 'local-fallback',
          model: 'nexa-command-fallback-v1',
          status: 'success',
          action,
          warning: actionUsage.warning || 'AI provider belum aktif, fallback lokal dipakai.',
        })
      }

      return NextResponse.json({
        answer: result.answer || fallback,
        provider: result.provider,
        model: result.model,
        status: result.status,
        action,
        warning: actionUsage.warning,
      })
    } catch (error) {
      console.error('[NEXA Command Assistant] AI command failed, fallback used', error)
      return NextResponse.json({
        answer: fallback,
        provider: 'local-fallback',
        model: 'nexa-command-fallback-v1',
        status: 'success',
        action,
        warning: actionUsage.warning || 'AI provider error, fallback lokal dipakai.',
      })
    }
  } catch (error) {
    console.error('[NEXA Command Assistant] fatal route error', error)
    return NextResponse.json({
      answer:
        'Command Assistant error fatal di server. Ini bukan salah prompt lu. Cek Vercel Runtime Logs bagian /api/nexa-assistant/command. Minimal sekarang error-nya kebaca, bukan cuma “TypeScript minta tumbal”.',
      status: 'error',
      action: 'free_chat',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
