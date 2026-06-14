'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import { Lock, Mic, Phone, Video, WandSparkles } from 'lucide-react'

type AccessResponse = {
  plan?: 'radar' | 'pulse' | 'command'
  features?: Record<string, boolean>
  ownerOverride?: boolean
}

function getRoomIdFromPath(pathname: string | null) {
  if (!pathname) return ''
  const match = pathname.match(/\/dashboard\/study-room\/([^/?#]+)/)
  return decodeURIComponent(match?.[1] || '')
}

export default function StudyRoomCommandActions() {
  const params = useParams<{ id?: string; roomId?: string }>()
  const pathname = usePathname()
  const [access, setAccess] = useState<AccessResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const roomId = useMemo(() => {
    const fromParams = params?.id || params?.roomId
    return String(fromParams || getRoomIdFromPath(pathname) || '')
  }, [params, pathname])

  useEffect(() => {
    let alive = true
    fetch('/api/billing/access', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (alive) setAccess(json)
      })
      .catch(() => {
        if (alive) setAccess(null)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  if (!roomId) return null

  const isCommand = access?.plan === 'command' || access?.ownerOverride === true || access?.features?.study_room_voice_video === true
  const locked = !loading && !isCommand

  return (
    <section className="nexa-study-actions mb-4 overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-teal-700 dark:border-teal-400/30 dark:bg-teal-400/10 dark:text-teal-200">
            <WandSparkles className="h-3.5 w-3.5" /> Command Study Tools
          </div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Voice/video call + voice note Study Room</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Tombol call dan VN sekarang nongol di room. Fitur live call dan voice note dikunci buat Command biar server lu nggak jadi tempat karaoke gratisan.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:min-w-[520px]">
          <Link
            href={isCommand ? `/dashboard/study-room/${roomId}/call` : '/pricing'}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
              isCommand
                ? 'bg-teal-500 text-slate-950 hover:bg-teal-400'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15'
            }`}
          >
            {locked ? <Lock className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            Video Call
          </Link>

          <Link
            href={isCommand ? `/dashboard/study-room/${roomId}/call?mode=audio` : '/pricing'}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
              isCommand
                ? 'bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15'
            }`}
          >
            {locked ? <Lock className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            Voice Only
          </Link>

          <Link
            href={isCommand ? `/dashboard/study-room/${roomId}/voice-notes` : '/pricing'}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
              isCommand
                ? 'border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15'
            }`}
          >
            {locked ? <Lock className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            Voice Note
          </Link>
        </div>
      </div>
    </section>
  )
}
