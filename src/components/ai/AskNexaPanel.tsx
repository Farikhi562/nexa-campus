'use client'

import { useMemo, useRef, useState, useEffect } from 'react'
import { Bot, Send, Sparkles, User2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import type { AcademicDeadline } from '@/types'

type AskNexaPanelProps = {
  deadlines?: AcademicDeadline[]
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  status?: 'success' | 'locked' | 'error'
}

type AskNexaResponse = {
  answer?: string
  provider?: string
  model?: string
  status?: 'success' | 'locked' | 'error'
  error?: string
}

const suggestions = [
  'Ringkas deadline minggu ini.',
  'Tugas mana yang harus aku kerjakan dulu?',
  'Bantu bikin rencana belajar 3 hari ke depan.',
]

const GREETING: ChatMessage = {
  id: 'greeting',
  role: 'assistant',
  content:
    'Hai! Aku NEXA Assistant 👋 Aku bisa bantu menyusun prioritas deadline, meringkas tugas, atau bikin rencana belajar. Mau mulai dari mana?',
  status: 'success',
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function AskNexaPanel({ deadlines = [] }: AskNexaPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [provider, setProvider] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const deadlineContext = useMemo(() => {
    return deadlines.slice(0, 30).map((deadline) => ({
      title: deadline.title,
      course: deadline.course_name,
      type: deadline.type,
      source: deadline.source,
      due_date: deadline.deadline_date,
      due_time: deadline.deadline_time,
      priority: deadline.priority,
      status: deadline.status,
      reminder_enabled: deadline.reminder_enabled,
    }))
  }, [deadlines])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const finalText = (text ?? input).trim()
    if (!finalText || loading) return

    const userMsg: ChatMessage = { id: uid(), role: 'user', content: finalText }
    const history = messages
      .filter((m) => m.id !== 'greeting')
      .map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ask-nexa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: finalText,
          deadlines: deadlineContext,
          history,
        }),
      })

      const data = (await response.json().catch(() => null)) as AskNexaResponse | null

      if (!response.ok || !data || (data.error && !data.answer)) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: 'assistant',
            content: data?.error || 'NEXA Assistant sedang tidak bisa menjawab. Coba lagi sebentar.',
            status: 'error',
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
          content: data.answer ?? '',
          status: data.status ?? 'success',
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: 'assistant', content: 'Koneksi bermasalah. Coba lagi ya.', status: 'error' },
      ])
    } finally {
      setLoading(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const showSuggestions = messages.filter((m) => m.id !== 'greeting').length === 0

  return (
    <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/40">
      <CardContent className="flex h-[28rem] flex-col p-0 sm:h-[32rem]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black leading-tight text-slate-950">NEXA Assistant</h2>
              <p className="text-xs text-slate-500">Chatbot produktivitas akademik</p>
            </div>
          </div>
          <Badge tone={provider && provider !== 'none' ? 'brand' : 'info'}>
            {provider && provider !== 'none' ? 'AI aktif' : 'Siap membantu'}
          </Badge>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
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
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  m.role === 'user'
                    ? 'bg-teal-600 text-white'
                    : m.status === 'error'
                      ? 'border border-red-200 bg-red-50 text-red-700'
                      : 'border border-slate-200 bg-white text-slate-700'
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
              <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300" />
              </div>
            </div>
          )}

          {showSuggestions && !loading && (
            <div className="flex flex-wrap gap-2 pt-1">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-teal-200 hover:text-teal-700"
                >
                  <Sparkles className="h-3.5 w-3.5 text-teal-500" />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-slate-100 p-3">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              maxLength={1000}
              rows={1}
              placeholder="Tulis pesan ke NEXA Assistant..."
              className="focus-ring max-h-32 min-h-11 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              className="inline-flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-teal-600 text-white transition hover:bg-teal-700 disabled:opacity-40"
              aria-label="Kirim pesan"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 px-1 text-[11px] leading-4 text-slate-400">
            NEXA Assistant hanya membaca deadline yang kamu input sendiri. Keputusan akhir tetap di kamu — selalu cek info resmi kampus.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
