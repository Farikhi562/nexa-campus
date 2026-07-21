'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bell, BellOff, BookOpenCheck, Coffee, Flame, Pause, Play, RotateCcw, Target, Timer, Volume2, VolumeX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

type Mode = 'focus' | 'break'
type DayActivity = { date: string; active: boolean }

export type FocusDeadline = {
  id: string
  title: string | null
  course_name: string
  deadline_date: string
  deadline_time: string
  estimated_minutes: number | null
  progress_percent: number | null
}

const PRESETS: Array<{ label: string; focus: number; brk: number }> = [
  { label: '25 / 5', focus: 25, brk: 5 },
  { label: '45 / 10', focus: 45, brk: 10 },
  { label: '15 / 3', focus: 15, brk: 3 },
]

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function format(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getDeadlineTitle(deadline: FocusDeadline) {
  return deadline.title?.trim() || deadline.course_name
}

function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const notes = [880, 1108.73]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.16)
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + i * 0.16 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.16 + 0.45)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.16)
      osc.stop(ctx.currentTime + i * 0.16 + 0.5)
    })
    setTimeout(() => ctx.close().catch(() => null), 1200)
  } catch {
    // Audio cuma bonus. Kalau browser rewel, hidup tetap lanjut.
  }
}

export default function FocusMode({
  weekActivity = [],
  todayDone = false,
  deadlines = [],
  initialDeadlineId = '',
  todayMinutes = 0,
  weekMinutes = 0,
}: {
  weekActivity?: DayActivity[]
  todayDone?: boolean
  deadlines?: FocusDeadline[]
  initialDeadlineId?: string
  todayMinutes?: number
  weekMinutes?: number
}) {
  const [deadlineOptions, setDeadlineOptions] = useState(deadlines)
  const [selectedDeadlineId, setSelectedDeadlineId] = useState(
    deadlines.some((item) => item.id === initialDeadlineId) ? initialDeadlineId : deadlines[0]?.id ?? '',
  )
  const [preset, setPreset] = useState(PRESETS[0])
  const [mode, setMode] = useState<Mode>('focus')
  const [remaining, setRemaining] = useState(PRESETS[0].focus * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [sessionMinutes, setSessionMinutes] = useState(todayMinutes)
  const [message, setMessage] = useState('')
  const [soundOn, setSoundOn] = useState(true)
  const [notifOn, setNotifOn] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedDeadline = useMemo(
    () => deadlineOptions.find((item) => item.id === selectedDeadlineId) ?? null,
    [deadlineOptions, selectedDeadlineId],
  )
  const totalForMode = (mode === 'focus' ? preset.focus : preset.brk) * 60
  const progress = totalForMode > 0 ? 1 - remaining / totalForMode : 0
  const streakCount = weekActivity.filter((d) => d.active).length

  useEffect(() => {
    const original = document.title
    if (running) {
      document.title = `${format(remaining)} · ${mode === 'focus' ? 'Fokus' : 'Istirahat'} — NEXA`
    }
    return () => { document.title = original }
  }, [running, remaining, mode])

  function notify(title: string, body: string) {
    if (notifOn && typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
      try { new Notification(title, { body, icon: '/icon-192.png' }) } catch { /* ignore */ }
    }
  }

  const completeFocus = useCallback(async () => {
    setSessions((value) => value + 1)
    setSessionMinutes((value) => value + preset.focus)
    setMessage(selectedDeadline
      ? `Sesi fokus untuk “${getDeadlineTitle(selectedDeadline)}” selesai. Progress tugas ikut diperbarui.`
      : 'Sesi fokus selesai! Saatnya istirahat sebentar.')
    if (soundOn) playChime()
    notify('Sesi fokus selesai! 🎉', 'Saatnya istirahat sebentar.')

    try {
      const response = await fetch('/api/focus/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadlineId: selectedDeadlineId || null, durationMinutes: preset.focus }),
      })
      const result = await response.json().catch(() => null)
      if (response.ok && result?.deadline?.id) {
        setDeadlineOptions((current) => current.map((item) => item.id === result.deadline.id
          ? { ...item, progress_percent: result.deadline.progress_percent }
          : item))
      }
    } catch {
      // Timer tetap sah walau penyimpanan histori sedang ngambek.
    }
  }, [notifOn, preset.focus, selectedDeadline, selectedDeadlineId, soundOn])

  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current)
          setRunning(false)
          if (mode === 'focus') {
            void completeFocus()
            setMode('break')
            return preset.brk * 60
          }
          if (soundOn) playChime()
          notify('Istirahat selesai 💪', 'Lanjut fokus lagi, yuk.')
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
  }, [running, mode, preset, completeFocus, soundOn])

  function reset(toMode: Mode = 'focus', newPreset = preset) {
    setRunning(false)
    setMode(toMode)
    setRemaining((toMode === 'focus' ? newPreset.focus : newPreset.brk) * 60)
  }

  async function toggleNotif() {
    if (notifOn) { setNotifOn(false); return }
    if (typeof Notification === 'undefined') return
    if (Notification.permission === 'granted') { setNotifOn(true); return }
    const perm = await Notification.requestPermission().catch(() => 'denied')
    setNotifOn(perm === 'granted')
  }

  const ringColor = mode === 'focus' ? '#60a5fa' : '#fbbf24'

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
          style={{ background: `radial-gradient(circle at 85% 10%, ${mode === 'focus' ? 'rgba(96,165,250,0.26)' : 'rgba(251,191,36,0.22)'}, transparent 20rem)` }}
        />
        {running && <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 animate-pulse rounded-full bg-blue-400/10 blur-3xl" />}
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-300/10 px-3 py-1.5 text-xs font-black text-blue-100">
              <Timer className="h-3.5 w-3.5" /> Focus Mode
            </div>
            {streakCount > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-100">
                <Flame className="h-3.5 w-3.5" /> {streakCount}/7 hari aktif minggu ini
              </div>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Fokus yang nyambung ke tugas.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Pilih deadline, jalankan Pomodoro, lalu durasi dan progress-nya tercatat. Timer akhirnya punya konteks, bukan cuma angka muter.
          </p>

          <div className="mt-4 grid max-w-xl grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-black uppercase text-slate-400">Hari ini</p>
              <p className="mt-1 text-xl font-black">{sessionMinutes} menit</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] font-black uppercase text-slate-400">Minggu ini</p>
              <p className="mt-1 text-xl font-black">{weekMinutes + sessions * preset.focus} menit</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/10 bg-white/5 p-3 sm:col-span-1">
              <p className="text-[10px] font-black uppercase text-slate-400">Sesi lokal</p>
              <p className="mt-1 text-xl font-black">{sessions}</p>
            </div>
          </div>

          {weekActivity.length > 0 && (
            <div className="mt-4 flex items-center gap-1.5">
              {weekActivity.map((day) => {
                const dow = new Date(`${day.date}T00:00:00`).getDay()
                return (
                  <div key={day.date} className="flex flex-col items-center gap-1">
                    <div title={day.date} className={`h-7 w-7 rounded-xl transition-all ${day.active ? 'bg-blue-300 shadow-[0_0_12px_rgba(96,165,250,0.5)]' : 'border border-white/10 bg-white/5'}`} />
                    <span className="text-[9px] font-bold uppercase text-slate-500">{DAY_LABELS[dow]}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Card>
        <CardContent className="flex flex-col items-center p-6 sm:p-8">
          <div className="mb-5 w-full max-w-xl rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
              <Target className="h-4 w-4 text-blue-600" /> Tugas yang dikerjain
            </label>
            <select
              value={selectedDeadlineId}
              onChange={(event) => setSelectedDeadlineId(event.target.value)}
              disabled={running}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-800 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
            >
              <option value="">Fokus umum, tanpa deadline</option>
              {deadlineOptions.map((deadline) => (
                <option key={deadline.id} value={deadline.id}>
                  {getDeadlineTitle(deadline)} · {deadline.progress_percent ?? 0}%
                </option>
              ))}
            </select>
            {selectedDeadline && (
              <div className="mt-3 flex items-center gap-3 rounded-xl bg-white p-3">
                <BookOpenCheck className="h-5 w-5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3 text-xs font-black text-slate-600">
                    <span className="truncate">{selectedDeadline.course_name}</span>
                    <span>{selectedDeadline.progress_percent ?? 0}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${selectedDeadline.progress_percent ?? 0}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {PRESETS.map((item) => (
              <button
                key={item.label}
                onClick={() => { setPreset(item); reset('focus', item) }}
                disabled={running}
                className={`focus-ring rounded-2xl px-3 py-1.5 text-sm font-black transition disabled:opacity-50 ${preset.label === item.label ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
              >
                {item.label}
              </button>
            ))}
            <div className="mx-1 h-5 w-px bg-slate-200" />
            <button type="button" onClick={() => setSoundOn((v) => !v)} title={soundOn ? 'Matikan suara' : 'Nyalakan suara'} className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800">
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button type="button" onClick={toggleNotif} title={notifOn ? 'Matikan notifikasi' : 'Nyalakan notifikasi browser'} className={`focus-ring inline-flex h-9 w-9 items-center justify-center rounded-2xl border transition ${notifOn ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'}`}>
              {notifOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative my-6 flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
            {running && <div className="absolute inset-0 animate-ping rounded-full opacity-20" style={{ backgroundColor: ringColor, animationDuration: '2.4s' }} />}
            <svg className="absolute inset-0 -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle cx="50" cy="50" r="45" fill="none" stroke={ringColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={2 * Math.PI * 45} strokeDashoffset={2 * Math.PI * 45 * (1 - progress)} className="transition-all duration-500" style={{ filter: running ? `drop-shadow(0 0 6px ${ringColor}aa)` : undefined }} />
            </svg>
            <div className="text-center">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${mode === 'focus' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                {mode === 'focus' ? <Timer className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
                {mode === 'focus' ? 'Fokus' : 'Istirahat'}
              </span>
              <p className={`mt-2 text-5xl font-black tabular-nums text-slate-950 transition-transform ${running ? 'scale-105' : ''}`}>{format(remaining)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setRunning((value) => !value)} className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-slate-950 transition active:scale-95 ${running ? 'bg-amber-300 hover:bg-amber-200' : 'bg-blue-400 hover:bg-blue-300'}`}>
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {running ? 'Jeda' : 'Mulai'}
            </button>
            <button onClick={() => reset(mode)} className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 active:scale-95">
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <p className="text-sm font-bold text-slate-500">Sesi fokus selesai saat halaman dibuka: {sessions}</p>
            {todayDone && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">✓ Poin hari ini sudah didapat</span>}
          </div>
          {message && <p className="mt-2 max-w-md text-center text-sm leading-6 text-blue-700">{message}</p>}
        </CardContent>
      </Card>

      <p className="px-1 text-center text-xs leading-5 text-slate-400">
        Progress berbasis waktu berhenti di 95%. Tetap tandai checklist atau deadline selesai, karena duduk 25 menit bukan bukti tugasnya mendadak beres. Tragis tapi faktual.
      </p>
    </div>
  )
}
