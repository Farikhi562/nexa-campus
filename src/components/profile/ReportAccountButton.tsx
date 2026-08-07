'use client'

import { useState } from 'react'
import { Flag, X } from 'lucide-react'

const REASONS: Array<{ value: string; label: string }> = [
  { value: 'spam', label: 'Spam / promosi berlebihan' },
  { value: 'pelecehan', label: 'Pelecehan / bullying' },
  { value: 'penipuan', label: 'Penipuan' },
  { value: 'konten_tidak_pantas', label: 'Konten tidak pantas' },
  { value: 'akun_palsu', label: 'Akun palsu / menyamar' },
  { value: 'lainnya', label: 'Lainnya' },
]

export default function ReportAccountButton({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [detail, setDetail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit() {
    if (!reason) { setError('Pilih alasan laporan dulu.'); return }
    setBusy(true)
    setError('')
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reported_user_id: userId, reason, detail: detail.trim() || undefined }),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(json.error || 'Gagal mengirim laporan.'); return }
    setDone(true)
  }

  function close() {
    setOpen(false)
    setTimeout(() => { setDone(false); setReason(''); setDetail(''); setError('') }, 200)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
      >
        <Flag className="h-3.5 w-3.5" /> Laporkan
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 sm:items-center sm:p-4" onClick={close}>
          <div
            className="w-full max-w-sm rounded-t-3xl border border-white/80 bg-white p-5 shadow-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            {done ? (
              <div className="py-4 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Flag className="h-6 w-6" />
                </div>
                <p className="text-sm font-black text-slate-950">Laporan terkirim</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">Tim NEXA akan meninjau akun ini secepatnya.</p>
                <button onClick={close} className="mt-4 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-black text-white">Tutup</button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black text-slate-950">Laporkan akun ini</p>
                  <button onClick={close} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
                </div>
                <div className="space-y-1.5">
                  {REASONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setReason(r.value)}
                      className={`flex w-full items-center rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                        reason === r.value ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  placeholder="Detail tambahan (opsional)"
                  rows={2}
                  className="mt-2.5 w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  maxLength={1000}
                />
                {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
                <button
                  onClick={submit}
                  disabled={busy || !reason}
                  className="mt-3 w-full rounded-2xl bg-red-600 py-2.5 text-xs font-black text-white transition hover:bg-red-700 disabled:opacity-40"
                >
                  {busy ? 'Mengirim...' : 'Kirim Laporan'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
