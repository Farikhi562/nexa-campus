'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { ScanLine, X, Loader2 } from 'lucide-react'

/**
 * Scanner QR untuk menambah teman dari kode NEXA orang lain.
 * Dependency: npm i html5-qrcode
 *
 * onFound dipanggil dengan nexaId hasil scan. Parent bisa langsung
 * mengarahkan ke pencarian (mis. set query = nexaId lalu fetch /api/friends/search?q=...).
 *
 * Cara pasang:
 *   <NexaQrScanner onFound={(nexaId) => setSearchQuery(nexaId)} />
 */

function extractNexaId(text: string): string | null {
  // Format 1: URL .../friends?add=123456
  const m = text.match(/[?&]add=(\d{4,8})/)
  if (m) return m[1]
  // Format 2: angka polos (NEXA ID 6 digit)
  const digits = text.trim().match(/^#?(\d{4,8})$/)
  if (digits) return digits[1]
  return null
}

export default function NexaQrScanner({ onFound }: { onFound: (nexaId: string) => void }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const elementId = 'nexa-qr-reader'

  async function start() {
    setOpen(true)
    setError('')
    setStarting(true)
    // tunggu container ter-render
    requestAnimationFrame(async () => {
      try {
        const scanner = new Html5Qrcode(elementId)
        scannerRef.current = scanner
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            const nexaId = extractNexaId(decodedText)
            if (nexaId) {
              stop()
              onFound(nexaId)
            } else {
              setError('QR ini bukan NEXA ID yang valid.')
            }
          },
          () => { /* abaikan error per-frame */ }
        )
        setStarting(false)
      } catch {
        setError('Tidak bisa akses kamera. Pastikan izin kamera diaktifkan.')
        setStarting(false)
      }
    })
  }

  async function stop() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      }
    } catch { /* ignore */ }
    scannerRef.current = null
    setOpen(false)
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [])

  if (!open) {
    return (
      <button
        type="button"
        onClick={start}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-teal-200 bg-white px-4 py-3 text-sm font-black text-teal-700 transition hover:bg-teal-50"
      >
        <ScanLine className="h-4 w-4" />
        Scan QR Teman
      </button>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-black text-slate-950">
          <ScanLine className="h-4 w-4 text-teal-600" /> Arahkan ke QR teman
        </h3>
        <button type="button" onClick={stop} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Tutup">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div id={elementId} className="overflow-hidden rounded-2xl bg-slate-900" />
      {starting && (
        <p className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Menyalakan kamera...
        </p>
      )}
      {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    </div>
  )
}
