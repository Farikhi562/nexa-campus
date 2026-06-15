'use client'

import { useState } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Copy, Check, QrCode } from 'lucide-react'

/**
 * Kartu "NEXA ID + QR kamu" untuk dibagikan ke teman.
 * Dependency: npm i qrcode.react
 *
 * Cara pasang di halaman Friends:
 *   <MyNexaQrCard nexaId={profile.nexa_id} fullName={profile.full_name} />
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
  const [copied, setCopied] = useState(false)

  if (!nexaId) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
        NEXA ID kamu belum tersedia. Lengkapi profil dulu ya.
      </div>
    )
  }

  // Link tambah teman berbasis NEXA ID. Halaman Friends membaca ?add=<nexaId> (lihat catatan).
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  const addLink = `${origin}/dashboard/friends?add=${nexaId}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(nexaId!)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  return (
    <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/40 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
        <QrCode className="h-4 w-4 text-teal-600" /> NEXA ID kamu
      </h3>
      <div className="flex items-center gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-2.5">
          <QRCodeCanvas value={addLink} size={112} bgColor="#ffffff" fgColor="#0f172a" level="M" includeMargin={false} />
        </div>
        <div className="min-w-0">
          {fullName && <p className="truncate text-sm font-black text-slate-950">{fullName}</p>}
          <p className="mt-0.5 text-2xl font-black tracking-widest text-teal-700">#{nexaId}</p>
          <button
            type="button"
            onClick={copy}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? 'Tersalin' : 'Salin ID'}
          </button>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-4 text-slate-400">
        Tunjukkan QR ini ke teman untuk discan, atau bagikan NEXA ID-mu biar mereka bisa cari kamu.
      </p>
    </div>
  )
}
