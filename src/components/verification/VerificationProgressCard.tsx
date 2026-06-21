'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Loader2, ShieldCheck } from 'lucide-react'

type Requirement = { key: string; label: string; met: boolean }
type VerificationData = {
  eligible: boolean
  requirements: Requirement[]
  isNexaVerified: boolean
  verification: { status: string; review_notes: string | null } | null
}

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  unverified: { label: 'Belum diajukan', tone: 'bg-slate-100 text-slate-600' },
  pending_review: { label: 'Sedang direview', tone: 'bg-amber-50 text-amber-700' },
  verified: { label: 'Terverifikasi', tone: 'bg-blue-50 text-blue-700' },
  rejected: { label: 'Belum disetujui', tone: 'bg-red-50 text-red-700' },
}

/**
 * Kartu progress verifikasi akun ("Verified by NEXA"). Pasang di halaman
 * settings/profile. Menampilkan checklist syarat + tombol ajukan kalau semua
 * syarat sudah terpenuhi.
 */
export default function VerificationProgressCard() {
  const [data, setData] = useState<VerificationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/verification/request', { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (res.ok && json) setData(json)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  async function requestVerification() {
    setSubmitting(true)
    setMessage(null)
    try {
      const res = await fetch('/api/verification/request', { method: 'POST' })
      const json = await res.json().catch(() => null)
      if (!res.ok) {
        setMessage({ type: 'err', text: json?.error || 'Gagal mengajukan verifikasi.' })
        return
      }
      setMessage({ type: 'ok', text: 'Permintaan verifikasi terkirim! Tunggu review dari tim NEXA.' })
      await load()
    } catch {
      setMessage({ type: 'err', text: 'Koneksi bermasalah. Coba lagi.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-8">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!data) return null

  if (data.isNexaVerified) {
    return (
      <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-black text-slate-950">Akun kamu sudah Verified by NEXA</h3>
        </div>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Centang biru sudah aktif di profil publikmu. Owner lomba di NEXA Arena bisa lihat ini sebagai sinyal kepercayaan.
        </p>
      </div>
    )
  }

  const status = data.verification?.status ?? 'unverified'
  const statusCopy = STATUS_COPY[status] ?? STATUS_COPY.unverified

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-black text-slate-950">
          <ShieldCheck className="h-4 w-4 text-blue-600" /> Verifikasi Akun
        </h3>
        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${statusCopy.tone}`}>{statusCopy.label}</span>
      </div>

      <p className="mb-3 text-xs leading-5 text-slate-500">
        Centang biru bukan hiasan — tanda kamu sudah membuktikan kompetensi lewat profil, evidence, dan lamaran Arena yang lengkap.
      </p>

      <div className="space-y-2">
        {data.requirements.map((req) => (
          <div key={req.key} className="flex items-center gap-2 text-sm">
            {req.met ? (
              <CheckCircle2 className="h-4 w-4 flex-none text-emerald-600" />
            ) : (
              <Circle className="h-4 w-4 flex-none text-slate-300" />
            )}
            <span className={req.met ? 'text-slate-700' : 'text-slate-400'}>{req.label}</span>
          </div>
        ))}
      </div>

      {status === 'rejected' && data.verification?.review_notes && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          <span className="font-black">Catatan reviewer:</span> {data.verification.review_notes}
        </p>
      )}

      {status !== 'pending_review' && (
        <button
          type="button"
          onClick={requestVerification}
          disabled={!data.eligible || submitting}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-40 sm:w-auto"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {status === 'rejected' ? 'Ajukan Ulang' : 'Ajukan Verifikasi'}
        </button>
      )}

      {status === 'pending_review' && (
        <p className="mt-4 text-xs font-bold text-amber-700">Permintaanmu sedang direview tim NEXA. Biasanya butuh beberapa hari.</p>
      )}

      {message && (
        <p className={`mt-3 rounded-xl px-3 py-2 text-xs leading-5 ${message.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </p>
      )}
    </div>
  )
}
