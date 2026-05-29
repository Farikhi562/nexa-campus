'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ExamTimer from '@/components/ExamTimer'
import Button from '@/components/ui/Button'
import { ChevronLeft, ChevronRight, Flag, AlertTriangle } from 'lucide-react'
import type { Question, ExamSession, ClientAnswer } from '@/types'
import clsx from 'clsx'

const EXAM_DURATION = 90 * 60 // 90 minutes

export default function ExamPage() {
  const router   = useRouter()
  const params   = useParams()
  const supabase = useMemo(() => createClient(), [])
  const sessionId = params.sessionId as string

  const [questions, setQuestions]   = useState<Question[]>([])
  const [session, setSession]       = useState<ExamSession | null>(null)
  const [answers, setAnswers]       = useState<ClientAnswer[]>([])
  const [current, setCurrent]       = useState(0)
  const [loading, setLoading]       = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const startTimeRef = useRef<number>(Date.now())

  const fetchExam = useCallback(async () => {
    // Get session
    const { data: sessionData } = await supabase
      .from('exam_sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!sessionData) { router.push('/dashboard'); return }
    if (sessionData.status === 'completed') {
      router.push(`/exam/${sessionId}/results`)
      return
    }

    setSession(sessionData as ExamSession)

    // Get questions for this document
    const { data: questionsData } = await supabase
      .from('questions')
      .select('*')
      .eq('document_id', sessionData.document_id)
      .order('order_index', { ascending: true })

    if (!questionsData || questionsData.length === 0) {
      router.push('/dashboard')
      return
    }

    setQuestions(questionsData as Question[])
    setAnswers(questionsData.map(q => ({ questionId: q.id, selectedAnswer: null })))
    setLoading(false)
  }, [sessionId, router, supabase])

  useEffect(() => { fetchExam() }, [fetchExam])

  function selectAnswer(letter: string) {
    setAnswers(prev => prev.map((a, i) =>
      i === current ? { ...a, selectedAnswer: letter } : a
    ))
  }

  async function submitExam(forced = false) {
    if (submitting) return

    const unanswered = answers.filter(a => a.selectedAnswer === null).length
    if (!forced && unanswered > 0 && !showConfirm) {
      setShowConfirm(true)
      return
    }

    setSubmitting(true)
    setShowConfirm(false)

    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000)

    const res = await fetch(`/api/sessions/${sessionId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, timeTaken }),
    })

    if (res.ok) {
      router.push(`/exam/${sessionId}/results`)
    } else {
      setSubmitting(false)
      alert('Gagal mengirim jawaban. Coba lagi.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Memuat soal...</p>
        </div>
      </div>
    )
  }

  const q            = questions[current]
  const currentAns   = answers[current]?.selectedAnswer
  const answeredCount = answers.filter(a => a.selectedAnswer !== null).length
  const OPTS         = ['A', 'B', 'C', 'D'] as const

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* ── Topbar ── */}
      <header className="bg-brand-950 text-white px-4 py-3 flex items-center justify-between gap-4 sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-medium text-white/70 whitespace-nowrap">
            Soal {current + 1}/{questions.length}
          </span>
          <div className="hidden sm:block text-xs text-white/50 truncate max-w-[200px]">
            {session?.document_id}
          </div>
        </div>

        <ExamTimer
          durationSeconds={EXAM_DURATION}
          onTimeUp={() => submitExam(true)}
          className="flex-shrink-0"
        />

        <Button
          size="sm"
          onClick={() => setShowConfirm(true)}
          disabled={submitting}
          className="flex-shrink-0 bg-white text-brand-700 hover:bg-brand-50 border-none"
        >
          <Flag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Selesai</span>
        </Button>
      </header>

      {/* ── Progress bar ── */}
      <div className="h-1 bg-white/10">
        <div
          className="h-1 bg-brand-400 transition-all duration-300"
          style={{ width: `${((current + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-5xl w-full mx-auto gap-0 lg:gap-6 p-4">
        {/* Question panel */}
        <div className="flex-1 space-y-4">
          {/* Question text */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 bg-brand-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">
                {current + 1}
              </span>
              <p className="text-slate-800 font-medium leading-relaxed text-base">
                {q.question_text}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {OPTS.map(letter => {
              const optText = q.options[letter]
              if (!optText) return null
              const selected = currentAns === letter

              return (
                <button
                  key={letter}
                  onClick={() => selectAnswer(letter)}
                  className={clsx(
                    'answer-option w-full text-left',
                    selected && 'selected'
                  )}
                >
                  <span className={clsx(
                    'flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-colors',
                    selected
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'border-slate-300 text-slate-500'
                  )}>
                    {letter}
                  </span>
                  <span className="text-sm text-slate-700 leading-relaxed">{optText}</span>
                </button>
              )
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
            >
              <ChevronLeft className="w-4 h-4" />
              Sebelumnya
            </Button>

            {current < questions.length - 1 ? (
              <Button onClick={() => setCurrent(c => c + 1)}>
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={() => setShowConfirm(true)} loading={submitting}>
                <Flag className="w-4 h-4" />
                Selesai Ujian
              </Button>
            )}
          </div>
        </div>

        {/* Sidebar: question grid */}
        <div className="lg:w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Navigasi Soal
            </p>
            <div className="grid grid-cols-6 lg:grid-cols-5 gap-1.5 mb-4">
              {questions.map((_, i) => {
                const ans = answers[i]?.selectedAnswer
                return (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={clsx(
                      'w-8 h-8 rounded-lg text-xs font-bold transition-all',
                      i === current
                        ? 'bg-brand-600 text-white ring-2 ring-brand-300'
                        : ans
                        ? 'bg-brand-100 text-brand-700 hover:bg-brand-200'
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                    )}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-brand-100" />
                <span>Sudah dijawab ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-slate-100" />
                <span>Belum dijawab ({questions.length - answeredCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm Submit Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-sans font-bold text-slate-900">Selesaikan Ujian?</h3>
            </div>

            <p className="text-sm text-slate-600 mb-2">
              Kamu telah menjawab <strong>{answeredCount}</strong> dari <strong>{questions.length}</strong> soal.
            </p>
            {answeredCount < questions.length && (
              <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-2 mb-4">
                {questions.length - answeredCount} soal belum dijawab dan akan dihitung sebagai salah.
              </p>
            )}

            <div className="flex gap-3 mt-5">
              <Button variant="outline" fullWidth onClick={() => setShowConfirm(false)}>
                Lanjutkan Ujian
              </Button>
              <Button fullWidth loading={submitting} onClick={() => submitExam(true)}>
                Ya, Selesai
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
