'use client'

import { useEffect, useState } from 'react'
import { Mic2, RefreshCw } from 'lucide-react'

type VoiceNote = {
  id: string
  room_id: string
  user_id: string
  file_url: string
  duration_seconds: number | null
  created_at: string
  profiles?: {
    full_name?: string | null
    name?: string | null
    avatar_url?: string | null
    email?: string | null
  } | null
}

type VoiceNoteListProps = {
  roomId: string
  refreshKey?: number
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default function VoiceNoteList({ roomId, refreshKey = 0 }: VoiceNoteListProps) {
  const [items, setItems] = useState<VoiceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/study-room/${roomId}/voice-notes`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Gagal load voice note')
      setItems(Array.isArray(json.voiceNotes) ? json.voiceNotes : [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal load voice note')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, refreshKey])

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-950 dark:text-white">Daftar Voice Note</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Riwayat VN room ini. Ya, sekarang room bisa lebih berisik secara sah.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
          aria-label="Refresh voice notes"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading VN...</p> : null}
      {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 dark:bg-rose-400/10 dark:text-rose-200">{error}</p> : null}

      {!loading && !items.length ? (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-200 p-6 text-center dark:border-white/10">
          <Mic2 className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200">Belum ada voice note.</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Rekam dulu, jangan nunggu VN turun dari langit akademik.</p>
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const profile = item.profiles
          const name = profile?.full_name || profile?.name || profile?.email || 'NEXA Student'
          return (
            <article key={item.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-black text-slate-700 dark:text-slate-200">{name}</span>
                <span>{formatDate(item.created_at)}</span>
              </div>
              <audio controls src={item.file_url} className="w-full" />
            </article>
          )
        })}
      </div>
    </div>
  )
}
