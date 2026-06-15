'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Send, User2, Calendar, ListChecks, Brain, Target, Sparkles } from 'lucide-react'
import type { AcademicDeadline } from '@/types'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: 'success' | 'locked' | 'error'
}

type Mode = {
  id: string
  label: string
  icon: typeof Brain
  framing: string
}

// Mode = "tool" canggih. Framing disisipkan ke pesan agar AI fokus pada tugas tertentu.
const MODES: Mode[] = [
  {
    id: 'planner',
    label: 'Rencana Belajar',
    icon: Calendar,
    framing:
      'Bertindak sebagai study planner. Susun rencana belajar harian yang realistis dari deadline yang ada, bagi per hari, sebutkan estimasi durasi, dan tandai mana yang paling mendesak.',
  },
  {
    id: 'prioritize',
    label: 'Prioritaskan',
    icon: Target,
    framing:
      'Analisa semua deadline lalu urutkan berdasarkan urgensi & dampak. Jelaskan singkat alasan urutannya (deadline terdekat, bobot, status).',
  },
  {
    id: 'workload',
    label: 'Analisa Beban',
    icon: Brain,
    framing:
      'Analisa beban tugas minggu ini: hari tersibuk, total tugas, risiko menumpuk, dan saran agar tidak overload. Beri ringkas dan actionable.',
  },
  {
    id: 'breakdown',
    label: 'Pecah Tugas',
    icon: ListChecks,
    framing:
      'Pecah tugas/deadline yang aku sebut menjadi langkah-langkah kecil yang bisa dicicil, lengkap dengan urutan pengerjaan.',
  },
]

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function NexaAssistantCommand({
  deadlines = [],
  userName,
  campus,
}: {
  deadlines?: AcademicDeadline[]
  userName?: string | null
  campus?: string | null
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content: `Hai${userName ? ' ' + userName : ''}! Aku NEXA Assistant versi Command 🚀\nAku sudah membaca ${deadlines.length} deadline aktif kamu. Pilih mode di bawah, atau langsung tanya apa saja.`,
      status: 'success',
    },
  ])
  const [input, setInput] = useState('')
  const [activeMode, setActiveMode] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const deadlineContext = useMemo(
    () =>
      deadlines.slice(0, 40).map((d) => ({
        title: d.title,
        course: d.course_name,
        type: d.type,
        source: d.source,
        due_date: d.deadline_date,
        due_time: d.deadline_time,
        priority: d.priority,
        status: d.status,
      })),
    [deadlines]
  )

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(rawText?: string, modeFraming?: string) {
    const text = (rawText ?? input).trim()
    if (!text || loading) return

    const displayText = text
    const sendText = modeFraming ? `[Mode: ${modeFraming}]\n\n${text}` : text

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: displayText }
    const history = messages
      .filter((m) => m.id !== 'greeting')
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ask-nexa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: sendText,
          deadlines: deadlineContext,
          history,
          userContext: { name: userName, campus, plan: 'command' },
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data || (data.error && !data.answer)) {
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: 'assistant', content: data?.error || 'Lagi tidak bisa menjawab, coba lagi ya.', status: 'error' },
        ])
        return
      }
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: data.answer ?? '', status: data.status ?? 'success' },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: 'Koneksi bermasalah. Coba lagi.', status: 'error' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function runMode(mode: Mode) {
    setActiveMode(mode.id)
    const defaultPrompt =
      mode.id === 'breakdown'
        ? 'Pecah deadline paling dekat jadi langkah kecil.'
        : 'Jalankan untuk deadline aktif aku.'
    send(defaultPrompt, mode.framing)
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
      {/* Chat */}
      <div className="flex h-[30rem] flex-col rounded-2xl border border-slate-200 bg-white sm:h-[34rem]">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full ${
                  m.role === 'user' ? 'bg-slate-200 text-slate-700' : 'bg-teal-600 text-white'
                }`}
              >
                {m.role === 'user' ? <User2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  m.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : m.status === 'error'
                      ? 'border border-red-200 bg-red-50 text-red-700'
                      : 'border border-slate-200 bg-slate-50 text-slate-700'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2.5">
              <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-teal-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-100 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(undefined, activeMode ? MODES.find((mm) => mm.id === activeMode)?.framing : undefined)
                }
              }}
              maxLength={1000}
              rows={1}
              placeholder="Tanya apa saja, atau pilih mode di kanan..."
              className="focus-ring max-h-32 min-h-11 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => send(undefined, activeMode ? MODES.find((mm) => mm.id === activeMode)?.framing : undefined)}
              disabled={loading || !input.trim()}
              className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:opacity-40"
              aria-label="Kirim"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mode panel */}
      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-black uppercase tracking-wide text-teal-700">
            <Sparkles className="h-3.5 w-3.5" /> Mode Canggih
          </p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {MODES.map((mode) => {
              const Icon = mode.icon
              const active = activeMode === mode.id
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => runMode(mode)}
                  disabled={loading}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition disabled:opacity-50 ${
                    active
                      ? 'border-teal-300 bg-teal-50 text-teal-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-teal-200'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-none text-teal-600" />
                  <span className="truncate">{mode.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-black text-slate-700">Konteks aktif</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {deadlines.length} deadline dibaca otomatis{campus ? ` · ${campus}` : ''}. NEXA Assistant memakai
            ini untuk jawaban yang lebih personal.
          </p>
        </div>
      </div>
    </div>
  )
}
