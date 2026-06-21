'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ExternalLink, Loader2, ShieldCheck, X } from 'lucide-react'

type VerificationRow = {
  id: string
  user_id: string
  status: string
  score: number
  review_notes: string | null
  created_at: string
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    campus_name: string | null
    major: string | null
    semester: number | null
    nexa_id: string | null
    profile_skills: string[] | null
    portfolio_url: string | null
    github_url: string | null
  } | null
}

const STATUS_TABS = [
  { value: 'pending_review', label: 'Menunggu Review' },
  { value: 'verified', label: 'Terverifikasi' },
  { value: 'rejected', label: 'Ditolak' },
  { value: 'all', label: 'Semua' },
]

export default function VerificationReviewPanel() {
  const [tab, setTab] = useState('pending_review')
  const [rows, setRows] = useState<VerificationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/verifications?status=${tab}`, { cache: 'no-store' })
    const json = await res.json().catch(() => ({}))
    setRows(res.ok ? (json.data ?? []) : [])
    setLoading(false)
  }, [tab])

  useEffect(() => { void load() }, [load])

  async function act(row: VerificationRow, action: 'verify' | 'reject') {
    if (action === 'verify') {
      const ok = window.confirm(`Yakin verifikasi "${row.profile?.full_name ?? 'user ini'}"? Centang biru akan langsung aktif di profilnya.`)
      if (!ok) return
    }
    setActionId(row.id)
    const res = await fetch(`/api/admin/verifications/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, review_notes: notes[row.id] ?? '' }),
    })
    const json = await res.json().catch(() => ({}))
    setActionId(null)
    if (!res.ok) {
      alert(json.error ?? 'Gagal memproses.')
      return
    }
    await load()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-black ${tab === t.value ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-10 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
          Tidak ada permintaan di kategori ini.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/dashboard/profile/${row.user_id}`} className="font-black text-slate-950 hover:text-blue-700">
                    {row.profile?.full_name ?? 'Mahasiswa NEXA'}
                  </Link>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[row.profile?.campus_name, row.profile?.major, row.profile?.semester ? `Semester ${row.profile.semester}` : null].filter(Boolean).join(' · ') || 'Profil belum lengkap'}
                  </p>
                  {row.profile?.nexa_id && <p className="text-[10px] font-bold text-slate-400">#{row.profile.nexa_id}</p>}
                </div>
                <span className="flex-none rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-black text-blue-700">Skor: {row.score}/100</span>
              </div>

              {row.profile?.profile_skills && row.profile.profile_skills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {row.profile.profile_skills.map((s) => (
                    <span key={s} className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">{s}</span>
                  ))}
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-3">
                {row.profile?.portfolio_url && (
                  <a href={row.profile.portfolio_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-black text-brand-700 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Portfolio
                  </a>
                )}
                {row.profile?.github_url && (
                  <a href={row.profile.github_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-black text-brand-700 hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                <Link href={`/dashboard/profile/${row.user_id}`} className="inline-flex items-center gap-1 text-xs font-black text-slate-500 hover:underline">
                  Lihat profil & evidence lengkap →
                </Link>
              </div>

              {row.review_notes && (
                <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500">
                  <span className="font-black text-slate-700">Catatan sebelumnya:</span> {row.review_notes}
                </p>
              )}

              {row.status === 'pending_review' && (
                <div className="mt-4 space-y-2">
                  <textarea
                    value={notes[row.id] ?? ''}
                    onChange={(e) => setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    rows={2}
                    placeholder="Catatan review (wajib kalau reject, opsional kalau verify)..."
                    className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => act(row, 'verify')}
                      disabled={actionId === row.id}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {actionId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      Verifikasi
                    </button>
                    <button
                      onClick={() => act(row, 'reject')}
                      disabled={actionId === row.id}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {actionId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      Tolak
                    </button>
                  </div>
                </div>
              )}

              {row.status === 'verified' && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-2xl bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 ring-1 ring-blue-200">
                  <Check className="h-3.5 w-3.5" /> Sudah diverifikasi
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
