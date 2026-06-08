'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import {
  Check,
  ExternalLink,
  Eye,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Sword,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { FeaturedBadgePin } from '@/components/BadgeChip'
import { Card, CardContent } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SmartEmptyState from '@/components/dashboard/SmartEmptyState'

type ArenaPost = {
  id: string
  creator_id: string
  title: string
  competition_name: string | null
  competition_type: string
  description: string | null
  skills_needed: string[]
  team_size_max: number
  current_team_size: number
  status: string
  deadline_registration: string | null
  event_date?: string | null
  prize: string | null
  link_info?: string | null
  creator_name?: string | null
  creator_featured_badge?: string | null
  has_applied?: boolean
  my_application_status?: 'pending' | 'accepted' | 'rejected' | null
  pending_applications_count?: number
  applications_count?: number
  team_members?: Array<{
    user_id: string
    role: string
    joined_at: string
    profile?: { id: string; full_name: string | null; avatar_url: string | null; nexa_id: string | null; featured_badge: string | null } | null
  }>
}

type ArenaApplication = {
  id: string
  post_id: string
  applicant_id: string
  message: string | null
  applicant_background: string | null
  portfolio_url: string | null
  skills_offered: string[]
  status: 'pending' | 'accepted' | 'rejected'
  review_note: string | null
  competency_confirmed: boolean | null
  created_at: string
  updated_at: string
  applicant?: {
    id: string
    full_name: string | null
    campus_name: string | null
    major: string | null
    semester: number | null
    avatar_url: string | null
    plan: string | null
    nexa_id: string | null
    featured_badge: string | null
  } | null
}

type ArenaForm = {
  title: string
  competition_name: string
  competition_type: string
  description: string
  skills_needed: string[]
  team_size_max: string
  deadline_registration: string
  prize: string
  link_info: string
}

const TYPES = ['semua', 'hackathon', 'bisnis', 'saintek', 'desain', 'akademik', 'seni', 'esport', 'olahraga', 'lainnya']
const TYPE_EMOJI: Record<string, string> = {
  hackathon: '💻',
  bisnis: '📊',
  saintek: '🔬',
  desain: '🎨',
  akademik: '📚',
  seni: '🎭',
  esport: '🎮',
  olahraga: '⚽',
  lainnya: '🏆',
}

function normalizeSkills(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 12)
}

function formatDate(date: string | null | undefined) {
  if (!date) return null
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function initials(name?: string | null) {
  if (!name) return 'N'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'N'
}

function ProfileAvatar({ url, name }: { url?: string | null; name?: string | null }) {
  return (
    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-sm font-black text-slate-700 ring-1 ring-slate-200">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  )
}

export default function ArenaView({ userId }: { userId: string }) {
  const [posts, setPosts] = useState<ArenaPost[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [type, setType] = useState('semua')
  const [showCreate, setShowCreate] = useState(false)
  const [editPost, setEditPost] = useState<ArenaPost | null>(null)
  const [applyPost, setApplyPost] = useState<ArenaPost | null>(null)
  const [managePost, setManagePost] = useState<ArenaPost | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (type !== 'semua') params.set('type', type)
      const res = await fetch(`/api/arena?${params}`, { cache: 'no-store' })
      const json = await res.json()
      setPosts(res.ok ? (json.data ?? []) : [])
    } catch {
      setPosts([])
    }
    setLoading(false)
  }, [q, type])

  useEffect(() => { void load() }, [load])

  async function deletePost(post: ArenaPost) {
    const ok = window.confirm(`Hapus postingan "${post.title}"? Pelamar di postingan ini ikut hilang. Ya, manusia memang harus dikonfirmasi sebelum menghapus hidup orang lain.`)
    if (!ok) return
    setDeletingId(post.id)
    const res = await fetch(`/api/arena/${post.id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      alert(json.error ?? 'Gagal menghapus postingan.')
      return
    }
    void load()
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.28),transparent_20rem)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-100">
              <Sword className="h-3.5 w-3.5" /> NEXA Arena
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Cari tim lomba. Pilih orang yang beneran kompeten.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Pelamar wajib isi latar belakang, skill, dan portfolio. Owner bisa review dulu, terima kalau yakin, atau tolak kalau belum cocok.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="flex-shrink-0 rounded-2xl bg-amber-400 text-slate-950 hover:bg-amber-300">
            <Plus className="h-4 w-4" /> Cari Tim
          </Button>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {TYPES.map((item) => (
          <button
            key={item}
            onClick={() => setType(item)}
            className={`flex-shrink-0 rounded-2xl px-3 py-2 text-xs font-black capitalize transition ${type === item ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
          >
            {item !== 'semua' && TYPE_EMOJI[item]} {item === 'semua' ? 'Semua' : item}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari kompetisi atau skill..."
          className="focus-ring w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-10 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : posts.length === 0 ? (
        <SmartEmptyState
          kind="arena"
          action={<Button onClick={() => setShowCreate(true)} className="rounded-2xl">Buat Postingan</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {posts.map((post) => {
            const isOwner = post.creator_id === userId
            const pendingCount = post.pending_applications_count ?? 0
            return (
              <Card key={post.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg">{TYPE_EMOJI[post.competition_type] ?? '🏆'}</span>
                    <Badge tone={post.status === 'open' ? 'success' : post.status === 'full' ? 'warning' : 'neutral'}>
                      {post.status === 'open' ? 'Buka' : post.status === 'full' ? 'Penuh' : 'Tertutup'}
                    </Badge>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold capitalize text-slate-600">{post.competition_type}</span>
                  </div>

                  <h3 className="mt-2 line-clamp-1 text-base font-black text-slate-950">{post.title}</h3>
                  {post.competition_name && <p className="text-xs font-bold text-teal-700">{post.competition_name}</p>}
                  {post.description && <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">{post.description}</p>}

                  {post.skills_needed.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {post.skills_needed.slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700">{skill}</span>
                      ))}
                      {post.skills_needed.length > 4 && <span className="text-[11px] text-slate-400">+{post.skills_needed.length - 4}</span>}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{post.current_team_size}/{post.team_size_max} anggota</span>
                    {post.prize && <span className="text-amber-600">🏆 {post.prize}</span>}
                    {post.deadline_registration && <span>📅 {formatDate(post.deadline_registration)}</span>}
                  </div>

                  {post.creator_name && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                      oleh <Link href={`/dashboard/profile/${post.creator_id}`} className="font-bold text-slate-600 hover:text-teal-700">{post.creator_name}</Link>
                      <FeaturedBadgePin badgeId={post.creator_featured_badge} />
                    </p>
                  )}

                  {post.team_members && post.team_members.length > 0 && (
                    <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-2.5">
                      <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-emerald-700">Tim approved</p>
                      <div className="flex flex-wrap gap-2">
                        {post.team_members.slice(0, 5).map((member) => (
                          <Link key={member.user_id} href={`/dashboard/profile/${member.user_id}`} className="inline-flex items-center gap-1.5 rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-700 ring-1 ring-emerald-100 hover:text-emerald-700">
                            <span className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-[9px]">
                              {member.profile?.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={member.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : initials(member.profile?.full_name)}
                            </span>
                            {member.profile?.full_name ?? 'Member'}
                            <FeaturedBadgePin badgeId={member.profile?.featured_badge} />
                          </Link>
                        ))}
                        {post.team_members.length > 5 && <span className="rounded-full bg-white px-2 py-1 text-[11px] font-black text-slate-400 ring-1 ring-emerald-100">+{post.team_members.length - 5}</span>}
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                    {isOwner ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => setManagePost(post)}
                          className="focus-ring flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review pelamar {pendingCount > 0 ? `(${pendingCount} pending)` : ''}
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setEditPost(post)}
                            className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => deletePost(post)}
                            disabled={deletingId === post.id}
                            className="focus-ring inline-flex items-center justify-center gap-1.5 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 hover:bg-red-100 disabled:opacity-60"
                          >
                            {deletingId === post.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : post.has_applied ? (
                      <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600">
                        {post.my_application_status === 'accepted' ? '✅ Diterima' : post.my_application_status === 'rejected' ? '❌ Ditolak' : '⏳ Menunggu review'}
                      </span>
                    ) : (
                      <Button onClick={() => setApplyPost(post)} disabled={post.status !== 'open'} className="w-full rounded-2xl text-sm">
                        {post.status === 'open' ? '⚔️ Lamar Bergabung' : 'Ditutup'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {showCreate && <ArenaPostFormModal onClose={() => setShowCreate(false)} onSaved={() => { setShowCreate(false); void load() }} />}
      {editPost && <ArenaPostFormModal post={editPost} onClose={() => setEditPost(null)} onSaved={() => { setEditPost(null); void load() }} />}
      {applyPost && <ApplyArenaModal post={applyPost} onClose={() => setApplyPost(null)} onApplied={() => { setApplyPost(null); void load() }} />}
      {managePost && <ManageApplicantsModal post={managePost} onClose={() => setManagePost(null)} onChanged={() => void load()} />}
    </div>
  )
}

function ArenaPostFormModal({
  post,
  onClose,
  onSaved,
}: {
  post?: ArenaPost
  onClose: () => void
  onSaved: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [form, setForm] = useState<ArenaForm>({
    title: post?.title ?? '',
    competition_name: post?.competition_name ?? '',
    competition_type: post?.competition_type ?? 'hackathon',
    description: post?.description ?? '',
    skills_needed: normalizeSkills(post?.skills_needed),
    team_size_max: String(post?.team_size_max ?? 4),
    deadline_registration: post?.deadline_registration ?? '',
    prize: post?.prize ?? '',
    link_info: post?.link_info ?? '',
  })

  const isEdit = Boolean(post)
  const set = (key: keyof ArenaForm, value: ArenaForm[keyof ArenaForm]) => setForm((prev) => ({ ...prev, [key]: value }))

  function addSkill() {
    const skill = skillInput.trim()
    if (skill && !form.skills_needed.includes(skill)) {
      setForm((prev) => ({ ...prev, skills_needed: [...prev.skills_needed, skill] }))
      setSkillInput('')
    }
  }

  async function submit() {
    if (!form.title.trim()) return
    setLoading(true)
    const res = await fetch(isEdit ? `/api/arena/${post!.id}` : '/api/arena', {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, team_size_max: Number(form.team_size_max) }),
    })
    const json = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      alert(json.error ?? 'Gagal menyimpan postingan.')
      return
    }
    onSaved()
  }

  const input = 'focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm'
  const label = 'mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600'

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-1 text-lg font-black text-slate-950">{isEdit ? 'Edit Postingan Arena' : 'Cari Tim Lomba'}</h2>
        <p className="mb-4 text-sm leading-6 text-slate-500">
          Tulis kebutuhan tim dengan jelas. Semakin jelas role dan skill-nya, semakin kecil peluang masuk orang modal “gas bang”.
        </p>

        <div className="space-y-4">
          <div>
            <label className={label}>Judul Post *</label>
            <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Cth: Cari Tim Hackathon COMPFEST 2026" className={input} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>Nama Kompetisi</label>
              <input value={form.competition_name} onChange={(e) => set('competition_name', e.target.value)} placeholder="COMPFEST 17" className={input} />
            </div>
            <div>
              <label className={label}>Tipe</label>
              <select value={form.competition_type} onChange={(e) => set('competition_type', e.target.value)} className={input}>
                {TYPES.slice(1).map((item) => <option key={item} value={item} className="capitalize">{item}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={label}>Deskripsi</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={input} placeholder="Ceritain lomba, target, role, dan gaya kerja tim..." />
          </div>
          <div>
            <label className={label}>Skill yang dibutuhkan</label>
            <div className="flex gap-2">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} placeholder="Cth: React, Python, UI/UX..." className={`${input} flex-1`} />
              <button type="button" onClick={addSkill} className="rounded-2xl bg-teal-500 px-3 py-2 text-sm font-black text-white hover:bg-teal-400">+</button>
            </div>
            {form.skills_needed.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.skills_needed.map((skill) => (
                  <span key={skill} className="flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                    {skill}
                    <button type="button" onClick={() => set('skills_needed', form.skills_needed.filter((item) => item !== skill))} className="text-teal-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>Maks anggota tim</label>
              <input type="number" min="2" max="20" value={form.team_size_max} onChange={(e) => set('team_size_max', e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Deadline Daftar</label>
              <input type="date" value={form.deadline_registration} onChange={(e) => set('deadline_registration', e.target.value)} className={input} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={label}>Hadiah / Benefit</label>
              <input value={form.prize} onChange={(e) => set('prize', e.target.value)} placeholder="Cth: Rp5jt + sertifikat" className={input} />
            </div>
            <div>
              <label className={label}>Link info</label>
              <input type="url" value={form.link_info} onChange={(e) => set('link_info', e.target.value)} placeholder="https://..." className={input} />
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <Button onClick={submit} disabled={loading} className="flex-1 rounded-2xl">
            {loading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Post Cari Tim'}
          </Button>
          <Button onClick={onClose} variant="outline" className="rounded-2xl">Batal</Button>
        </div>
      </div>
    </div>
  )
}

function ApplyArenaModal({ post, onClose, onApplied }: { post: ArenaPost; onClose: () => void; onApplied: () => void }) {
  const [loading, setLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [background, setBackground] = useState('')
  const [message, setMessage] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  function addSkill() {
    const skill = skillInput.trim()
    if (skill && !skills.includes(skill)) {
      setSkills((prev) => [...prev, skill])
      setSkillInput('')
    }
  }

  async function submit() {
    if (!background.trim()) {
      alert('Isi latar belakang dulu. Owner perlu tahu kamu siapa, bukan cuma avatar dan harapan.')
      return
    }
    if (skills.length === 0) {
      alert('Minimal isi 1 skill yang kamu tawarkan.')
      return
    }
    setLoading(true)
    const res = await fetch(`/api/arena/${post.id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        applicant_background: background,
        skills_offered: skills,
        portfolio_url: portfolioUrl,
      }),
    })
    const json = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      alert(json.error ?? 'Gagal melamar.')
      return
    }
    onApplied()
  }

  const input = 'focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm'
  const label = 'mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-600'

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-black text-slate-950">Lamar ke tim</h2>
        <p className="mt-1 text-sm font-bold text-teal-700">{post.title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">Isi data yang bisa dinilai owner. Bukan CV sepanjang skripsi, tapi cukup buat kelihatan kamu beneran bisa.</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className={label}>Latar belakang singkat *</label>
            <textarea value={background} onChange={(e) => setBackground(e.target.value)} rows={4} className={input} placeholder="Cth: Mahasiswa Informatika, pernah bikin dashboard React + Supabase, biasa handle frontend dan pitch deck..." />
          </div>
          <div>
            <label className={label}>Skill yang kamu tawarkan *</label>
            <div className="flex gap-2">
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} placeholder="Cth: React, UI/UX, Python..." className={`${input} flex-1`} />
              <button type="button" onClick={addSkill} className="rounded-2xl bg-teal-500 px-3 py-2 text-sm font-black text-white hover:bg-teal-400">+</button>
            </div>
            {skills.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span key={skill} className="flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                    {skill}
                    <button type="button" onClick={() => setSkills((prev) => prev.filter((item) => item !== skill))} className="text-teal-400 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className={label}>Portfolio / GitHub / LinkedIn</label>
            <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://..." className={input} />
          </div>
          <div>
            <label className={label}>Pesan tambahan</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} className={input} placeholder="Kenapa kamu cocok masuk tim ini?" />
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button onClick={submit} disabled={loading} className="flex-1 rounded-2xl">
            {loading ? 'Mengirim...' : 'Kirim Lamaran'}
          </Button>
          <Button onClick={onClose} variant="outline" className="rounded-2xl">Batal</Button>
        </div>
      </div>
    </div>
  )
}

function ManageApplicantsModal({ post, onClose, onChanged }: { post: ArenaPost; onClose: () => void; onChanged: () => void }) {
  const [applications, setApplications] = useState<ArenaApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({})

  const loadApplications = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/arena/${post.id}/applications`, { cache: 'no-store' })
    const json = await res.json().catch(() => ({}))
    setApplications(res.ok ? (json.data ?? []) : [])
    setLoading(false)
  }, [post.id])

  useEffect(() => { void loadApplications() }, [loadApplications])

  const grouped = useMemo(() => ({
    pending: applications.filter((item) => item.status === 'pending'),
    accepted: applications.filter((item) => item.status === 'accepted'),
    rejected: applications.filter((item) => item.status === 'rejected'),
  }), [applications])

  async function respond(application: ArenaApplication, action: 'accept' | 'reject') {
    if (action === 'accept') {
      const ok = window.confirm('Terima pelamar ini hanya kalau kamu sudah cek latar belakang, skill, dan merasa dia beneran kompeten. Konfirmasi?')
      if (!ok) return
    }
    setActionId(application.id)
    const res = await fetch(`/api/arena/${post.id}/applications/${application.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        competency_confirmed: action === 'accept',
        review_note: reviewNote[application.id] ?? '',
      }),
    })
    const json = await res.json().catch(() => ({}))
    setActionId(null)
    if (!res.ok) {
      alert(json.error ?? 'Gagal memproses pelamar.')
      return
    }
    await loadApplications()
    onChanged()
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Review pelamar</h2>
            <p className="mt-1 text-sm font-bold text-teal-700">{post.title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-500">Cek latar belakang dan skill dulu. Tombol terima memang sengaja dibuat serius, karena tim lomba bukan grup random jam kosong.</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center p-10 text-slate-400"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : applications.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Belum ada pelamar. Sabar, manusia berkualitas kadang loading juga.</div>
        ) : (
          <div className="space-y-5">
            <ApplicantSection title="Menunggu Review" items={grouped.pending} actionId={actionId} reviewNote={reviewNote} setReviewNote={setReviewNote} onRespond={respond} />
            <ApplicantSection title="Diterima" items={grouped.accepted} actionId={actionId} reviewNote={reviewNote} setReviewNote={setReviewNote} onRespond={respond} />
            <ApplicantSection title="Ditolak" items={grouped.rejected} actionId={actionId} reviewNote={reviewNote} setReviewNote={setReviewNote} onRespond={respond} />
          </div>
        )}
      </div>
    </div>
  )
}

function ApplicantSection({
  title,
  items,
  actionId,
  reviewNote,
  setReviewNote,
  onRespond,
}: {
  title: string
  items: ArenaApplication[]
  actionId: string | null
  reviewNote: Record<string, string>
  setReviewNote: Dispatch<SetStateAction<Record<string, string>>>
  onRespond: (application: ArenaApplication, action: 'accept' | 'reject') => void
}) {
  if (items.length === 0) return null

  return (
    <section className="space-y-3">
      <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">{title} ({items.length})</h3>
      <div className="space-y-3">
        {items.map((application) => {
          const applicant = application.applicant
          const isPending = application.status === 'pending'
          return (
            <div key={application.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <ProfileAvatar url={applicant?.avatar_url} name={applicant?.full_name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {applicant?.id ? (
                      <Link href={`/dashboard/profile/${applicant.id}`} className="font-black text-slate-950 hover:text-teal-700">{applicant.full_name ?? 'Mahasiswa NEXA'}</Link>
                    ) : (
                      <p className="font-black text-slate-950">Mahasiswa NEXA</p>
                    )}
                    <FeaturedBadgePin badgeId={applicant?.featured_badge} />
                    <Badge tone={application.status === 'accepted' ? 'success' : application.status === 'rejected' ? 'danger' : 'warning'}>{application.status}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[applicant?.campus_name, applicant?.major, applicant?.semester ? `Semester ${applicant.semester}` : null].filter(Boolean).join(' · ') || 'Profil belum lengkap'}
                  </p>
                  {applicant?.nexa_id && <p className="mt-0.5 text-[10px] font-bold text-slate-400">#{applicant.nexa_id}</p>}
                </div>
              </div>

              {application.applicant_background && (
                <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">Latar belakang</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{application.applicant_background}</p>
                </div>
              )}

              {application.skills_offered.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {application.skills_offered.map((skill) => (
                    <span key={skill} className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">{skill}</span>
                  ))}
                </div>
              )}

              {application.message && (
                <p className="mt-3 text-sm leading-6 text-slate-600"><span className="font-black text-slate-950">Pesan:</span> {application.message}</p>
              )}

              {application.portfolio_url && (
                <a href={application.portfolio_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-brand-700 hover:underline">
                  <ExternalLink className="h-3.5 w-3.5" /> Cek portfolio
                </a>
              )}

              {application.review_note && application.status !== 'pending' && (
                <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500"><span className="font-black text-slate-700">Catatan review:</span> {application.review_note}</p>
              )}

              {isPending && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={reviewNote[application.id] ?? ''}
                    onChange={(e) => setReviewNote((prev) => ({ ...prev, [application.id]: e.target.value }))}
                    rows={2}
                    placeholder="Catatan review opsional. Cth: cocok frontend, portfolio sudah dicek."
                    className="focus-ring w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                  />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => onRespond(application, 'accept')}
                      disabled={actionId === application.id}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white hover:bg-emerald-700 disabled:opacity-60"
                    >
                      {actionId === application.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                      Terima, sudah cek kompeten
                    </button>
                    <button
                      onClick={() => onRespond(application, 'reject')}
                      disabled={actionId === application.id}
                      className="focus-ring inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {actionId === application.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                      Tolak
                    </button>
                  </div>
                </div>
              )}

              {application.status === 'accepted' && application.competency_confirmed && (
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 ring-1 ring-emerald-200">
                  <Check className="h-3.5 w-3.5" /> Kompetensi dikonfirmasi owner
                </p>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
