'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  Hash,
  Lock,
  Plus,
  Search,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { PlanBadge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS, type Profile, type StudyRoom } from '@/types'

export default function StudyRoomListPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [rooms, setRooms] = useState<StudyRoom[]>([])
  const [myDocs, setMyDocs] = useState<{ id: string; title: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [docId, setDocId] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const [profileRes, roomsRes, docsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      fetch('/api/study-rooms').then((res) => res.json()).catch(() => []),
      supabase
        .from('documents')
        .select('id, title')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false }),
    ])

    if (profileRes.data) setProfile(profileRes.data as Profile)
    setRooms(Array.isArray(roomsRes) ? roomsRes as StudyRoom[] : [])
    setMyDocs(docsRes.data ?? [])
    setLoading(false)
  }, [router, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const plan = profile?.plan ?? 'free'
  const canCreateRoom = PLAN_LIMITS[plan].canStudyRoom
  const activeRooms = rooms.filter((room) => room.is_active && new Date(room.expires_at) > new Date()).length

  async function handleCreateRoom() {
    if (!newTitle.trim() || !docId || creating) return
    setCreating(true)

    const res = await fetch('/api/study-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), documentId: docId }),
    })
    const { data, error } = await res.json()

    setCreating(false)
    if (error) {
      alert(error)
      return
    }

    setShowCreate(false)
    setNewTitle('')
    setDocId('')
    router.push(`/study-room/${data.roomId}`)
  }

  async function handleJoin() {
    if (joinCode.trim().length !== 6) return
    setJoinError('')

    const res = await fetch('/api/study-rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: joinCode.toUpperCase().trim() }),
    })
    const { data, error } = await res.json()

    if (error) {
      setJoinError(error)
      return
    }

    router.push(`/study-room/${data.roomId}`)
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 1600)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-6 sm:p-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                <Users className="h-3.5 w-3.5" />
                Study Room
              </span>
              <PlanBadge plan={plan} />
            </div>
            <h1 className="max-w-3xl text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              Ujian bareng, kode room rapi, leaderboard langsung kebaca.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Buat room dari dokumen yang sudah diproses AI, bagikan kode ke teman, lalu lihat peringkat berdasarkan skor dan waktu selesai.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => setShowCreate(true)} disabled={!canCreateRoom}>
                <Plus className="h-4 w-4" />
                Buat Room
              </Button>
              <Link href="/dashboard/upload" className="inline-flex">
                <Button variant="outline" type="button">
                  Upload Dokumen
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
            <div className="grid grid-cols-3 gap-3 lg:grid-cols-1">
              {[
                ['Room aktif', String(activeRooms)],
                ['Dokumen siap', String(myDocs.length)],
                ['Total room', String(rooms.length)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
                  <p className="text-2xl font-black text-slate-950">{value}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {!canCreateRoom && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-black text-amber-950">Create room tersedia untuk Pro/Admin</h2>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Akun gratis tetap bisa gabung room dengan kode undangan.
                </p>
              </div>
            </div>
            <Link href="/pricing">
              <Button type="button" className="bg-amber-600 hover:bg-amber-700">Upgrade</Button>
            </Link>
          </div>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Hash className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-black text-slate-950">Gabung room</h2>
              <p className="text-xs text-slate-500">Masukkan kode 6 karakter dari temanmu.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="ABC123"
              maxLength={6}
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 font-mono text-sm font-black uppercase tracking-[0.25em] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <Button onClick={handleJoin} disabled={joinCode.length !== 6}>Gabung</Button>
          </div>
          {joinError && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{joinError}</p>}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-black text-slate-950">Room kamu</h2>
              <p className="text-xs text-slate-500">Room yang kamu buat atau sudah kamu ikuti.</p>
            </div>
            <Search className="h-5 w-5 text-slate-300" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-bold text-slate-700">Belum ada room</p>
              <p className="mt-1 text-sm text-slate-500">Buat room dari dokumen siap pakai atau gabung memakai kode.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {rooms.map((room) => {
                const expired = new Date(room.expires_at) < new Date()
                return (
                  <article key={room.id} className="rounded-lg border border-slate-200 p-4 transition hover:border-brand-300 hover:shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate font-black text-slate-950">{room.title}</h3>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3.5 w-3.5" />
                          {expired ? 'Kadaluarsa' : `Aktif sampai ${new Date(room.expires_at).toLocaleDateString('id-ID')}`}
                        </p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-xs font-bold ${room.is_active && !expired ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {room.is_active && !expired ? 'Aktif' : 'Selesai'}
                      </span>
                    </div>
                    <div className="mb-4 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="font-mono text-sm font-black tracking-[0.2em] text-slate-800">{room.room_code}</span>
                      <button onClick={() => copyCode(room.room_code)} className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-brand-700">
                        {copied === room.room_code ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button size="sm" fullWidth onClick={() => router.push(`/study-room/${room.id}`)}>
                      <Trophy className="h-3.5 w-3.5" />
                      Buka Room
                    </Button>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">Buat Study Room</h2>
                <p className="mt-1 text-sm text-slate-500">Pilih dokumen yang sudah selesai diproses AI.</p>
              </div>
              <Sparkles className="h-5 w-5 text-brand-600" />
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Nama room</span>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(event) => setNewTitle(event.target.value)}
                  placeholder="UTS Manajemen Keuangan"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Dokumen soal</span>
                <select
                  value={docId}
                  onChange={(event) => setDocId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="">Pilih dokumen siap ujian</option>
                  {myDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>{doc.title}</option>
                  ))}
                </select>
                {myDocs.length === 0 && (
                  <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                    Belum ada dokumen selesai. Upload PDF dan tunggu AI memproses soal dulu.
                  </p>
                )}
              </label>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setShowCreate(false)}>Batal</Button>
              <Button fullWidth loading={creating} disabled={!newTitle.trim() || !docId} onClick={handleCreateRoom}>
                Buat Room
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
