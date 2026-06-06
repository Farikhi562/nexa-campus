'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BookOpen, Clock, Loader2, Plus, Search, Users, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import CreateRoomModal from '@/components/dashboard/CreateRoomModal'
import type { StudyRoom, StudyRoomCategory } from '@/types'

const CATEGORIES: Array<{ value: StudyRoomCategory | ''; label: string }> = [
  { value: '', label: 'Semua' },
  { value: 'umum', label: 'Umum' },
  { value: 'informatika', label: 'Informatika' },
  { value: 'matematika', label: 'Matematika' },
  { value: 'ekonomi', label: 'Ekonomi' },
  { value: 'hukum', label: 'Hukum' },
  { value: 'kedokteran', label: 'Kedokteran' },
  { value: 'biologi', label: 'Biologi' },
  { value: 'fisika', label: 'Fisika' },
  { value: 'bahasa', label: 'Bahasa' },
  { value: 'seni', label: 'Seni' },
  { value: 'lainnya', label: 'Lainnya' },
]

function statusColor(status: string) {
  if (status === 'open') return 'success'
  if (status === 'full') return 'warning'
  return 'neutral'
}

function statusLabel(status: string) {
  if (status === 'open') return 'Buka'
  if (status === 'full') return 'Penuh'
  return 'Ditutup'
}

function Avatar({ url, name, size = 'sm' }: { url?: string | null; name?: string | null; size?: 'sm' | 'md' }) {
  const s = size === 'md' ? 'h-10 w-10 text-sm' : 'h-7 w-7 text-xs'
  const init = (name ?? 'N').slice(0, 1).toUpperCase()
  return (
    <span className={`flex ${s} flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 font-black text-slate-600`}>
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : init}
    </span>
  )
}

export default function StudyRoomView({ userId }: { userId: string }) {
  const router = useRouter()
  const [rooms, setRooms] = useState<StudyRoom[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [category, setCategory] = useState<StudyRoomCategory | ''>('')
  const [showCreate, setShowCreate] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [joiningCode, setJoiningCode] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (category) params.set('category', category)
      const res = await fetch(`/api/study-rooms?${params}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Gagal memuat room.'); return }
      setRooms((json.data ?? []) as StudyRoom[])
    } catch { setError('Gagal memuat room.') }
    finally { setLoading(false) }
  }, [q, category])

  useEffect(() => { void load() }, [load])

  async function joinByCode() {
    if (!codeInput.trim()) return
    setJoiningCode(true)
    const res = await fetch('/api/study-rooms/join-by-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: codeInput.trim() }),
    })
    const json = await res.json()
    setJoiningCode(false)
    if (!res.ok) { alert(json.error ?? 'Kode tidak valid.'); return }
    if (json.data?.joined) {
      setCodeInput('')
      router.push(`/dashboard/study-room/${json.data.room_id}`)
    } else if (json.data?.pending) {
      alert(json.data.message ?? 'Permintaan join terkirim.')
      setCodeInput('')
    } else if (json.data?.already_member) {
      router.push(`/dashboard/study-room/${json.data.room_id}`)
    }
  }

  async function handleJoin(room: StudyRoom) {
    if (room.visibility === 'private') {
      setActionId(room.id)
      const res = await fetch(`/api/study-rooms/${room.id}/requests`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok && res.status !== 409) alert(json.error ?? 'Gagal request join.')
      else alert('Permintaan bergabung terkirim. Tunggu persetujuan owner/admin room.')
      setActionId(null)
      return
    }
    setActionId(room.id)
    const res = await fetch(`/api/study-rooms/${room.id}/join`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok) alert(json.error ?? 'Gagal join.')
    else {
      await load()
      router.push(`/dashboard/study-room/${room.id}`)
    }
    setActionId(null)
  }

  async function handleLeave(roomId: string) {
    if (!confirm('Keluar dari room ini?')) return
    setActionId(roomId)
    const res = await fetch(`/api/study-rooms/${roomId}/leave`, { method: 'POST' })
    const json = await res.json()
    if (!res.ok) { alert(json.error ?? 'Gagal keluar.') }
    else await load()
    setActionId(null)
  }

  return (
    <>
      {showCreate && (
        <CreateRoomModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); void load() }}
        />
      )}

      <div className="space-y-5">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(45,212,191,0.26),transparent_18rem)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-100">
                <Users className="h-3.5 w-3.5" />
                Study Room
              </div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Belajar bareng, lebih masuk.</h1>
              <p className="mt-2 max-w-lg text-sm leading-6 text-slate-300">
                Buat atau gabung ruang belajar bersama teman. Fokus, diskusi, selesaikan deadline bareng.
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="min-h-12 flex-shrink-0 rounded-2xl bg-teal-400 text-slate-950 hover:bg-teal-300">
              <Plus className="h-4 w-4" />
              Buat Study Room
            </Button>
          </div>
        </section>

        {/* Join by code */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => { if (e.key === 'Enter') void joinByCode() }}
              placeholder="Masukkan kode room (6 karakter)"
              maxLength={6}
              className="focus-ring w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black tracking-widest"
            />
          </div>
          <button
            onClick={joinByCode}
            disabled={!codeInput.trim() || joiningCode}
            className="focus-ring flex min-h-12 items-center justify-center rounded-2xl bg-teal-500 px-4 text-sm font-black text-white transition hover:bg-teal-400 disabled:opacity-40"
          >
            {joiningCode ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gabung'}
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari topik atau judul room..."
              className="focus-ring w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.slice(0, 6).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setCategory(value)}
                className={`focus-ring flex-shrink-0 rounded-2xl px-3 py-2.5 text-sm font-black transition ${
                  category === value ? 'bg-slate-950 text-white' : 'border border-slate-200 bg-white text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : rooms.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <BookOpen className="h-12 w-12 text-slate-200" />
              <div>
                <p className="text-base font-black text-slate-950">Belum ada study room.</p>
                <p className="mt-1 text-sm text-slate-500">
                  Entah semua orang lagi produktif diam-diam, atau belum ada yang mulai.
                </p>
              </div>
              <Button onClick={() => setShowCreate(true)} className="rounded-2xl">
                <Plus className="h-4 w-4" /> Buat Study Room
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {rooms.map((room) => (
              <Card key={room.id} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={statusColor(room.status) as 'success' | 'warning' | 'neutral'}>
                          {statusLabel(room.status)}
                        </Badge>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold capitalize text-slate-600">
                          {room.category}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-black text-slate-950 line-clamp-1">{room.title}</h3>
                      {room.description && (
                        <p className="mt-1 text-sm leading-5 text-slate-500 line-clamp-2">{room.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      {room.current_members_count}/{room.max_members} anggota
                    </span>
                    {room.scheduled_at && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(room.scheduled_at).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    {room.topic && <span className="text-teal-700">#{room.topic}</span>}
                  </div>

                  <div className="mt-4 flex gap-2">
                    {room.is_member ? (
                      <>
                        {room.member_role === 'owner' && (
                          <span className="inline-flex items-center rounded-2xl bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">👑 Owner</span>
                        )}
                        <Link
                          href={`/dashboard/study-room/${room.id}`}
                          className="focus-ring inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-teal-500 px-4 text-sm font-black text-white hover:bg-teal-400"
                        >
                          Masuk Room
                        </Link>
                        <Button
                          onClick={() => handleLeave(room.id)}
                          disabled={actionId === room.id}
                          variant="outline"
                          className="rounded-2xl text-sm"
                        >
                          Keluar
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => handleJoin(room)}
                        disabled={actionId === room.id || room.status === 'closed' || room.status === 'full' || room.owner_id === userId}
                        className="w-full rounded-2xl text-sm"
                      >
                        {actionId === room.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        {room.status === 'closed' ? 'Ditutup'
                          : room.status === 'full' ? 'Penuh'
                          : room.visibility === 'private' ? '🔒 Minta Bergabung'
                          : 'Join'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
