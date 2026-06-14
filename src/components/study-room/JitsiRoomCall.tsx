'use client'

import { useMemo } from 'react'
import { Video } from 'lucide-react'
import { BRAND } from '@/lib/brand'

type JitsiRoomCallProps = {
  roomId: string
  displayName?: string | null
}

function sanitizeRoomId(roomId: string) {
  return roomId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'general'
}

export default function JitsiRoomCall({ roomId, displayName }: JitsiRoomCallProps) {
  const src = useMemo(() => {
    const safeRoom = sanitizeRoomId(roomId)
    const params = new URLSearchParams({
      'userInfo.displayName': displayName || 'NEXA Student',
      'config.prejoinPageEnabled': 'true',
      'config.startWithAudioMuted': 'true',
      'config.startWithVideoMuted': 'true',
      'interfaceConfig.SHOW_JITSI_WATERMARK': 'false',
    })

    return `https://meet.jit.si/${BRAND.productName.replace(/\s+/g, '')}-${safeRoom}#${params.toString()}`
  }, [roomId, displayName])

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-teal-600 text-white">
            <Video className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-sm font-black text-slate-950">Study Room Call</h2>
            <p className="text-xs text-slate-500">Voice/video call via Jitsi. Gratis, embed, no backend ribet.</p>
          </div>
        </div>
      </div>
      <iframe
        title="NEXA Study Room Call"
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="h-[72vh] w-full border-0"
      />
    </div>
  )
}
