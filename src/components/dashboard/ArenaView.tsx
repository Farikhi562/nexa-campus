'use client'

import { useCallback, useEffect, useState } from 'react'
import { Filter, Loader2, Plus, Search, Sword, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

type ArenaPost = {
  id: string; creator_id: string; title: string; competition_name: string | null
  competition_type: string; description: string | null; skills_needed: string[]
  team_size_max: number; current_team_size: number; status: string
  deadline_registration: string | null; prize: string | null
  creator_name?: string | null; has_applied?: boolean
}

const TYPES = ['semua','hackathon','bisnis','saintek','desain','akademik','seni','esport','olahraga','lainnya']
const TYPE_EMOJI: Record<string, string> = {
  hackathon:'💻', bisnis:'📊', saintek:'🔬', desain:'🎨',
  akademik:'📚', seni:'🎭', esport:'🎮', olahraga:'⚽', lainnya:'🏆',
}

export default function ArenaView({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<ArenaPost[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [type, setType] = useState('semua')
  const [showCreate, setShowCreate] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (type !== 'semua') params.set('type', type)
      const res = await fetch(`/api/arena?${params}`, { cache: 'no-store' })
      const json = await res.json()
      setPosts(res.ok ? (json.data ?? []) : [])
    } catch { setPosts([]) }
    setLoading(false)
  }, [q, type])

  useEffect(() => { void load() }, [load])

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.28),transparent_20rem)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-100">
              <Sword className="h-3.5 w-3.5" /> NEXA Arena
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Cari tim lomba. Menang bareng.</h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
              Hackathon, kompetisi bisnis, saintek, esport — temukan rekan tim dengan skill yang kamu butuhkan.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="flex-shrink-0 rounded-2xl bg-amber-400 text-slate-950 hover:bg-amber-300">
            <Plus className="h-4 w-4" /> Cari Tim
          </Button>
        </div>
      </section>

      {/* Filter type */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPES.map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-shrink-0 rounded-2xl px-3 py-2 text-xs font-black capitalize transition ${type===t ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
            {t !== 'semua' && TYPE_EMOJI[t]} {t === 'semua' ? 'Semua' : t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cari kompetisi atau skill..." className="focus-ring w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm" />
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex justify-center p-10 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : posts.length === 0 ? (
        <Card><CardContent className="p-10 text-center">
          <Sword className="mx-auto mb-3 h-10 w-10 text-slate-200" />
          <p className="font-black text-slate-950">Belum ada postingan cari tim.</p>
          <p className="mt-1 text-sm text-slate-500">Jadilah yang pertama cari tim untuk kompetisi!</p>
          <Button onClick={() => setShowCreate(true)} className="mt-4 rounded-2xl">Buat Postingan</Button>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map(post => (
            <Card key={post.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg">{TYPE_EMOJI[post.competition_type] ?? '🏆'}</span>
                  <Badge tone={post.status==='open'?'success':'neutral'}>
                    {post.status==='open'?'Buka':'Tertutup'}
                  </Badge>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold capitalize text-slate-600">{post.competition_type}</span>
                </div>
                <h3 className="mt-2 text-base font-black text-slate-950 line-clamp-1">{post.title}</h3>
                {post.competition_name && <p className="text-xs font-bold text-teal-700">{post.competition_name}</p>}
                {post.description && <p className="mt-1 text-sm leading-5 text-slate-500 line-clamp-2">{post.description}</p>}
                {post.skills_needed.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {post.skills_needed.slice(0,4).map(s => (
                      <span key={s} className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700">{s}</span>
                    ))}
                    {post.skills_needed.length > 4 && <span className="text-[11px] text-slate-400">+{post.skills_needed.length-4}</span>}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{post.current_team_size}/{post.team_size_max} anggota</span>
                  {post.prize && <span className="text-amber-600">🏆 {post.prize}</span>}
                  {post.deadline_registration && <span>📅 {new Date(post.deadline_registration).toLocaleDateString('id-ID',{day:'numeric',month:'short'})}</span>}
                </div>
                {post.creator_name && <p className="mt-2 text-xs text-slate-400">oleh <span className="font-bold text-slate-600">{post.creator_name}</span></p>}
                <div className="mt-4">
                  {post.creator_id === userId ? (
                    <span className="inline-flex items-center rounded-2xl bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">👑 Postingan kamu</span>
                  ) : post.has_applied ? (
                    <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600">⏳ Sudah melamar</span>
                  ) : (
                    <Button onClick={async () => {
                      const res = await fetch(`/api/arena/${post.id}/apply`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({message: ''}) })
                      if (res.ok) { void load() } else { const j = await res.json(); alert(j.error ?? 'Gagal melamar.') }
                    }} disabled={post.status !== 'open'} className="w-full rounded-2xl text-sm">
                      {post.status === 'open' ? '⚔️ Lamar Bergabung' : 'Ditutup'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showCreate && <CreateArenaModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); void load() }} />}
    </div>
  )
}

function CreateArenaModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [form, setForm] = useState({ title:'', competition_name:'', competition_type:'hackathon', description:'', skills_needed:[] as string[], team_size_max:'4', deadline_registration:'', prize:'', link_info:'' })
  const set = (k: keyof typeof form, v: unknown) => setForm(p => ({ ...p, [k]: v }))

  function addSkill() {
    const s = skillInput.trim()
    if (s && !form.skills_needed.includes(s)) {
      set('skills_needed', [...form.skills_needed, s])
      setSkillInput('')
    }
  }

  async function submit() {
    if (!form.title.trim()) return
    setLoading(true)
    const res = await fetch('/api/arena', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, team_size_max: Number(form.team_size_max) }) })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { alert(json.error ?? 'Gagal.'); return }
    onCreated()
  }

  const input = 'focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm'
  const label = 'mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600'

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="mb-4 text-lg font-black text-slate-950">Cari Tim Lomba</h2>
        <div className="space-y-4">
          <div><label className={label}>Judul Post *</label><input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Cth: Cari Tim Hackathon COMPFEST 2025" className={input} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={label}>Nama Kompetisi</label><input value={form.competition_name} onChange={e=>set('competition_name',e.target.value)} placeholder="COMPFEST 17" className={input} /></div>
            <div><label className={label}>Tipe</label>
              <select value={form.competition_type} onChange={e=>set('competition_type',e.target.value)} className={input}>
                {TYPES.slice(1).map(t=><option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
          </div>
          <div><label className={label}>Deskripsi</label><textarea value={form.description} onChange={e=>set('description',e.target.value)} rows={3} className={input} placeholder="Ceritain lomba dan role yang kamu cari..." /></div>
          <div>
            <label className={label}>Skill yang dibutuhkan</label>
            <div className="flex gap-2">
              <input value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();addSkill()}}} placeholder="Cth: React, Python, UI/UX..." className={`${input} flex-1`} />
              <button onClick={addSkill} className="rounded-2xl bg-teal-500 px-3 py-2 text-sm font-black text-white hover:bg-teal-400">+</button>
            </div>
            {form.skills_needed.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.skills_needed.map(s=>(
                  <span key={s} className="flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                    {s}
                    <button onClick={()=>set('skills_needed', form.skills_needed.filter(x=>x!==s))} className="text-teal-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={label}>Maks anggota tim</label><input type="number" min="2" max="20" value={form.team_size_max} onChange={e=>set('team_size_max',e.target.value)} className={input} /></div>
            <div><label className={label}>Deadline Daftar</label><input type="date" value={form.deadline_registration} onChange={e=>set('deadline_registration',e.target.value)} className={input} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={label}>Hadiah / Benefit</label><input value={form.prize} onChange={e=>set('prize',e.target.value)} placeholder="Cth: Rp5jt + sertifikat" className={input} /></div>
            <div><label className={label}>Link info</label><input type="url" value={form.link_info} onChange={e=>set('link_info',e.target.value)} placeholder="https://..." className={input} /></div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Button onClick={submit} disabled={loading} className="flex-1 rounded-2xl">{loading?'Memposting...':'Post Cari Tim'}</Button>
          <Button onClick={onClose} variant="outline" className="rounded-2xl">Batal</Button>
        </div>
      </div>
    </div>
  )
}
