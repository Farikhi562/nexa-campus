'use client'

import { FormEvent, useState } from 'react'
import { Check, ChevronDown, ChevronUp, ListChecks, Loader2, Plus, Trash2 } from 'lucide-react'
import type { DeadlineStatus } from '@/types'

type Subtask = {
  id: string
  title: string
  is_completed: boolean
}

type ProgressPayload = {
  total: number
  completed: number
  progressPercent: number
  status: DeadlineStatus
}

export default function DeadlineSubtasks({
  deadlineId,
  initialProgress = 0,
  onProgressChange,
}: {
  deadlineId: string
  initialProgress?: number
  onProgressChange?: (progress: number, status: DeadlineStatus) => void
}) {
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<Subtask[]>([])
  const [title, setTitle] = useState('')
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(initialProgress)

  function applyProgress(payload?: ProgressPayload) {
    if (!payload) return
    setProgress(payload.progressPercent)
    onProgressChange?.(payload.progressPercent, payload.status)
  }

  async function load() {
    if (loaded || loading) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`/api/deadlines/${deadlineId}/subtasks`, { cache: 'no-store' })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'Checklist gagal dimuat.')
      setItems(result?.data ?? [])
      setLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checklist gagal dimuat.')
    } finally {
      setLoading(false)
    }
  }

  async function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next) await load()
  }

  async function addItem(event: FormEvent) {
    event.preventDefault()
    const clean = title.trim()
    if (!clean || saving) return
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`/api/deadlines/${deadlineId}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: clean }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'Checklist gagal ditambahkan.')
      setItems((current) => [...current, result.data])
      setTitle('')
      applyProgress(result.progress)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checklist gagal ditambahkan.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleItem(item: Subtask) {
    setItems((current) => current.map((row) => row.id === item.id ? { ...row, is_completed: !row.is_completed } : row))
    try {
      const response = await fetch(`/api/deadlines/${deadlineId}/subtasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtaskId: item.id, isCompleted: !item.is_completed }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'Checklist gagal diperbarui.')
      applyProgress(result.progress)
    } catch (err) {
      setItems((current) => current.map((row) => row.id === item.id ? item : row))
      setError(err instanceof Error ? err.message : 'Checklist gagal diperbarui.')
    }
  }

  async function removeItem(id: string) {
    const previous = items
    setItems((current) => current.filter((row) => row.id !== id))
    try {
      const response = await fetch(`/api/deadlines/${deadlineId}/subtasks`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtaskId: id }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.error || 'Checklist gagal dihapus.')
      applyProgress(result.progress)
    } catch (err) {
      setItems(previous)
      setError(err instanceof Error ? err.message : 'Checklist gagal dihapus.')
    }
  }

  const completed = items.filter((item) => item.is_completed).length

  return (
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
      <button type="button" onClick={() => void toggleOpen()} className="flex w-full items-center gap-3 text-left">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
          <ListChecks className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-wide text-slate-600">Progress tugas</p>
            <span className="text-xs font-black text-slate-950">{progress}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>

      {open && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          {loading ? (
            <div className="flex items-center gap-2 py-3 text-xs font-bold text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Memuat checklist...</div>
          ) : (
            <>
              {items.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 shadow-sm">
                      <button
                        type="button"
                        onClick={() => void toggleItem(item)}
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border ${item.is_completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent'}`}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <span className={`min-w-0 flex-1 text-sm font-bold ${item.is_completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{item.title}</span>
                      <button type="button" onClick={() => void removeItem(item.id)} className="rounded-lg p-1 text-slate-300 hover:bg-red-50 hover:text-red-500" aria-label="Hapus checklist">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <p className="px-1 text-[11px] font-bold text-slate-400">{completed}/{items.length} langkah selesai</p>
                </div>
              )}

              <form onSubmit={addItem} className="flex gap-2">
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={160}
                  placeholder="Tambah langkah kecil..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
                <button type="submit" disabled={saving || !title.trim()} className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white disabled:opacity-40">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </button>
              </form>
              {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}
