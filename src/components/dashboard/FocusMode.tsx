'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Bell, BellOff, Coffee, Flame, Pause, Play, RotateCcw, Timer, Volume2, VolumeX } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'

type Mode = 'focus' | 'break'
type DayActivity = { date: string; active: boolean }

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

/** Beep singkat pakai Web Audio API — tidak butuh file audio eksternal. */
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctx()
    const notes = [880, 1108.73] // A5 -> C#6, kecil & ramah kuping, bukan alarm jam weker
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
    // Web Audio tidak tersedia (browser lama/policy) — abaikan diam-diam, tidak kritikal.
  }
}

export default function FocusMode({
  weekActivity = [],
  todayDone = false,
}: {
  weekActivity?: DayActivity[]
  todayDone?: boolean
}) {
  const [preset, setPreset] = useState(PRESETS[0])
  const [mode, setMode] = useState<Mode>('focus')
  const [remaining, setRemaining] = useState(PRESETS[0].focus * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [message, setMessage] = useState('')
  const [soundOn, setSoundOn] = useState(true)
  const [notifOn, setNotifOn] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const totalForMode = (mode === 'focus' ? preset.focus : preset.brk) * 60
  const progress = totalForMode > 0 ? 1 - remaining / totalForMode : 0
  const streakCount = weekActivity.filter((d) => d.active).length

  // Judul tab browser ikut hitung mundur saat berjalan — biar kelihatan
  // progress-nya tanpa harus buka tab terus. Dikembalikan ke judul asli saat
  // berhenti/unmount.
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
    setMessage('Sesi fokus selesai! Saatnya istirahat sebentar. (+poin harian kalau ini sesi pertamamu hari ini)')
    if (soundOn) playChime()
    notify('Sesi fokus selesai! 🎉', 'Saatnya istirahat sebentar.')
    fetch('/api/focus/complete', { method: 'POST' }).catch(() => null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundOn, notifOn])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode, preset, completeFocus])

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

  const ringColor = mode === 'focus' ? '#2dd4bf' : '#fbbf24'

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
          style={{
            background: `radial-gradient(circle at 85% 10%, ${mode === 'focus' ? 'rgba(45,212,191,0.26)' : 'rgba(251,191,36,0.22)'}, transparent 20rem)`,
          }}
        />
        {running && (
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 animate-pulse rounded-full bg-teal-400/10 blur-3xl" />
        )}
        <div className="relative">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-100">
              <Timer className="h-3.5 w-3.5" />
              Focus Mode
            </div>
            {streakCount > 0 && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-100">
                <Flame className="h-3.5 w-3.5" />
                {streakCount}/7 hari aktif minggu ini
              </div>
            )}
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Fokus tanpa distraksi.</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
            Teknik Pomodoro: kerja fokus, lalu istirahat singkat. Selesaikan sesi fokus pertama tiap hari untuk poin harian.
          </p>

          {/* Strip 7 hari terakhir — data asli dari riwayat poin fokus */}
          {weekActivity.length > 0 && (
            <div className="mt-4 flex items-center gap-1.5">
              {weekActivity.map((day) => {
                const dow = new Date(`${day.date}T00:00:00`).getDay()
                return (
                  <div key={day.date} className="flex flex-col items-center gap-1">
                    <div
                      title={day.date}
                      className={`h-7 w-7 rounded-xl transition-all ${
                        day.active
                          ? 'bg-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.5)]'
                          : 'border border-white/10 bg-white/5'
                      }`}
                    />
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
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PRESETS.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setPreset(item)
                  reset('focus', item)
                }}
                className={`focus-ring rounded-2xl px-3 py-1.5 text-sm font-black transition ${
                  preset.label === item.label ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="mx-1 h-5 w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => setSoundOn((v) => !v)}
              title={soundOn ? 'Matikan suara' : 'Nyalakan suara'}
              className="focus-ring inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:text-slate-800"
            >
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={toggleNotif}
              title={notifOn ? 'Matikan notifikasi' : 'Nyalakan notifikasi browser'}
              className={`focus-ring inline-flex h-9 w-9 items-center justify-center rounded-2xl border transition ${
                notifOn ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800'
              }`}
            >
              {notifOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </button>
          </div>

          <div className="relative my-6 flex h-56 w-56 items-center justify-center sm:h-64 sm:w-64">
            {running && (
              <div
                className="absolute inset-0 animate-ping rounded-full opacity-20"
                style={{ backgroundColor: ringColor, animationDuration: '2.4s' }}
              />
            )}
            <svg className="absolute inset-0 -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="6" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={ringColor}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
                className="transition-all duration-500"
                style={{ filter: running ? `drop-shadow(0 0 6px ${ringColor}aa)` : undefined }}
              />
            </svg>
            <div className="text-center">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ${mode === 'focus' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-700'}`}>
                {mode === 'focus' ? <Timer className="h-3.5 w-3.5" /> : <Coffee className="h-3.5 w-3.5" />}
                {mode === 'focus' ? 'Fokus' : 'Istirahat'}
              </span>
              <p className={`mt-2 text-5xl font-black tabular-nums text-slate-950 transition-transform ${running ? 'scale-105' : ''}`}>
                {format(remaining)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setRunning((value) => !value)}
              className={`focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-black text-slate-950 transition active:scale-95 ${
                running ? 'bg-amber-300 hover:bg-amber-200' : 'bg-teal-400 hover:bg-teal-300'
              }`}
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? 'Jeda' : 'Mulai'}
            </button>
            <button
              onClick={() => reset(mode)}
              className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 active:scale-95"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <p className="text-sm font-bold text-slate-500">Sesi fokus selesai hari ini: {sessions}</p>
            {todayDone && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-black text-emerald-700">
                ✓ Poin hari ini sudah didapat
              </span>
            )}
          </div>
          {message && <p className="mt-2 max-w-sm text-center text-sm leading-6 text-teal-700">{message}</p>}
        </CardContent>
      </Card>

      <p className="px-1 text-center text-xs leading-5 text-slate-400">
        Tip: tutup notifikasi lain selama sesi fokus. Poin fokus dibatasi sekali per hari supaya adil.
      </p>
    </div>
  )
}
