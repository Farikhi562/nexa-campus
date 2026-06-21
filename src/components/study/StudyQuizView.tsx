'use client'

import { useState } from 'react'
import { CheckCircle2, RotateCcw, Send, XCircle } from 'lucide-react'
import type { StudyQuizQuestion } from '@/lib/study/types'

type Props = {
  packId: string
  quiz: StudyQuizQuestion[]
  initialBestScore: number | null
}

export default function StudyQuizView({ packId, quiz, initialBestScore }: Props) {
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [bestScore, setBestScore] = useState(initialBestScore)

  const score = quiz.reduce((sum, q, i) => sum + (answers[i] === q.correctIndex ? 1 : 0), 0)
  const allAnswered = quiz.every((_, i) => answers[i] !== undefined)

  function selectAnswer(qIndex: number, optionIndex: number) {
    if (submitted) return
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }))
  }

  async function submitQuiz() {
    setSubmitted(true)
    setSaving(true)
    try {
      const res = await fetch(`/api/study/packs/${packId}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.data) setBestScore(json.data.quiz_best_score)
    } finally {
      setSaving(false)
    }
  }

  function retry() {
    setAnswers({})
    setSubmitted(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold text-slate-400">{quiz.length} soal</p>
        {bestScore !== null && (
          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-black text-violet-700">
            Skor terbaik: {bestScore}/{quiz.length}
          </span>
        )}
      </div>

      {quiz.map((q, qIndex) => {
        const selected = answers[qIndex]
        const isCorrect = selected === q.correctIndex

        return (
          <div key={qIndex} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm font-black text-slate-950">{qIndex + 1}. {q.question}</p>
            <div className="space-y-2">
              {q.options.map((option, optIndex) => {
                const isSelected = selected === optIndex
                let style = 'border-slate-200 bg-white hover:border-violet-200'
                if (submitted) {
                  if (optIndex === q.correctIndex) style = 'border-emerald-300 bg-emerald-50'
                  else if (isSelected) style = 'border-red-300 bg-red-50'
                } else if (isSelected) {
                  style = 'border-violet-300 bg-violet-50'
                }

                return (
                  <button
                    key={optIndex}
                    type="button"
                    onClick={() => selectAnswer(qIndex, optIndex)}
                    disabled={submitted}
                    className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${style}`}
                  >
                    <span className="text-slate-700">{option}</span>
                    {submitted && optIndex === q.correctIndex && <CheckCircle2 className="h-4 w-4 flex-none text-emerald-600" />}
                    {submitted && isSelected && optIndex !== q.correctIndex && <XCircle className="h-4 w-4 flex-none text-red-500" />}
                  </button>
                )
              })}
            </div>
            {submitted && (
              <p className={`mt-2 rounded-xl px-3 py-2 text-xs leading-5 ${isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {q.explanation}
              </p>
            )}
          </div>
        )
      })}

      {!submitted ? (
        <button
          type="button"
          onClick={submitQuiz}
          disabled={!allAnswered}
          className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white transition hover:bg-violet-700 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          Selesai &amp; Lihat Hasil
        </button>
      ) : (
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-sm font-black text-slate-950">
            Hasil: {score}/{quiz.length} benar {saving && '· menyimpan...'}
          </p>
          <button
            type="button"
            onClick={retry}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-black text-violet-700 hover:bg-violet-100"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Coba Lagi
          </button>
        </div>
      )}
    </div>
  )
}
