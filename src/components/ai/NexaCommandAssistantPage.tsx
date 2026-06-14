'use client'

import { useMemo, useRef, useState, useEffect, type KeyboardEvent } from 'react'
import {
  AlertTriangle,
  Bot,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Crown,
  Flame,
  Gauge,
  Mail,
  MessageSquareText,
  RadioTower,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Swords,
  User2,
  WandSparkles,
  Zap,
} from 'lucide-react'

type CommandProfile = {
  full_name?: string | null
  email?: string | null
  avatar_url?: string | null
  nexa_id?: string | null
  plan?: string | null
}

type CommandDeadline = {
  id?: string | number
  title?: string | null
  course_name?: string | null
  type?: string | null
  source?: string | null
  deadline_date?: string | null
  deadline_time?: string | null
  priority?: string | null
  status?: string | null
  reminder_enabled?: boolean | null
  created_at?: string | null
}

type CommandAction =
  | 'mission_briefing'
  | 'risk_scan'
  | 'battle_plan'
  | 'deadline_executor'
  | 'reminder_architect'
  | 'arena_coach'
  | 'notification_copilot'
  | 'free_chat'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: 'success' | 'locked' | 'error'
  action?: CommandAction
}

type CommandResponse = {
  answer?: string
  status?: 'success' | 'locked' | 'error'
  provider?: string
  model?: string
  action?: CommandAction | 'deadline_created'
  deadline?: CommandDeadline | null
  error?: string
}

type Props = {
  profile: CommandProfile
  deadlines: CommandDeadline[]
}

const actionCards: Array<{
  id: CommandAction
  title: string
  desc: string
  prompt: string
  icon: typeof Sparkles
  tone: string
}> = [
  {
    id: 'mission_briefing',
    title: 'Command Briefing',
    desc: 'Ringkas kondisi akademik hari ini, prioritas, dan next move.',
    prompt: 'Buatkan command briefing hari ini dari semua deadline gue. Fokus ke prioritas, risiko, dan langkah 24 jam ke depan.',
    icon: RadioTower,
    tone: 'from-teal-500/25 to-cyan-500/10 border-teal-300/20',
  },
  {
    id: 'risk_scan',
    title: 'Deadline Risk Scan',
    desc: 'Cari deadline yang rawan telat, bentrok, atau butuh dicicil.',
    prompt: 'Scan semua deadline gue. Kasih risk score, mana yang bahaya, dan cara nyelamatinnya.',
    icon: AlertTriangle,
    tone: 'from-amber-500/25 to-red-500/10 border-amber-300/20',
  },
  {
    id: 'battle_plan',
    title: 'Study Battle Plan',
    desc: 'Bikin rencana belajar eksekusi 3-7 hari ke depan.',
    prompt: 'Bikin study battle plan 7 hari dari deadline gue. Bagi per hari, kasih estimasi fokus, dan urutan pengerjaan.',
    icon: Swords,
    tone: 'from-fuchsia-500/25 to-indigo-500/10 border-fuchsia-300/20',
  },
  {
    id: 'deadline_executor',
    title: 'Deadline Executor',
    desc: 'Ketik bebas, AI parse dan simpan deadline kalau datanya lengkap.',
    prompt: 'Tambah deadline: tugas kalkulus besok jam 8 malam prioritas tinggi.',
    icon: WandSparkles,
    tone: 'from-emerald-500/25 to-teal-500/10 border-emerald-300/20',
  },
  {
    id: 'reminder_architect',
    title: 'Reminder Architect',
    desc: 'Rancang reminder H-7, H-3, H-1, hari-H, dan jam custom.',
    prompt: 'Rancang reminder custom buat deadline gue. Pakai H-7, H-3, H-1, hari-H, dan jam yang masuk akal.',
    icon: CalendarClock,
    tone: 'from-blue-500/25 to-sky-500/10 border-blue-300/20',
  },
  {
    id: 'notification_copilot',
    title: 'Notification Copilot',
    desc: 'Bikin teks notif in-app, Telegram, dan Gmail biar user balik ke app.',
    prompt: 'Buatkan template notifikasi in-app, Telegram, dan Gmail untuk deadline gue supaya gue kebuka lagi web app NEXA.',
    icon: Mail,
    tone: 'from-violet-500/25 to-purple-500/10 border-violet-300/20',
  },
  {
    id: 'arena_coach',
    title: 'Arena Coach',
    desc: 'Strategi NEXA Arena, badge, leaderboard tim, dan eksekusi lomba.',
    prompt: 'Bantu gue bikin strategi NEXA Arena: target badge, leaderboard tim, pembagian role, dan cara menang kompetisi.',
    icon: Rocket,
    tone: 'from-orange-500/25 to-yellow-500/10 border-orange-300/20',
  },
]

function uid() {
  return `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

function firstName(profile: CommandProfile) {
  const raw = profile.full_name || profile.email || 'Command User'
  return raw.trim().split(/\s+/)[0] || 'Command User'
}

function formatDate(deadline: CommandDeadline) {
  const date = deadline.deadline_date || 'tanpa tanggal'
  const time = deadline.deadline_time ? ` ${deadline.deadline_time}` : ''
  return `${date}${time}`
}

function getPriorityScore(priority?: string | null) {
  if (priority === 'high') return 3
  if (priority === 'medium') return 2
  if (priority === 'low') return 1
  return 2
}

function daysUntil(date?: string | null) {
  if (!date) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${date}T00:00:00`)
  if (Number.isNaN(target.getTime())) return null
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

function UserAvatar({ profile }: { profile: CommandProfile }) {
  if (profile.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.full_name || 'User'}
        referrerPolicy="no-referrer"
        className="h-10 w-10 rounded-full object-cover ring-2 ring-teal-300/40"
      />
    )
  }

  return (
    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-200 ring-1 ring-white/10">
      <User2 className="h-5 w-5" />
    </div>
  )
}

function StatCard({ icon: Icon, label, value, hint }: { icon: typeof Sparkles; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.05] p-4 shadow-xl shadow-slate-950/10">
      <div className="flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-400/15 text-teal-200">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{label}</div>
          <div className="text-2xl font-black text-white">{value}</div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-400">{hint}</p>
    </div>
  )
}

export default function NexaCommandAssistantPage({ profile, deadlines }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Command Center aktif 👑 Gue bisa bikin briefing, risk scan, battle plan, reminder architecture, notification copy, sampai save deadline dari kalimat bebas. Ini mode Command, bukan chatbot modal “coba istirahat ya”.',
      status: 'success',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<CommandAction>('free_chat')
  const [provider, setProvider] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const name = firstName(profile)

  const insights = useMemo(() => {
    const active = deadlines.filter((d) => d.status !== 'done' && d.status !== 'completed')
    const urgent = active.filter((d) => {
      const diff = daysUntil(d.deadline_date)
      return diff !== null && diff >= 0 && diff <= 3
    })
    const high = active.filter((d) => getPriorityScore(d.priority) >= 3)
    const riskScore = Math.min(100, urgent.length * 22 + high.length * 12 + Math.max(0, active.length - 5) * 4)

    return {
      activeCount: active.length,
      urgentCount: urgent.length,
      highCount: high.length,
      riskScore,
      nextDeadline: active
        .slice()
        .sort((a, b) => String(a.deadline_date || '9999').localeCompare(String(b.deadline_date || '9999')))[0],
    }
  }, [deadlines])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function runCommand(action: CommandAction, customText?: string) {
    const text = (customText ?? input).trim()
    if (!text || loading) return

    setActiveAction(action)
    setMessages((prev) => [...prev, { id: uid(), role: 'user', content: text, action }])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/nexa-assistant/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          message: text,
          profile,
          deadlines,
          history: messages.slice(-10).map((message) => ({ role: message.role, content: message.content })),
        }),
      })

      const data = (await response.json().catch(() => null)) as CommandResponse | null

      if (!response.ok || !data || (data.error && !data.answer)) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content: data?.error || 'Command Assistant lagi gagal eksekusi. TypeScript mungkin sedang minta tumbal.',
            status: 'error',
            action,
          },
        ])
        return
      }

      setProvider(data.provider ?? null)
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: data.answer || 'Command selesai, tapi jawabannya kosong. Ini AI apa printer rusak.',
          status: data.status ?? 'success',
          action,
        },
      ])

      if (data.action === 'deadline_created') {
        window.dispatchEvent(new CustomEvent('nexa:deadline-created', { detail: data.deadline }))
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: 'assistant',
          content: 'Koneksi gagal. Coba lagi bentar, internet kadang memang hobi cosplay jadi batu.',
          status: 'error',
          action,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      runCommand(activeAction, input)
    }
  }

  function copyLastAnswer() {
    const last = messages.slice().reverse().find((message) => message.role === 'assistant')
    if (!last) return
    navigator.clipboard?.writeText(last.content).catch(() => undefined)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.22),transparent_38%),linear-gradient(135deg,rgba(15,23,42,1),rgba(2,6,23,1))] p-5 shadow-2xl shadow-slate-950/50 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-teal-200">
                <Crown className="h-3.5 w-3.5" /> Command only assistant
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
                NEXA Assistant Command Center
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Mode overpower buat user Command: briefing, risk scan, battle plan, deadline executor, custom reminder, Telegram/Gmail copy, dan Arena coach. Akhirnya AI dipakai buat kerja beneran, bukan cuma ditanya “kamu bisa apa”.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.05] p-3">
              <UserAvatar profile={profile} />
              <div>
                <div className="text-sm font-black text-white">{profile.full_name || name}</div>
                <div className="text-xs text-slate-400">{profile.nexa_id || profile.email || 'NEXA Command User'}</div>
              </div>
              <div className="ml-2 rounded-2xl bg-teal-400 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-950">
                Command
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon={ClipboardList} label="Active deadline" value={String(insights.activeCount)} hint="Jumlah deadline yang masih perlu dieksekusi." />
          <StatCard icon={Flame} label="Urgent" value={String(insights.urgentCount)} hint="Deadline 0-3 hari. Area rawan panik akademik." />
          <StatCard icon={Gauge} label="Risk score" value={`${insights.riskScore}%`} hint="Estimasi risiko dari jumlah, prioritas, dan kedekatan deadline." />
          <StatCard icon={Zap} label="Next target" value={insights.nextDeadline?.title ? insights.nextDeadline.title.slice(0, 18) : '-'} hint={insights.nextDeadline ? formatDate(insights.nextDeadline) : 'Belum ada deadline aktif.'} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-black text-white">Command Modules</h2>
                  <p className="text-xs text-slate-400">Klik modul, prompt otomatis jalan.</p>
                </div>
                <ShieldCheck className="h-5 w-5 text-teal-300" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {actionCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => runCommand(card.id, card.prompt)}
                      disabled={loading}
                      className={`group rounded-3xl border bg-gradient-to-br p-4 text-left transition hover:-translate-y-0.5 hover:border-teal-300/40 disabled:cursor-not-allowed disabled:opacity-60 ${card.tone}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/10">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-black text-white">{card.title}</div>
                          <p className="mt-1 text-xs leading-5 text-slate-300">{card.desc}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-[2rem] border border-teal-300/15 bg-teal-300/10 p-4">
              <div className="flex items-center gap-2 text-sm font-black text-teal-100">
                <Sparkles className="h-4 w-4" /> Command abilities
              </div>
              <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-300">
                <div>• Save deadline dari natural language.</div>
                <div>• Susun prioritas berbasis risk score.</div>
                <div>• Rancang reminder custom Command.</div>
                <div>• Generate copy Telegram, Gmail, dan in-app notification.</div>
                <div>• Bikin strategi NEXA Arena dan leaderboard tim.</div>
              </div>
            </div>
          </aside>

          <section className="flex min-h-[42rem] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-slate-950/40">
            <div className="flex flex-col gap-3 border-b border-white/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400 text-slate-950 shadow-lg shadow-teal-950/40">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">Command Chat</h2>
                  <p className="text-xs text-slate-400">{provider ? `Provider: ${provider}` : 'Siap nerima instruksi Command.'}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={copyLastAnswer}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition hover:bg-white/10"
              >
                <CheckCircle2 className="h-4 w-4" /> Copy jawaban terakhir
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((message) => {
                const isUser = message.role === 'user'
                return (
                  <div key={message.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`mt-6 flex h-9 w-9 flex-none items-center justify-center rounded-full ${isUser ? 'bg-slate-700' : 'bg-teal-400 text-slate-950'}`}>
                      {isUser ? <User2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </div>
                    <div className={`max-w-[86%] ${isUser ? 'text-right' : 'text-left'}`}>
                      <div className={`mb-1 px-1 text-[11px] font-black uppercase tracking-[0.14em] ${isUser ? 'text-slate-500' : 'text-teal-300'}`}>
                        {isUser ? name : 'NEXA Command'}
                      </div>
                      <div
                        className={`whitespace-pre-wrap rounded-3xl px-4 py-3 text-sm leading-6 ${
                          isUser
                            ? 'bg-teal-400 text-slate-950'
                            : message.status === 'error'
                              ? 'border border-red-300/25 bg-red-500/10 text-red-100'
                              : message.status === 'locked'
                                ? 'border border-amber-300/25 bg-amber-500/10 text-amber-50'
                                : 'border border-white/10 bg-slate-900/80 text-slate-100'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  </div>
                )
              })}

              {loading && (
                <div className="flex gap-3">
                  <div className="mt-6 flex h-9 w-9 items-center justify-center rounded-full bg-teal-400 text-slate-950">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="mb-1 px-1 text-[11px] font-black uppercase tracking-[0.14em] text-teal-300">NEXA Command</div>
                    <div className="rounded-3xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300">
                      Lagi mikir sambil nyusun strategi. AI juga capek, tapi minimal nggak ngeluh di standup.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {(['free_chat', 'deadline_executor', 'risk_scan', 'battle_plan'] as CommandAction[]).map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => setActiveAction(action)}
                    className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                      activeAction === action ? 'bg-teal-400 text-slate-950' : 'bg-white/10 text-slate-300 hover:bg-white/15'
                    }`}
                  >
                    {action.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={onKeyDown}
                  rows={2}
                  placeholder="Contoh: bikin battle plan UAS 7 hari, atau tambahin deadline tugas AI besok jam 21.00"
                  className="min-h-[3.5rem] flex-1 resize-none rounded-3xl border border-white/10 bg-slate-900/90 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-300/60"
                />
                <button
                  type="button"
                  disabled={loading || !input.trim()}
                  onClick={() => runCommand(activeAction, input)}
                  className="inline-flex h-[3.5rem] w-14 flex-none items-center justify-center rounded-3xl bg-teal-400 text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Kirim ke NEXA Command"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <MessageSquareText className="h-3.5 w-3.5" /> Enter buat kirim, Shift+Enter buat baris baru. Teknologi kecil, tapi hidup manusia terselamatkan.
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}
