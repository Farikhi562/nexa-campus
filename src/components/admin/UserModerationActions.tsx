'use client'

import { useState } from 'react'
import { Ban, ShieldCheck } from 'lucide-react'
import type { Plan } from '@/types'

const PLAN_OPTIONS: Array<{ value: Plan; label: string }> = [
  { value: 'radar', label: 'NEXA Radar' },
  { value: 'pulse', label: 'NEXA Pulse' },
  { value: 'command', label: 'NEXA Command' },
]

export default function UserModerationActions({
  userId,
  plan,
  isBanned,
}: {
  userId: string
  plan: Plan
  isBanned: boolean
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showBanPrompt, setShowBanPrompt] = useState(false)
  const [reason, setReason] = useState('')

  async function call(body: Record<string, unknown>) {
    setBusy(true)
    setError('')
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(json.error || 'Gagal memproses.'); return }
    window.location.reload()
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        defaultValue={plan}
        disabled={busy}
        onChange={(e) => call({ action: 'set_plan', plan: e.target.value })}
        className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 disabled:opacity-50"
        title="Ubah plan user"
      >
        {PLAN_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {isBanned ? (
        <button
          onClick={() => call({ action: 'unban' })}
          disabled={busy}
          className="flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1.5 text-xs font-black text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
        >
          <ShieldCheck className="h-3.5 w-3.5" /> Unban
        </button>
      ) : showBanPrompt ? (
        <div className="flex items-center gap-1.5">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Alasan ban (opsional)"
            className="w-40 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs"
          />
          <button
            onClick={() => call({ action: 'ban', reason })}
            disabled={busy}
            className="rounded-xl bg-red-600 px-2.5 py-1.5 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? '...' : 'Ban'}
          </button>
          <button onClick={() => setShowBanPrompt(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Batal</button>
        </div>
      ) : (
        <button
          onClick={() => setShowBanPrompt(true)}
          disabled={busy}
          className="flex items-center gap-1 rounded-xl bg-red-50 px-2.5 py-1.5 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-50"
        >
          <Ban className="h-3.5 w-3.5" /> Ban
        </button>
      )}
      {error && <p className="w-full text-xs font-bold text-red-600">{error}</p>}
    </div>
  )
}
