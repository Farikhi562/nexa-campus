'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'

export default function DeleteRoomButton({ roomId, roomTitle }: { roomId: string; roomTitle: string }) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function del() {
    setBusy(true)
    setError('')
    const res = await fetch(`/api/study-rooms/${roomId}`, { method: 'DELETE' })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(json.error || 'Gagal hapus room.'); return }
    window.location.reload()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-slate-500">Hapus &quot;{roomTitle}&quot;?</span>
        <button onClick={del} disabled={busy} className="rounded-xl bg-red-600 px-2.5 py-1.5 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50">
          {busy ? '...' : 'Ya, hapus'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Batal</button>
        {error && <span className="text-xs font-bold text-red-600">{error}</span>}
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-1 rounded-xl bg-red-50 px-2.5 py-1.5 text-xs font-black text-red-700 hover:bg-red-100"
    >
      <Trash2 className="h-3.5 w-3.5" /> Hapus
    </button>
  )
}
