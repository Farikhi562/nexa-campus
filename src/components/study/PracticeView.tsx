'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, Send, X, Check } from 'lucide-react'
import type { StudyQuizQuestion } from '@/lib/study/types'

export default function PracticeView({ packId }: { packId: string }) {
  const [questions, setQuestions] = useState<StudyQuizQuestion[]>([])
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    setAnswers({})
    setSubmitted(false)
    const res = await fetch(`/api/study/packs/${packId}/practice`, { method: 'POST' })
    const json = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(json.error || 'Gagal generate soal baru.'); return }
    setQuestions(json.questions ?? [])
  }

  const score = questions.reduce((s, q, i) => s + (answers[i] === q.correctIndex ? 1 : 0), 0)

  if (questions.length === 0) {
    return (
      <div className="space-y-2 text-center">
        <p className="text-xs text-slate-500">Generate soal latihan baru yang berbeda dari quiz awal.</p>
        <button onClick={generate} disabled={loading}
          className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {loading ? 'Generating...' : 'Generate Soal Baru'}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500">{questions.length} soal latihan baru</p>
        <button onClick={generate} disabled={loading}
          className="inline-flex items-center gap-1.5 text-xs font-black text-violet-600 hover:underline">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Ganti soal
        </button>
      </div>

      {questions.map((q, qi) => (
        <div key={qi} className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="mb-3 text-sm font-black text-slate-950">{qi + 1}. {q.question}</p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi
              let style = 'border-slate-200 bg-white hover:border-violet-200'
              if (submitted) {
                if (oi === q.correctIndex) style = 'border-emerald-300 bg-emerald-50'
                else if (selected) style = 'border-red-300 bg-red-50'
              } else if (selected) style = 'border-violet-300 bg-violet-50'
              return (
                <button key={oi} type="button"
                  onClick={() => !submitted && setAnswers((a) => ({ ...a, [qi]: oi }))}
                  disabled={submitted}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${style}`}>
                  <span className="text-slate-700">{opt}</span>
                  {submitted && oi === q.correctIndex && <Check className="h-4 w-4 flex-none text-emerald-600" />}
                  {submitted && selected && oi !== q.correctIndex && <X className="h-4 w-4 flex-none text-red-500" />}
                </button>
              )
            })}
          </div>
          {submitted && (
            <p className={`mt-2 rounded-xl px-3 py-2 text-xs leading-5 ${answers[qi] === q.correctIndex ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
              {q.explanation}
            </p>
          )}
        </div>
      ))}

      {!submitted ? (
        <button onClick={() => setSubmitted(true)}
          disabled={Object.keys(answers).length < questions.length}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white disabled:opacity-40">
          <Send className="h-4 w-4" /> Lihat Hasil
        </button>
      ) : (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-sm font-black text-slate-950">Hasil: {score}/{questions.length} benar</p>
          <button onClick={generate} disabled={loading}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-black text-violet-700 hover:bg-violet-100">
            <RefreshCw className="h-3.5 w-3.5" /> Soal Baru Lagi
          </button>
        </div>
      )}
    </div>
  )
}
