'use client'

import { useEffect, useRef, useState } from 'react'
import { Video, PhoneOff, Loader2 } from 'lucide-react'

/**
 * Voice/Video call untuk Study Room — pakai Jitsi Meet (gratis, tanpa server sendiri,
 * tanpa API key). Tiap room dapat ruang panggil unik berbasis roomId.
 *
 * Cara pasang di StudyRoomDetail:
 *   import StudyRoomCall from '@/components/study-room/StudyRoomCall'
 *   <StudyRoomCall roomId={roomId} displayName={profile?.full_name ?? 'Mahasiswa'} />
 *
 * Catatan:
 * - Domain default: meet.jit.si (publik, gratis). Untuk privasi/branding lebih, bisa
 *   self-host Jitsi atau pakai 8x8 JaaS lalu ganti `JITSI_DOMAIN`.
 * - Di iOS Safari, kamera/mic minta izin saat tombol "Gabung" ditekan.
 */

const JITSI_DOMAIN = 'meet.jit.si'

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => {
      dispose: () => void
      addEventListener: (e: string, cb: (...args: unknown[]) => void) => void
      executeCommand: (cmd: string, ...args: unknown[]) => void
    }
  }
}

function loadJitsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) return resolve()
    const existing = document.getElementById('jitsi-external-api')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Gagal memuat Jitsi')))
      return
    }
    const script = document.createElement('script')
    script.id = 'jitsi-external-api'
    script.src = `https://${JITSI_DOMAIN}/external_api.js`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Gagal memuat Jitsi'))
    document.body.appendChild(script)
  })
}

export default function StudyRoomCall({
  roomId,
  displayName = 'Mahasiswa',
}: {
  roomId: string
  displayName?: string
}) {
  const [joined, setJoined] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<ReturnType<NonNullable<Window['JitsiMeetExternalAPI']>['dispose']> | null>(null)
  const apiInstance = useRef<InstanceType<NonNullable<Window['JitsiMeetExternalAPI']>> | null>(null)

  // Nama ruang unik & sulit ditebak (prefix produk + roomId).
  const jitsiRoom = `nexa-campus-study-${roomId}`

  async function join() {
    setLoading(true)
    setError('')
    try {
      await loadJitsiScript()
      if (!window.JitsiMeetExternalAPI || !containerRef.current) {
        throw new Error('Jitsi belum siap')
      }
      setJoined(true)
      // beri waktu container ter-render
      requestAnimationFrame(() => {
        if (!containerRef.current || !window.JitsiMeetExternalAPI) return
        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName: jitsiRoom,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName },
          configOverwrite: {
            prejoinPageEnabled: false,
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            MOBILE_APP_PROMO: false,
            SHOW_JITSI_WATERMARK: false,
          },
        })
        apiInstance.current = api
        api.addEventListener('readyToClose', () => leave())
        setLoading(false)
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memulai panggilan')
      setLoading(false)
      setJoined(false)
    }
  }

  function leave() {
    try {
      apiInstance.current?.dispose()
    } catch { /* ignore */ }
    apiInstance.current = null
    setJoined(false)
    setLoading(false)
  }

  useEffect(() => {
    return () => {
      try {
        apiInstance.current?.dispose()
      } catch { /* ignore */ }
    }
  }, [])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white">
            <Video className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-950">Voice / Video Call</h3>
            <p className="text-xs text-slate-500">Belajar bareng via panggilan grup di room ini</p>
          </div>
        </div>
        {joined && (
          <button
            type="button"
            onClick={leave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-black text-white hover:bg-red-700"
          >
            <PhoneOff className="h-4 w-4" />
            Keluar
          </button>
        )}
      </div>

      {!joined && (
        <button
          type="button"
          onClick={join}
          disabled={loading}
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-black text-white transition hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
          {loading ? 'Menyiapkan...' : 'Gabung Panggilan'}
        </button>
      )}

      {error && (
        <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
      )}

      {/* Container Jitsi */}
      <div
        ref={containerRef}
        className={`mt-3 overflow-hidden rounded-2xl bg-slate-900 ${joined ? 'h-[24rem] sm:h-[30rem]' : 'hidden'}`}
      />

      {!joined && (
        <p className="mt-2 text-[11px] leading-4 text-slate-400">
          Mic & kamera mati saat masuk — aktifkan manual. Di iPhone, izinkan akses kamera/mic ketika diminta.
        </p>
      )}
    </div>
  )
}
