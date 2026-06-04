'use client'

import { useMemo, useState } from 'react'
import { Bot, LockKeyhole, Send, Sparkles } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import type { AcademicDeadline } from '@/types'

type AskNexaPanelProps = {
  deadlines?: AcademicDeadline[]
}

type AskNexaResponse = {
  answer?: string
  provider?: 'gemini' | 'none'
  model?: string
  status?: 'success' | 'locked'
  error?: string
}

const examples = [
  'Ringkas deadline minggu ini.',
  'Bantu urutkan tugas berdasarkan urgensi.',
  'Apa yang harus saya kerjakan hari ini?',
]

export default function AskNexaPanel({ deadlines = [] }: AskNexaPanelProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<'success' | 'locked' | null>(null)
  const [provider, setProvider] = useState<'gemini' | 'none' | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  async function submit(event?: React.FormEvent<HTMLFormElement>, example?: string) {
    event?.preventDefault()
    const finalQuestion = (example ?? question).trim()

    if (!finalQuestion) {
      setError('Tulis pertanyaan dulu ya.')
      return
    }

    setLoading(true)
    setError('')
    setAnswer('')
    setStatus(null)
    setProvider(null)

    const response = await fetch('/api/ask-nexa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: finalQuestion,
        deadlines: deadlineContext,
      }),
    })

    const data = (await response.json().catch(() => null)) as AskNexaResponse | null
    setLoading(false)

    if (!response.ok || !data) {
      setError(data?.error || 'Tanya NEXA sedang tidak bisa menjawab. Coba lagi nanti.')
      return
    }

    if (data.error) {
      setError(data.error)
      return
    }

    setQuestion(finalQuestion)
    setAnswer(data.answer ?? '')
    setProvider(data.provider ?? null)
    setStatus(data.status ?? null)
  }

  return (
    <Card className="border-teal-100 bg-gradient-to-br from-white to-teal-50/50">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-black text-slate-950">Tanya NEXA</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Tanyakan prioritas deadline, ringkasan tugas minggu ini, atau minta bantuan menyusun rencana belajar.
            </p>
          </div>
          <Badge tone={provider === 'gemini' ? 'brand' : 'info'}>
            {provider === 'gemini' ? 'Powered by Gemini' : 'AI Preview Locked'}
          </Badge>
        </div>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="Contoh: Deadline mana yang harus aku kerjakan dulu?"
            className="focus-ring w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 placeholder:text-slate-400"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs leading-5 text-slate-500">
              {loading ? 'NEXA sedang mikir...' : 'NEXA hanya membaca deadline yang kamu input sendiri.'}
            </p>
            <Button type="submit" disabled={loading} className="rounded-2xl">
              {loading ? 'Mikir...' : 'Tanya NEXA'}
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => submit(undefined, example)}
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-teal-200 hover:text-teal-700"
            >
              {example}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700">
            {error}
          </div>
        )}

        {answer && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
            <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
              {status === 'locked' ? <LockKeyhole className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              {status === 'locked' ? 'Preview locked' : 'Jawaban Tanya NEXA'}
            </div>
            {answer}
          </div>
        )}

        <p className="mt-4 text-xs leading-5 text-slate-500">
          Tanya NEXA tidak mengambil data dari sistem kampus. Jawaban AI bisa membantu menyusun prioritas, tapi keputusan akhir tetap di pengguna. Selalu cek informasi resmi dari kampus.
        </p>
      </CardContent>
    </Card>
  )
}
