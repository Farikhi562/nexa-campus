'use client'

import { useEffect, useState } from 'react'
import { Loader2, Flag, Check, X, Ban } from 'lucide-react'
import type { UserReport } from '@/types'

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  pelecehan: 'Pelecehan',
  penipuan: 'Penipuan',
  konten_tidak_pantas: 'Konten tidak pantas',
  akun_palsu: 'Akun palsu',
  lainnya: 'Lainnya',
}

type ReportRow = UserReport & {
  reporter: { full_name: string | null; email: string } | null
  reported: { id: string; full_name: string | null; email: string; is_banned: boolean | null } | null
}

export default function ReportsPanel() {
  const [reports, setReports] = useState<ReportRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'dismissed'>('pending')
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/reports?status=${filter}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setReports(j.data ?? []))
      .finally(() => setLoading(false))
  }, [filter])

  async function resolve(id: string, status: 'reviewed' | 'dismissed') {
    setBusyId(id)
    await fetch(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setReports((prev) => prev.filter((r) => r.id !== id))
    setBusyId(null)
  }

  async function banReportedUser(userId: string) {
    setBusyId(userId)
    await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ban', reason: 'Dibanned dari hasil peninjauan laporan akun.' }),
    })
    window.location.reload()
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {(['pending', 'reviewed', 'dismissed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-black capitalize transition ${
              filter === s ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>
      ) : reports.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <Flag className="mx-auto h-6 w-6 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">Tidak ada laporan dengan status &quot;{filter}&quot;.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-3xl border border-slate-200 bg-white">
          {reports.map((r) => (
            <div key={r.id} className="flex flex-col gap-2 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {r.reported?.full_name || r.reported?.email || r.reported_user_id.slice(0, 8)}
                    {r.reported?.is_banned && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black text-red-700">Sudah dibanned</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Dilaporkan oleh {r.reporter?.full_name || r.reporter?.email || r.reporter_id.slice(0, 8)} · {new Date(r.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-700">
                  {REASON_LABELS[r.reason] ?? r.reason}
                </span>
              </div>
              {r.detail && <p className="rounded-xl bg-slate-50 p-2.5 text-xs leading-5 text-slate-600">{r.detail}</p>}
              {filter === 'pending' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {!r.reported?.is_banned && (
                    <button
                      onClick={() => banReportedUser(r.reported_user_id)}
                      disabled={busyId === r.reported_user_id}
                      className="flex items-center gap-1 rounded-xl bg-red-50 px-2.5 py-1.5 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      <Ban className="h-3.5 w-3.5" /> Ban akun ini
                    </button>
                  )}
                  <button
                    onClick={() => resolve(r.id, 'reviewed')}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> Sudah ditinjau
                  </button>
                  <button
                    onClick={() => resolve(r.id, 'dismissed')}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1 rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" /> Abaikan
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
