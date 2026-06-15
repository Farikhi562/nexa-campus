'use client'

import { useEffect, useMemo, useState } from 'react'
import { Copy, Check, QrCode, Link as LinkIcon } from 'lucide-react'

/**
 * Kartu "NEXA ID + QR kamu" untuk dibagikan ke teman.
 * Build-safe: tidak butuh package tambahan. QR dibuat via QR Server image URL.
 */
export default function MyNexaQrCard({
  nexaId,
  fullName,
  baseUrl,
}: {
  nexaId: string | null
  fullName?: string | null
  baseUrl?: string
}) {
  const [copied, setCopied] = useState<'id' | 'link' | null>(null)
  const [origin, setOrigin] = useState(baseUrl ?? '')

  useEffect(() => {
    if (!baseUrl && typeof window !== 'undefined') setOrigin(window.location.origin)
  }, [baseUrl])

  const addLink = `${origin || 'https://campus.nexatechlabs.my.id'}/dashboard/friends?add=${encodeURIComponent(nexaId ?? '')}`
  const qrUrl = useMemo(() => {
    const value = encodeURIComponent(addLink)
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${value}`
  }, [addLink])

  if (!nexaId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        NEXA ID kamu belum tersedia. Lengkapi profil dulu ya. QR nggak bisa muncul dari kekosongan, ini bukan sulap murahan.
      </div>
    )
  }

  async function copy(value: string, type: 'id' | 'link') {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(type)
      window.setTimeout(() => setCopied(null), 1500)
    } catch {
      // diam saja, hidup sudah cukup berisik
    }
  }

  return (
    <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/40 p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
        <QrCode className="h-4 w-4 text-teal-600" /> NEXA ID kamu
      </h3>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="w-fit rounded-2xl border border-slate-200 bg-white p-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt={`QR NEXA ID ${nexaId}`}
            width={112}
            height={112}
            className="h-28 w-28 rounded-xl"
          />
        </div>
        <div className="min-w-0 flex-1">
          {fullName ? <p className="truncate text-sm font-black text-slate-950">{fullName}</p> : null}
          <p className="mt-0.5 break-all text-xl font-black tracking-widest text-teal-700 sm:text-2xl">#{nexaId}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy(nexaId, 'id')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              {copied === 'id' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === 'id' ? 'Tersalin' : 'Salin ID'}
            </button>
            <button
              type="button"
              onClick={() => copy(addLink, 'link')}
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-100"
            >
              {copied === 'link' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <LinkIcon className="h-3.5 w-3.5" />}
              Link
            </button>
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-4 text-slate-400">
        Teman bisa scan QR ini, nanti kolom search otomatis keisi NEXA ID kamu. Teknologi sederhana, tapi manusia tetep suka nyasar.
      </p>
    </div>
  )
}
