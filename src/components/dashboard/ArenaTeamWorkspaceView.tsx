'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { CheckCircle2, ChevronLeft, Loader2, Save, ShieldCheck, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import FounderVerifiedBadge from '@/components/FounderVerifiedBadge'

type Member = { user_id: string; role: string; joined_at: string; profile?: { full_name: string | null; avatar_url: string | null; nexa_id: string | null; founder_verified?: boolean | null } | null }
type Workspace = { owner_task: string | null; team_status: string | null; checklist: Array<{ id: string; text: string; done: boolean }> }
type Post = { id: string; title: string; creator_id: string; status: string; current_team_size: number; team_size_max: number; team_members?: Member[] }

const emptyWorkspace: Workspace = { owner_task: '', team_status: 'ready', checklist: [] }
const TEAM_STATUS = {
  ready: { label: 'Ready', copy: 'Tim siap jalan.', tone: 'success' as const },
  busy: { label: 'Sibuk', copy: 'Ada banyak yang sedang dikerjakan.', tone: 'warning' as const },
  needs_help: { label: 'Butuh bantuan', copy: 'Tim perlu support tambahan.', tone: 'danger' as const },
}
const CHECKLIST_TEMPLATES = [
  'Baca rulebook lomba',
  'Bagi role anggota',
  'Kumpulkan referensi solusi',
  'Buat draft proposal / pitch',
  'Cek deadline pendaftaran',
]

function initials(name?: string | null) { return (name || 'N').slice(0, 1).toUpperCase() }

export default function ArenaTeamWorkspaceView({ postId, userId }: { postId: string; userId: string }) {
  const [post, setPost] = useState<Post | null>(null)
  const [workspace, setWorkspace] = useState<Workspace>(emptyWorkspace)
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/arena/${postId}/workspace`, { cache: 'no-store' })
    const json = await res.json().catch(() => ({}))
    if (res.ok) {
      setPost(json.post)
      setWorkspace({ ...emptyWorkspace, ...(json.workspace ?? {}) })
    }
    setLoading(false)
  }, [postId])

  useEffect(() => { void load() }, [load])

  const isCreator = post?.creator_id === userId
  const isMember = Boolean(post?.team_members?.some((member) => member.user_id === userId))

  async function save(next = workspace) {
    setSaving(true)
    const res = await fetch(`/api/arena/${postId}/workspace`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next),
    })
    const json = await res.json().catch(() => ({}))
    if (res.ok) setWorkspace({ ...emptyWorkspace, ...(json.workspace ?? next) })
    else alert(json.error ?? 'Workspace gagal disimpan.')
    setSaving(false)
  }

  function addChecklist() {
    const text = newTask.trim()
    if (!text) return
    const next = { ...workspace, checklist: [...(workspace.checklist ?? []), { id: crypto.randomUUID(), text, done: false }] }
    setWorkspace(next); setNewTask('')
    if (isCreator) void save(next)
  }

  function toggle(id: string) {
    const next = { ...workspace, checklist: (workspace.checklist ?? []).map((task) => task.id === id ? { ...task, done: !task.done } : task) }
    setWorkspace(next)
    if (isCreator) void save(next)
  }

  function applyTemplate() {
    const existing = new Set((workspace.checklist ?? []).map((task) => task.text.toLowerCase()))
    const additions = CHECKLIST_TEMPLATES
      .filter((text) => !existing.has(text.toLowerCase()))
      .map((text) => ({ id: crypto.randomUUID(), text, done: false }))
    if (additions.length === 0) return
    const next = { ...workspace, checklist: [...(workspace.checklist ?? []), ...additions] }
    setWorkspace(next)
    if (isCreator) void save(next)
  }

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (!post || !isMember) return (
    <Card><CardContent className="p-8 text-center"><p className="font-black text-slate-950">Workspace hanya untuk anggota tim yang approved.</p><Link className="mt-3 inline-flex text-sm font-black text-teal-700 underline" href="/dashboard/arena">Balik ke Arena</Link></CardContent></Card>
  )

  const done = (workspace.checklist ?? []).filter((item) => item.done).length
  const total = (workspace.checklist ?? []).length

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <Link href="/dashboard/arena" className="mb-4 inline-flex items-center gap-2 text-sm font-black text-teal-200 hover:underline"><ChevronLeft className="h-4 w-4" /> Arena</Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-100"><ShieldCheck className="h-3.5 w-3.5" /> Team Workspace</div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{post.title}</h1>
            <p className="mt-2 text-sm text-slate-300">Setelah applicant diterima, kerja tim mulai di sini. Tidak berhenti di tombol approve yang sok heroik.</p>
          </div>
          <Badge tone={post.status === 'full' ? 'warning' : 'success'}>{post.current_team_size}/{post.team_size_max} anggota</Badge>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="font-black text-slate-950">Task awal owner</h2><p className="text-sm text-slate-500">Owner bisa memberi arahan awal supaya kerja tim lebih jelas.</p></div>
              {isCreator && <Button onClick={() => save()} disabled={saving} className="rounded-2xl"><Save className="h-4 w-4" /> Simpan</Button>}
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-500">Status tim</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {TEAM_STATUS[(workspace.team_status ?? 'ready') as keyof typeof TEAM_STATUS]?.copy ?? 'Tim siap jalan.'}
                  </p>
                </div>
                {isCreator ? (
                  <select
                    value={workspace.team_status ?? 'ready'}
                    onChange={(e) => setWorkspace({ ...workspace, team_status: e.target.value })}
                    className="focus-ring rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-700"
                  >
                    {Object.entries(TEAM_STATUS).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}
                  </select>
                ) : (
                  <Badge tone={TEAM_STATUS[(workspace.team_status ?? 'ready') as keyof typeof TEAM_STATUS]?.tone ?? 'success'}>
                    {TEAM_STATUS[(workspace.team_status ?? 'ready') as keyof typeof TEAM_STATUS]?.label ?? 'Ready'}
                  </Badge>
                )}
              </div>
            </div>

            {isCreator ? <textarea value={workspace.owner_task ?? ''} onChange={(e) => setWorkspace({ ...workspace, owner_task: e.target.value })} rows={5} className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm" placeholder="Contoh: Riset lomba, bagi role, bikin proposal awal..." /> : <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{workspace.owner_task || 'Owner belum menulis task awal.'}</p>}

            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-black text-slate-950">Checklist project</h3>
                  <p className="text-xs leading-5 text-slate-500">Biar progress tim nggak cuma hidup di chat.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={done === total && total > 0 ? 'success' : 'neutral'}>{done}/{total}</Badge>
                  {isCreator && <button onClick={applyTemplate} className="rounded-2xl bg-white px-3 py-1.5 text-xs font-black text-teal-700 ring-1 ring-teal-100 hover:bg-teal-50">Pakai template</button>}
                </div>
              </div>
              <div className="space-y-2">
                {(workspace.checklist ?? []).map((task) => (
                  <button key={task.id} disabled={!isCreator} onClick={() => toggle(task.id)} className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left text-sm hover:bg-teal-50 disabled:cursor-default">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-lg border ${task.done ? 'border-teal-400 bg-teal-400 text-white' : 'border-slate-300'}`}>{task.done && <CheckCircle2 className="h-3.5 w-3.5" />}</span>
                    <span className={task.done ? 'text-slate-400 line-through' : 'text-slate-700'}>{task.text}</span>
                  </button>
                ))}
              </div>
              {isCreator && <div className="mt-3 flex gap-2"><input value={newTask} onChange={(e) => setNewTask(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addChecklist() }} className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-2 text-sm" placeholder="Tambah task..." /><Button onClick={addChecklist} className="rounded-2xl">Tambah</Button></div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-5">
            <h2 className="mb-3 flex items-center gap-2 font-black text-slate-950"><Users className="h-4 w-4" /> Tim approved</h2>
            <div className="space-y-2">
              {(post.team_members ?? []).map((member) => (
                <div key={member.user_id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                  <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-white text-sm font-black text-slate-600">
                    {member.profile?.avatar_url ? <img src={member.profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initials(member.profile?.full_name)}
                  </span>
                  <div className="min-w-0"><p className="flex items-center gap-1 truncate text-sm font-black text-slate-950"><span className="truncate">{member.profile?.full_name || 'Member'}</span><FounderVerifiedBadge founderVerified={member.profile?.founder_verified} compact /></p><p className="text-xs font-bold text-slate-500">{member.role}{member.profile?.nexa_id ? ` · #${member.profile.nexa_id}` : ''}</p></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
