'use client'

import { useEffect, useState, useCallback } from 'react'
import { Timer } from 'lucide-react'
import clsx from 'clsx'

interface ExamTimerProps {
  durationSeconds: number
  onTimeUp: () => void
  className?: string
}

export default function ExamTimer({ durationSeconds, onTimeUp, className }: ExamTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds)
  const [triggered, setTriggered] = useState(false)

  const handleTimeUp = useCallback(() => {
    if (!triggered) {
      setTriggered(true)
      onTimeUp()
    }
  }, [triggered, onTimeUp])

  useEffect(() => {
    if (secondsLeft <= 0) {
      handleTimeUp()
      return
    }

    const interval = setInterval(() => {
      setSecondsLeft(s => {
        if (s <= 1) {
          clearInterval(interval)
          return 0
        }
        return s - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [secondsLeft, handleTimeUp])

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const pct = (secondsLeft / durationSeconds) * 100
  const isWarning = secondsLeft <= 60
  const isCritical = secondsLeft <= 20

  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div
        className={clsx(
          'flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-mono font-bold transition-colors',
          isCritical
            ? 'bg-red-100 text-red-600 animate-pulse'
            : isWarning
            ? 'bg-amber-100 text-amber-700'
            : 'bg-slate-100 text-slate-700'
        )}
      >
        <Timer className="w-4 h-4" />
        <span>
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      {/* Progress bar */}
      <div className="hidden sm:block w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-1000',
            isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-400' : 'bg-brand-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
