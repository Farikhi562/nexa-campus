'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import type { StudyRoadmapStep } from '@/lib/study/types'

/**
 * Checklist visual progress belajar. Status "selesai" disimpan di state
 * lokal saja (bukan di DB) — ini cuma bantuan visual fokus per sesi
 * belajar, bukan data yang perlu disinkronkan lintas perangkat.
 */
export default function StudyRoadmapView({ roadmap }: { roadmap: StudyRoadmapStep[] }) {
  const [done, setDone] = useState<Set<number>>(new Set())

  function toggle(step: number) {
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(step)) next.delete(step)
      else next.add(step)
      return next
    })
  }

  const totalMinutes = roadmap.reduce((sum, s) => sum + s.estimatedMinutes, 0)

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-slate-400">
        {roadmap.length} langkah · estimasi total {totalMinutes} menit · {done.size}/{roadmap.length} selesai
      </p>
      <div className="space-y-2">
        {roadmap.map((s) => {
          const isDone = done.has(s.step)
          return (
            <button
              key={s.step}
              type="button"
              onClick={() => toggle(s.step)}
              className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
                isDone ? 'border-emerald-200 bg-emerald-50/60' : 'border-slate-200 bg-white hover:border-violet-200'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-emerald-600" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 flex-none text-slate-300" />
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-black ${isDone ? 'text-emerald-800 line-through' : 'text-slate-950'}`}>
                  {s.step}. {s.title}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500">{s.description}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <Clock className="h-3 w-3" /> ~{s.estimatedMinutes} menit
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
