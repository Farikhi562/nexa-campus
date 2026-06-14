'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Mic, PhoneOff, Video } from 'lucide-react'
import { BRAND } from '@/lib/brand'

type JitsiRoomCallProps = {
  roomId: string
  displayName?: string | null
  mode?: 'video' | 'audio'
}

function sanitizeRoomId(roomId: string) {
  return roomId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'general'
}

export default function JitsiRoomCall({ roomId, displayName, mode = 'video' }: JitsiRoomCallProps) {
  const src = useMemo(() => {
    const safeRoom = sanitizeRoomId(roomId)
    const isAudioOnly = mode === 'audio'
    const params = new URLSearchParams({
      'userInfo.displayName': displayName || 'NEXA Student',
      'config.prejoinPageEnabled': 'true',
      'config.startWithAudioMuted': 'false',
      'config.startWithVideoMuted': isAudioOnly ? 'true' : 'false',
      'config.startAudioOnly': isAudioOnly ? 'true' : 'false',
      'interfaceConfig.SHOW_JITSI_WATERMARK': 'false',
    })

    return `https://meet.jit.si/${BRAND.productName.replace(/\s+/g, '')}-${safeRoom}#${params.toString()}`
  }, [roomId, displayName, mode])

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-600 text-white">
            {mode === 'audio' ? <Mic className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </span>
          <div>
            <h2 className="text-sm font-black text-slate-950 dark:text-white">
              {mode === 'audio' ? 'Study Room Voice Call' : 'Study Room Video Call'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Command-only. Jitsi embed, mic/camera permission dari browser.
            </p>
          </div>
        </div>
        <Link
          href={`/dashboard/study-room/${roomId}`}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
        >
          <PhoneOff className="h-3.5 w-3.5" /> Keluar call
        </Link>
      </div>
      <iframe
        title="NEXA Study Room Call"
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="h-[72vh] min-h-[520px] w-full border-0 max-sm:h-[68vh] max-sm:min-h-[420px]"
      />
    </div>
  )
}
