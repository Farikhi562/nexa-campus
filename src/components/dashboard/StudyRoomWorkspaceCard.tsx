'use client'

import { useEffect, useState } from 'react'
import { CheckSquare, Link as LinkIcon, Loader2, Pin, Save, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'

type Workspace = {
  pinned_note: string | null
  group_goal: string | null
  material_link: string | null
  next_session_at: string | null
  checklist: Array<{ id: string; text: string; done: boolean }>
}

const emptyWorkspace: Workspace = {
  pinned_note: '', group_goal: '', material_link: '', next_session_at: '', checklist: [],
}

export default function StudyRoomWorkspaceCard({ roomId, canManage }: { roomId: string; canManage: boolean }) {
  const [data, setData] = useState<Workspace>(emptyWorkspace)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTask, setNewTask] = useState('')

  useEffect(() => {
    let active = true
    fetch(`/api/study-rooms/${roomId}/workspace`, { cache: 'no-store' })
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => { if (active) setData(ok ? { ...emptyWorkspace, ...(json.data ?? {}) } : emptyWorkspace) })
      .catch(() => { if (active) setData(emptyWorkspace) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [roomId])

  async function save(next = data) {
    if (!canManage) return
    setSaving(true)
    const res = await fetch(`/api/study-rooms/${roomId}/workspace`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) setData({ ...emptyWorkspace, ...(json.data ?? next) })
    else alert(json.error ?? 'Workspace gagal disimpan.')
    setSaving(false)
  }

  function addTask() {
    const text = newTask.trim()
    if (!text) return
    const next = { ...data, checklist: [...(data.checklist ?? []), { id: crypto.randomUUID(), text, done: false }] }
    setData(next); setNewTask('')
    void save(next)
  }

  function toggleTask(id: string) {
    const next = { ...data, checklist: (data.checklist ?? []).map((item) => item.id === id ? { ...item, done: !item.done } : item) }
    setData(next)
    if (canManage) void save(next)
  }

  if (loading) return <div className="p-4 text-center text-slate-400"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>

  const done = (data.checklist ?? []).filter((item) => item.done).length
  const total = (data.checklist ?? []).length

  return (
    <Card className="m-3 border-teal-100 bg-gradient-to-br from-white to-teal-50/50">
      <CardContent className="p-3">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-teal-700"><Target className="h-3.5 w-3.5" /> Workspace</p>
            <p className="mt-1 text-[11px] leading-5 text-slate-500">Pinned note, target belajar, materi, dan checklist grup.</p>
          </div>
          {canManage && <Button onClick={() => save()} disabled={saving} className="min-h-8 rounded-xl px-2 py-1 text-xs"><Save className="h-3.5 w-3.5" /> Simpan</Button>}
        </div>

        <div className="space-y-2">
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase text-slate-500"><Pin className="h-3 w-3" /> Catatan penting</span>
            {canManage ? <textarea value={data.pinned_note ?? ''} onChange={(e) => setData({ ...data, pinned_note: e.target.value })} rows={2} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs" /> : <p className="rounded-xl bg-white p-2 text-xs text-slate-600">{data.pinned_note || 'Belum ada catatan.'}</p>}
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase text-slate-500"><Target className="h-3 w-3" /> Target grup</span>
            {canManage ? <input value={data.group_goal ?? ''} onChange={(e) => setData({ ...data, group_goal: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs" /> : <p className="rounded-xl bg-white p-2 text-xs text-slate-600">{data.group_goal || 'Belum ada target.'}</p>}
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-[10px] font-black uppercase text-slate-500"><LinkIcon className="h-3 w-3" /> Link materi</span>
            {canManage ? <input value={data.material_link ?? ''} onChange={(e) => setData({ ...data, material_link: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs" /> : data.material_link ? <a className="block rounded-xl bg-white p-2 text-xs font-bold text-teal-700 underline" href={data.material_link} target="_blank" rel="noreferrer">Buka materi</a> : <p className="rounded-xl bg-white p-2 text-xs text-slate-500">Belum ada link.</p>}
          </label>
        </div>

        <div className="mt-3 rounded-2xl bg-white p-2">
          <p className="mb-2 flex items-center gap-1 text-[10px] font-black uppercase text-slate-500"><CheckSquare className="h-3 w-3" /> Checklist {total ? `(${done}/${total})` : ''}</p>
          <div className="space-y-1.5">
            {(data.checklist ?? []).slice(0, 6).map((item) => (
              <button key={item.id} disabled={!canManage} onClick={() => toggleTask(item.id)} className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-xs hover:bg-slate-50 disabled:cursor-default">
                <span className={`h-4 w-4 rounded-md border ${item.done ? 'border-teal-400 bg-teal-400' : 'border-slate-300'}`} />
                <span className={item.done ? 'text-slate-400 line-through' : 'text-slate-700'}>{item.text}</span>
              </button>
            ))}
          </div>
          {canManage && (
            <div className="mt-2 flex gap-1">
              <input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTask() }} placeholder="Tambah checklist..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-2 py-1.5 text-xs" />
              <button onClick={addTask} className="rounded-xl bg-slate-950 px-3 text-xs font-black text-white">+</button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
