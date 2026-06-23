'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, CheckCircle2, ChevronRight, Clock, Loader2, PauseCircle, PlayCircle, RefreshCw, RotateCcw, Sparkles } from 'lucide-react'
import type { StudyPlan, StudyStep, StudyStepType } from '@/lib/study/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_ICONS: Record<StudyStepType, string> = {
  read:     '📖',
  watch:    '🎬',
  practice: '✏️',
  quiz:     '🎯',
  review:   '🔍',
  write:    '📝',
  rest:     '☕',
}

const STEP_COLOR: Record<StudyStepType, string> = {
  read:     'border-blue-700/50 bg-blue-900/20',
  watch:    'border-purple-700/50 bg-purple-900/20',
  practice: 'border-amber-700/50 bg-amber-900/20',
  quiz:     'border-teal-700/50 bg-teal-900/20',
  review:   'border-indigo-700/50 bg-indigo-900/20',
  write:    'border-emerald-700/50 bg-emerald-900/20',
  rest:     'border-zinc-700 bg-zinc-800/40',
}

// ─── Countdown Timer hook ─────────────────────────────────────────────────────

function useCountdown(totalSeconds: number, onComplete: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds)
  const [running, setRunning]     = useState(false)
  const intervalRef               = useRef<ReturnType<typeof setInterval> | null>(null)
  const onCompleteRef             = useRef(onComplete)
  onCompleteRef.current = onComplete

  const start = useCallback(() => setRunning(true), [])
  const pause = useCallback(() => setRunning(false), [])
  const reset = useCallback(() => { setRunning(false); setRemaining(totalSeconds) }, [totalSeconds])

  useEffect(() => {
    setRemaining(totalSeconds)
    setRunning(false)
  }, [totalSeconds])

  useEffect(() => {
    if (!running) { if (intervalRef.current) clearInterval(intervalRef.current); return }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current!)
          setRunning(false)
          onCompleteRef.current()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current!)
  }, [running])

  const pct = totalSeconds > 0 ? Math.round(((totalSeconds - remaining) / totalSeconds) * 100) : 0
  const mm  = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss  = String(remaining % 60).padStart(2, '0')

  return { remaining, running, pct, display: `${mm}:${ss}`, start, pause, reset }
}

// ─── TimerCircle ──────────────────────────────────────────────────────────────

function TimerCircle({ display, pct, running }: { display: string; pct: number; running: boolean }) {
  const r = 30, circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  return (
    <div className="relative flex items-center justify-center">
      <svg width="76" height="76" className="-rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-zinc-700" />
        <circle
          cx="38" cy="38" r={r} fill="none" strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className={pct >= 100 ? 'stroke-emerald-400' : running ? 'stroke-teal-400' : 'stroke-zinc-500'}
          style={{ transition: 'stroke-dasharray 1s linear' }}
        />
      </svg>
      <span className="absolute text-sm font-bold text-zinc-200 rotate-0">{pct >= 100 ? '✓' : display}</span>
    </div>
  )
}

// ─── StepRow ─────────────────────────────────────────────────────────────────

interface StepRowProps {
  step: StudyStep
  index: number
  isActive: boolean
  isDone: boolean
  onActivate: () => void
  onDone: () => void
}

function StepRow({ step, index, isActive, isDone, onActivate, onDone }: StepRowProps) {
  const totalSec = step.duration_minutes * 60
  const timer = useCountdown(totalSec, onDone)

  if (!isActive) {
    return (
      <button
        onClick={onActivate}
        className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-opacity ${
          isDone ? 'opacity-50' : 'opacity-100 hover:border-zinc-600'
        } ${STEP_COLOR[step.type]}`}
      >
        <span className="text-lg shrink-0">{STEP_ICONS[step.type]}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isDone && <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />}
            <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
              {index + 1}. {step.title}
            </p>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">{step.duration_minutes} menit</p>
        </div>
        <ChevronRight size={14} className="text-zinc-600 shrink-0" />
      </button>
    )
  }

  return (
    <div className={`rounded-2xl border-2 ${isDone ? 'border-emerald-600/60' : 'border-teal-600/60'} ${STEP_COLOR[step.type]} p-4 space-y-3`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{STEP_ICONS[step.type]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100">{step.title}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{step.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <TimerCircle display={timer.display} pct={timer.pct} running={timer.running} />
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            {!timer.running ? (
              <button
                onClick={timer.start}
                disabled={isDone}
                className="flex items-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 px-4 py-2 text-xs font-semibold text-white transition-colors"
              >
                <PlayCircle size={14} /> Mulai
              </button>
            ) : (
              <button
                onClick={timer.pause}
                className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2 text-xs font-semibold text-white transition-colors"
              >
                <PauseCircle size={14} /> Jeda
              </button>
            )}
            <button
              onClick={timer.reset}
              className="rounded-xl bg-zinc-700 hover:bg-zinc-600 p-2 text-zinc-300 transition-colors"
              title="Reset timer"
            >
              <RotateCcw size={14} />
            </button>
          </div>
          <button
            onClick={onDone}
            className={`w-full flex items-center justify-center gap-1.5 rounded-xl text-xs font-semibold py-2 transition-colors ${
              isDone
                ? 'bg-emerald-700/50 text-emerald-300'
                : 'bg-zinc-700 hover:bg-emerald-700 text-zinc-200 hover:text-white'
            }`}
          >
            <CheckCircle2 size={13} /> {isDone ? 'Selesai ✓' : 'Tandai Selesai'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  packId: string
  topic: string
}

export function StudyPlanWithTimer({ packId, topic }: Props) {
  const [plan, setPlan]             = useState<StudyPlan | null>(null)
  const [progress, setProgress]     = useState<string[]>([])   // completed step ids
  const [activeStepId, setActive]   = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // ── Load existing plan ──
  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/study/packs/${packId}/plan`)
        if (res.ok) {
          const j = await res.json() as { plan: StudyPlan | null; progress: string[] }
          setPlan(j.plan)
          setProgress(j.progress ?? [])
          if (j.plan?.steps?.length) setActive(j.plan.steps[0].id)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [packId])

  // ── Generate new plan ──
  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/study/packs/${packId}/plan`, { method: 'POST' })
      const j = await res.json() as { plan?: StudyPlan; error?: string }
      if (!res.ok || !j.plan) { setError(j.error ?? 'Gagal membuat rencana.'); return }
      setPlan(j.plan)
      setProgress([])
      setActive(j.plan.steps[0]?.id ?? null)
    } catch {
      setError('Gagal terhubung ke server.')
    } finally {
      setGenerating(false)
    }
  }

  // ── Toggle step done ──
  async function toggleDone(stepId: string) {
    const next = progress.includes(stepId)
      ? progress.filter((id) => id !== stepId)
      : [...progress, stepId]

    setProgress(next)
    setSaving(true)

    // Auto-advance to next undone step
    if (!progress.includes(stepId) && plan) {
      const idx = plan.steps.findIndex((s) => s.id === stepId)
      const nextStep = plan.steps.slice(idx + 1).find((s) => !next.includes(s.id))
      if (nextStep) setActive(nextStep.id)
    }

    await fetch(`/api/study/packs/${packId}/plan`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed_step_ids: next }),
    }).catch(() => null)
    setSaving(false)
  }

  const doneCount = plan ? plan.steps.filter((s) => progress.includes(s.id)).length : 0
  const totalSteps = plan?.steps.length ?? 0
  const allDone = totalSteps > 0 && doneCount === totalSteps

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-zinc-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Memuat rencana…</span>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-teal-400" />
        <h3 className="text-base font-semibold text-zinc-100">Rencana Belajar</h3>
        {saving && <Loader2 size={12} className="ml-auto animate-spin text-zinc-500" />}
      </div>

      {!plan ? (
        /* No plan yet */
        <div className="rounded-2xl border-2 border-dashed border-zinc-700 p-6 text-center space-y-3">
          <BookOpen size={28} className="mx-auto text-zinc-600" />
          <p className="text-sm text-zinc-400">Belum ada rencana untuk <span className="text-zinc-200 font-medium">{topic}</span>.</p>
          <p className="text-xs text-zinc-600">AI akan buatkan sesi belajar bertahap lengkap dengan timer.</p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="mx-auto flex items-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {generating ? 'Membuat rencana…' : 'Buat Rencana Belajar'}
          </button>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>
      ) : (
        <>
          {/* Progress header */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">{doneCount} / {totalSteps} langkah selesai</span>
              <span className="text-zinc-500">{plan.total_minutes} menit total</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-500 transition-all duration-500"
                style={{ width: `${totalSteps > 0 ? (doneCount / totalSteps) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* All done banner */}
          {allDone && (
            <div className="rounded-2xl bg-emerald-900/30 border border-emerald-700/50 p-4 text-center space-y-1">
              <p className="text-sm font-semibold text-emerald-300">🎉 Sesi belajar selesai!</p>
              <p className="text-xs text-emerald-400/70">Bagus banget — kamu sudah menyelesaikan semua langkah.</p>
            </div>
          )}

          {/* Steps */}
          <div className="space-y-2">
            {plan.steps.map((step, i) => (
              <StepRow
                key={step.id}
                step={step}
                index={i}
                isActive={activeStepId === step.id}
                isDone={progress.includes(step.id)}
                onActivate={() => setActive(step.id)}
                onDone={() => void toggleDone(step.id)}
              />
            ))}
          </div>

          {/* Regen */}
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-1"
          >
            <RefreshCw size={12} />
            {generating ? 'Membuat ulang…' : 'Buat ulang rencana'}
          </button>
          {error && <p className="text-xs text-rose-400 text-center">{error}</p>}
        </>
      )}
    </div>
  )
}
