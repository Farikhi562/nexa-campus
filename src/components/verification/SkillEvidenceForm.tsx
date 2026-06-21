'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react'
import { EVIDENCE_TYPES } from '@/lib/verification/role-config'

type Evidence = {
  id: string
  skill_name: string
  evidence_type: string
  evidence_url: string | null
  file_url: string | null
  description: string | null
}

/**
 * Form kelola bukti skill (skill evidence) milik user. Pasang di halaman
 * settings/profile, biasanya di atas/dekat VerificationProgressCard karena
 * evidence adalah salah satu syarat verifikasi.
 */
export default function SkillEvidenceForm() {
  const [items, setItems] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(true)
  const [skillName, setSkillName] = useState('')
  const [evidenceType, setEvidenceType] = useState('github')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    const res = await fetch('/api/skill-evidence', { cache: 'no-store' })
    const json = await res.json().catch(() => ({}))
    setItems(res.ok ? (json.data ?? []) : [])
    setLoading(false)
  }

  useEffect(() => { void load() }, [])

  async function submit() {
    setError('')
    if (!skillName.trim()) { setError('Nama skill wajib diisi.'); return }
    if (!evidenceUrl.trim()) { setError('Link evidence wajib diisi.'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/skill-evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill_name: skillName.trim(),
          evidence_type: evidenceType,
          evidence_url: evidenceUrl.trim(),
          description: description.trim() || undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Gagal menambah evidence.')
        return
      }
      setSkillName('')
      setEvidenceUrl('')
      setDescription('')
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  async function remove(id: string) {
    await fetch(`/api/skill-evidence?id=${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const input = 'focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm'

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5">
      <h3 className="mb-1 text-sm font-black text-slate-950">Bukti Skill (Evidence)</h3>
      <p className="mb-4 text-xs leading-5 text-slate-500">
        Lampirkan link GitHub, portfolio, sertifikat, atau hasil kerja lain. Ini yang dilihat owner lomba dan jadi
        salah satu syarat verifikasi akun.
      </p>

      <div className="grid gap-2 sm:grid-cols-2">
        <input value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="Nama skill, mis. React" className={input} />
        <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)} className={input}>
          {EVIDENCE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <input value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} type="url" placeholder="https://github.com/..." className={`${input} sm:col-span-2`} />
        <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Deskripsi singkat (opsional)" className={`${input} sm:col-span-2`} />
      </div>

      {error && <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-2xl bg-teal-600 px-4 py-2.5 text-xs font-black text-white hover:bg-teal-700 disabled:opacity-50"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Tambah Evidence
      </button>

      <div className="mt-5 space-y-2">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-400">Belum ada evidence. Tambahkan minimal 1 untuk syarat verifikasi.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-950">{item.skill_name}</p>
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{item.evidence_type}</p>
              </div>
              <div className="flex flex-none items-center gap-2">
                {(item.evidence_url || item.file_url) && (
                  <a href={item.evidence_url || item.file_url || '#'} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-teal-700">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
                <button type="button" onClick={() => remove(item.id)} className="text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
