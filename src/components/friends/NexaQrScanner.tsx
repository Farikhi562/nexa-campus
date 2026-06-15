'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, ScanLine, X } from 'lucide-react'

type DetectedBarcode = { rawValue?: string }
type BarcodeDetectorInstance = { detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]> }
type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorInstance
type WindowWithBarcodeDetector = Window & typeof globalThis & { BarcodeDetector?: BarcodeDetectorConstructor }

function extractNexaId(text: string): string | null {
  const urlMatch = text.match(/[?&]add=(\d{4,8})/)
  if (urlMatch) return urlMatch[1]

  const digits = text.trim().match(/^#?(\d{4,8})$/)
  if (digits) return digits[1]

  return null
}

export default function NexaQrScanner({ onFound }: { onFound: (nexaId: string) => void }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [manualId, setManualId] = useState('')
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<number | null>(null)

  async function stop() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setOpen(false)
    setStarting(false)
  }

  async function start() {
    setOpen(true)
    setError('')
    setStarting(true)

    window.setTimeout(async () => {
      try {
        const BarcodeDetector = (window as WindowWithBarcodeDetector).BarcodeDetector
        if (!BarcodeDetector) {
          setError('Browser ini belum support scan QR otomatis. Masukin NEXA ID manual dulu, jangan gelut sama Chrome-nya.')
          setStarting(false)
          return
        }

        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        streamRef.current = stream

        const video = videoRef.current
        if (!video) throw new Error('Video scanner belum siap.')
        video.srcObject = stream
        await video.play()

        const detector = new BarcodeDetector({ formats: ['qr_code'] })
        setStarting(false)

        timerRef.current = window.setInterval(async () => {
          const canvas = canvasRef.current
          const videoEl = videoRef.current
          if (!canvas || !videoEl || videoEl.readyState < 2) return

          canvas.width = videoEl.videoWidth
          canvas.height = videoEl.videoHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) return

          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
          const codes = await detector.detect(canvas).catch(() => [])
          const found = codes.map((code) => extractNexaId(code.rawValue ?? '')).find(Boolean)
          if (found) {
            await stop()
            onFound(found)
          }
        }, 500)
      } catch {
        setError('Tidak bisa akses kamera. Allow permission dulu, jangan berharap QR kebaca lewat aura.')
        setStarting(false)
      }
    }, 50)
  }

  function submitManual() {
    const found = extractNexaId(manualId)
    if (!found) {
      setError('NEXA ID harus angka 4-8 digit. Jangan masukin pantun, sistemnya bukan anak sastra.')
      return
    }
    void stop()
    onFound(found)
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  if (!open) {
    return (
      <button
        type="button"
        onClick={start}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-teal-200 bg-white px-4 py-3 text-sm font-black text-teal-700 shadow-sm transition hover:bg-teal-50 sm:w-auto"
      >
        <ScanLine className="h-4 w-4" />
        Scan QR Teman
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-black text-slate-950">
          <ScanLine className="h-4 w-4 text-teal-600" /> Scan QR teman
        </h3>
        <button type="button" onClick={() => void stop()} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Tutup">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-slate-950">
        <video ref={videoRef} muted playsInline className="aspect-video w-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {starting ? (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyalakan kamera...
        </p>
      ) : null}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={manualId}
          onChange={(event) => setManualId(event.target.value)}
          placeholder="Atau ketik NEXA ID manual"
          className="focus-ring min-w-0 flex-1 rounded-2xl border border-slate-200 px-3 py-2 text-sm"
        />
        <button type="button" onClick={submitManual} className="rounded-2xl bg-teal-500 px-4 py-2 text-sm font-black text-slate-950 hover:bg-teal-400 sm:w-auto">
          Cari
        </button>
      </div>

      {error ? <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
    </div>
  )
}
