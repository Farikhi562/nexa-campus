'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Coffee, Pause, Play, RotateCcw, Timer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

type Mode = 'focus' | 'break'

const PRESETS: Array<{ label: string; focus: number; brk: number }> = [
  { label: '25 / 5', focus: 25, brk: 5 },
  { label: '45 / 10', focus: 45, brk: 10 },
  { label: '15 / 3', focus: 15, brk: 3 },
]

function format(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FocusMode() {
  const [preset, setPreset] = useState(PRESETS[0])
  const [mode, setMode] = useState<Mode>('focus')
  const [remaining, setRemaining] = useState(PRESETS[0].focus * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [message, setMessage] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalForMode = (mode === 'focus' ? preset.focus : preset.brk) * 60
  const progress = totalForMode > 0 ? 1 - remaining / totalForMode : 0

  const completeFocus = useCallback(async () => {
    setSessions((value) => value + 1)
    setMessage(
      'Sesi fokus selesai! Saatnya istirahat sebentar. (+poin harian kalau ini sesi pertamamu hari ini)'
    )
    fetch('/api/focus/complete', { method: 'POST' }).catch(() => null)
  }, [])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setRunning(false)
          if (mode === 'focus') {
            completeFocus()
            setMode('break')
            return preset.brk * 60
          }
          setMode('focus')
          setMessage('Istirahat selesai. Lanjut fokus lagi 💪')
          return preset.focus * 60
        }
        return value - 1
      })
    }, 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [running, mode, preset, completeFocus])

  function reset(toMode: Mode = 'focus', newPreset = preset) {
    setRunning(false)
    setMode(toMode)
    setRemaining((toMode === 'focus' ? newPreset.focus : newPreset.brk) * 60)
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(45,212,191,0.26),transparent_20rem)]" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-100">
            <Timer className="h-3.5 w-3.5" />
            Focus Mode
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Fokus tanpa distraksi.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Teknik Pomodoro: kerja fokus, lalu istirahat singkat. Selesaikan sesi fokus pertama tiap
            hari untuk poin harian.
          </p>
        </div>
      </section>

      <Card>
        <CardContent className="flex flex-col items-center p-6 sm:p-8">
          <div className="flex gap-2">
            {PRESETS.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setPreset(item)
                  reset('focus', item)
                }}
                className={`focus-ring rounded-2xl px-3 py-1.5 text-sm font-black transition ${
                  preset.label === item.label
                    ? 'bg-slate-950 text-white'
                    : 'border border-slate-200 bg-white text-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative my-6 flex h-56 w-56 items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={mode === 'focus' ? '#0d9488' : '#f59e0b'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                className="transition-all duration-500"
              />
            </svg>
            <div className="text-center">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${mode === 'focus' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'}`}
              >
                {mode === 'focus' ? (
                  <Timer className="h-3.5 w-3.5" />
                ) : (
                  <Coffee className="h-3.5 w-3.5" />
                )}
                {mode === 'focus' ? 'Fokus' : 'Istirahat'}
              </span>
              <p className="mt-2 text-5xl font-black tabular-nums text-slate-950">
                {format(remaining)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRunning((value) => !value)}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-teal-400 px-6 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-300"
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? 'Jeda' : 'Mulai'}
            </button>
            <button
              onClick={() => reset(mode)}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <p className="mt-5 text-sm font-bold text-slate-500">
            Sesi fokus selesai hari ini: {sessions}
          </p>
          {message && (
            <p className="mt-2 max-w-sm text-center text-sm leading-6 text-teal-700">{message}</p>
          )}
        </CardContent>
      </Card>

      <p className="px-1 text-center text-xs leading-5 text-slate-400">
        Tip: tutup notifikasi lain selama sesi fokus. Poin fokus dibatasi sekali per hari supaya
        adil.
      </p>
    </div>
  )
}
