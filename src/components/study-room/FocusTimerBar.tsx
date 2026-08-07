'use client'

import { useEffect, useState } from 'react'
import { Timer, Play, Square } from 'lucide-react'

export type FocusSession = {
  durationSec: number
  startedAt: number // epoch ms
  startedBy: string
  startedByName: string
}

const PRESETS = [15, 25, 50]

function formatClock(sec: number) {
  const m = Math.floor(Math.max(0, sec) / 60)
  const s = Math.max(0, sec) % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/**
 * Tombol kecil di header (buka/tutup picker durasi) + bar tipis yang cuma
 * muncul kalau ada sesi fokus aktif. Sengaja nggak jadi panel besar biar
 * nggak nambah "rame" ke layout chat yang udah padat.
 */
export default function FocusTimerBar({
  session,
  canControl,
  onStart,
  onStop,
}: {
  session: FocusSession | null
  canControl: boolean
  onStart: (minutes: number) => void
  onStop: () => void
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!session) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [session])

  if (!session) {
    return (
      <div className="relative flex-shrink-0">
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100"
          title="Mulai sesi fokus bareng"
        >
          <Timer className="h-5 w-5" />
        </button>
        {showPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowPicker(false)} />
            <div className="absolute right-0 top-11 z-20 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
              <p className="px-2 pb-1.5 pt-1 text-[11px] font-black uppercase tracking-wide text-slate-400">
                Mulai Fokus Bareng
              </p>
              {PRESETS.map((min) => (
                <button
                  key={min}
                  onClick={() => { onStart(min); setShowPicker(false) }}
                  className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  <Play className="h-3.5 w-3.5" /> {min} menit
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }

  const elapsed = Math.floor((now - session.startedAt) / 1000)
  const remaining = session.durationSec - elapsed
  const done = remaining <= 0
  const pct = Math.min(100, Math.max(0, (elapsed / session.durationSec) * 100))

  return (
    <div className="flex flex-shrink-0 items-center gap-3 border-b border-blue-100 bg-blue-50/60 px-4 py-2">
      <Timer className={`h-4 w-4 flex-none ${done ? 'text-emerald-600' : 'text-blue-600'}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs">
          <span className={`font-black tabular-nums ${done ? 'text-emerald-700' : 'text-blue-700'}`}>
            {done ? 'Selesai! 🎉' : formatClock(remaining)}
          </span>
          <span className="truncate text-slate-500">
            sesi fokus dari {session.startedByName} · {Math.round(session.durationSec / 60)} menit
          </span>
        </div>
        {!done && (
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-blue-100">
            <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
        )}
      </div>
      {canControl && (
        <button
          onClick={onStop}
          className="flex flex-none items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100"
        >
          <Square className="h-3 w-3" /> Stop
        </button>
      )}
    </div>
  )
}
