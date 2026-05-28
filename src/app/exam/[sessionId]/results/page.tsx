'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Trophy, RotateCcw, Home, Download, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import type { ExamSession, Question, SessionAnswer, Profile } from '@/types'
import { PLAN_LIMITS } from '@/types'
import clsx from 'clsx'

interface AnswerWithQuestion extends SessionAnswer { question: Question }

export default function ResultsPage() {
  const router    = useRouter()
  const params    = useParams()
  const supabase  = createClient()
  const sessionId = params.sessionId as string

  const [session,  setSession]  = useState<ExamSession | null>(null)
  const [answers,  setAnswers]  = useState<AnswerWithQuestion[]>([])
  const [profile,  setProfile]  = useState<Profile | null>(null)
  const [docTitle, setDocTitle] = useState('')
  const [loading,  setLoading]  = useState(true)
  const [exporting, setExporting] = useState(false)
  const [tab, setTab] = useState<'summary' | 'detail'>('summary')

  const fetchResults = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }

    const [profileRes, sessionRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('exam_sessions').select('*').eq('id', sessionId).single(),
    ])

    if (!sessionRes.data) { router.push('/dashboard'); return }
    setProfile(profileRes.data as Profile)
    setSession(sessionRes.data as ExamSession)

    // Get document title
    if (sessionRes.data.document_id) {
      const { data: doc } = await supabase.from('documents').select('title').eq('id', sessionRes.data.document_id).single()
      if (doc) setDocTitle(doc.title)
    }

    // Get answers with questions
    const { data: answersData } = await supabase
      .from('session_answers')
      .select('*, question:questions(*)')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })

    if (answersData) setAnswers(answersData as AnswerWithQuestion[])
    setLoading(false)
  }, [sessionId, router, supabase])

  useEffect(() => { fetchResults() }, [fetchResults])

  async function handleExportPDF() {
    if (!session || !profile) return
    setExporting(true)
    try {
      const { exportResultsToPdf } = await import('@/lib/pdf-export')
      await exportResultsToPdf({
        session,
        answers,
        userName: profile.full_name || profile.email,
        documentTitle: docTitle,
      })
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const score        = session.score ?? 0
  const correct      = session.correct_count ?? 0
  const total        = session.total_questions
  const wrong        = total - correct
  const skipped      = answers.filter(a => a.selected_answer === null).length
  const timeTaken    = session.time_taken_seconds ?? 0
  const minutes      = Math.floor(timeTaken / 60)
  const seconds      = timeTaken % 60
  const canExport    = PLAN_LIMITS[profile?.plan ?? 'free'].canExportPDF

  const scoreColor =
    score >= 80 ? 'text-green-600' :
    score >= 60 ? 'text-amber-500' :
    'text-red-500'

  const scoreRing =
    score >= 80 ? 'border-green-500' :
    score >= 60 ? 'border-amber-400' :
    'border-red-400'

  const scoreBg =
    score >= 80 ? 'from-green-50 to-emerald-50' :
    score >= 60 ? 'from-amber-50 to-yellow-50' :
    'from-red-50 to-rose-50'

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
        {/* Score card */}
        <div className={clsx('bg-gradient-to-br rounded-3xl p-8 text-center border-2', scoreBg, scoreRing)}>
          <div className={clsx('inline-flex items-center justify-center w-28 h-28 rounded-full border-4 bg-white mb-4', scoreRing)}>
            <div>
              <p className={clsx('text-4xl font-extrabold font-sans', scoreColor)}>{score}</p>
              <p className="text-xs text-slate-400 font-medium">dari 100</p>
            </div>
          </div>

          <h1 className="font-sans text-2xl font-bold text-slate-900 mb-1">
            {score >= 80 ? '🎉 Luar Biasa!' : score >= 60 ? '👍 Cukup Baik!' : '💪 Terus Berlatih!'}
          </h1>
          <p className="text-slate-500 text-sm">{docTitle}</p>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            {[
              { icon: CheckCircle2, label: 'Benar', value: correct, color: 'text-green-600 bg-green-100' },
              { icon: XCircle,      label: 'Salah',  value: wrong,   color: 'text-red-500 bg-red-100' },
              { icon: MinusCircle,  label: 'Dilewat', value: skipped, color: 'text-slate-500 bg-slate-100' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl p-4 border border-white/50">
                <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center mb-2 mx-auto', color)}>
                  <Icon className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold font-sans text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm text-slate-500">
            ⏱ Waktu: <strong>{minutes} mnt {seconds} dtk</strong>
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => router.push('/dashboard')}
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Button>

          {canExport ? (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleExportPDF}
              loading={exporting}
            >
              <Download className="w-4 h-4" />
              Ekspor PDF
            </Button>
          ) : (
            <button
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-lg text-sm text-slate-400 cursor-not-allowed"
              title="Upgrade ke Basic untuk ekspor PDF"
            >
              <Download className="w-4 h-4" />
              Ekspor PDF (Basic+)
            </button>
          )}

          <Button
            className="flex-1"
            onClick={async () => {
              if (!session?.document_id) return
              const res = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documentId: session.document_id }),
              })
              const { data } = await res.json()
              if (data?.sessionId) router.push(`/exam/${data.sessionId}`)
            }}
          >
            <RotateCcw className="w-4 h-4" />
            Ulang
          </Button>
        </div>

        {/* Detail answers */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            {(['summary', 'detail'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={clsx(
                  'flex-1 py-3.5 text-sm font-semibold transition-colors',
                  tab === t ? 'text-brand-600 border-b-2 border-brand-600 -mb-px' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t === 'summary' ? 'Ringkasan' : 'Detail Jawaban'}
              </button>
            ))}
          </div>

          {tab === 'summary' ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Akurasi</span>
                <span className="font-bold text-slate-900">{total ? Math.round((correct / total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className="bg-brand-500 h-2 rounded-full transition-all"
                  style={{ width: `${total ? (correct / total) * 100 : 0}%` }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Total Soal</p>
                  <p className="font-bold text-slate-900">{total}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Skor Akhir</p>
                  <p className="font-bold text-slate-900">{score}/100</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Durasi</p>
                  <p className="font-bold text-slate-900">{minutes}:{String(seconds).padStart(2,'0')}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-500">Rata-rata / Soal</p>
                  <p className="font-bold text-slate-900">{total ? Math.round(timeTaken / total) : 0} dtk</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {answers.map((a, idx) => (
                <div key={a.id} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className={clsx(
                      'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mt-0.5',
                      a.is_correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    )}>
                      {a.is_correct ? '✓' : '✗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 mb-2">
                        <span className="text-slate-400 mr-1">{idx + 1}.</span>
                        {a.question?.question_text}
                      </p>

                      <div className="space-y-1.5">
                        {(['A','B','C','D'] as const).map(letter => {
                          const optText = a.question?.options?.[letter]
                          if (!optText) return null
                          const isCorrect  = a.question?.correct_answer === letter
                          const isSelected = a.selected_answer === letter
                          return (
                            <div
                              key={letter}
                              className={clsx(
                                'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs',
                                isCorrect  ? 'bg-green-50 text-green-800 font-medium' :
                                isSelected ? 'bg-red-50 text-red-700' :
                                'text-slate-500'
                              )}
                            >
                              <span className={clsx(
                                'font-bold',
                                isCorrect  ? 'text-green-600' :
                                isSelected ? 'text-red-500' :
                                'text-slate-400'
                              )}>{letter}.</span>
                              {optText}
                              {isCorrect  && <span className="ml-auto text-green-600">✓ Benar</span>}
                              {!isCorrect && isSelected && <span className="ml-auto text-red-500">✗ Pilihanmu</span>}
                            </div>
                          )
                        })}
                      </div>

                      {a.question?.explanation && (
                        <div className="mt-2 p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700">
                          💡 {a.question.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
