'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Users, Plus, Hash, Trophy, Clock, Copy, CheckCircle2, Lock } from 'lucide-react'
import type { StudyRoom, Profile } from '@/types'

export default function StudyRoomListPage() {
  const supabase = createClient()
  const router   = useRouter()

  const [profile, setProfile]   = useState<Profile | null>(null)
  const [rooms,   setRooms]     = useState<StudyRoom[]>([])
  const [loading, setLoading]   = useState(true)
  const [creating, setCreating] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')
  const [copied, setCopied]     = useState<string | null>(null)

  // Create room dialog
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle,   setNewTitle]   = useState('')
  const [docId,      setDocId]      = useState('')
  const [myDocs,     setMyDocs]     = useState<{ id: string; title: string }[]>([])

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, roomsRes, docsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('study_rooms').select('*').eq('creator_id', user.id).order('created_at', { ascending: false }),
      supabase.from('documents').select('id, title').eq('user_id', user.id).eq('status', 'completed'),
    ])

    setProfile(profileRes.data as Profile)
    setRooms((roomsRes.data ?? []) as StudyRoom[])
    setMyDocs(docsRes.data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleCreateRoom() {
    if (!newTitle.trim() || !docId) return
    setCreating(true)

    const res = await fetch('/api/study-rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, documentId: docId }),
    })
    const { data, error } = await res.json()

    if (error) { alert(error); setCreating(false); return }

    setShowCreate(false)
    setNewTitle('')
    setDocId('')
    setCreating(false)
    router.push(`/study-room/${data.roomId}`)
  }

  async function handleJoin() {
    if (!joinCode.trim()) return
    setJoinError('')

    const res = await fetch('/api/study-rooms/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomCode: joinCode.toUpperCase().trim() }),
    })
    const { data, error } = await res.json()

    if (error) { setJoinError(error); return }
    router.push(`/study-room/${data.roomId}`)
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  const isPro = profile?.plan === 'pro'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-2xl font-bold text-slate-900">Study Room</h1>
          <p className="text-slate-500 text-sm mt-1">Ujian bareng teman sekelas dan lihat leaderboard.</p>
        </div>
        {isPro && (
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" />
            Buat Room
          </Button>
        )}
      </div>

      {!isPro && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 flex gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-sans font-bold text-amber-900 mb-1">Fitur Pro</h3>
            <p className="text-amber-700 text-sm">
              Study Room & Leaderboard hanya tersedia di paket Pro (Rp25.000/bulan).
              Upgrade dan ajak teman sekelas ujian bareng!
            </p>
            <Button size="sm" className="mt-3 bg-amber-500 hover:bg-amber-600">
              Upgrade ke Pro
            </Button>
          </div>
        </div>
      )}

      {/* Join room */}
      <Card>
        <CardHeader>
          <h2 className="font-sans font-bold text-slate-900 flex items-center gap-2">
            <Hash className="w-4 h-4 text-brand-500" />
            Gabung dengan Kode Room
          </h2>
        </CardHeader>
        <CardBody>
          <div className="flex gap-3">
            <input
              type="text"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Masukkan kode 6 karakter"
              maxLength={6}
              className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm uppercase tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button onClick={handleJoin} disabled={joinCode.length !== 6}>
              Gabung
            </Button>
          </div>
          {joinError && <p className="mt-2 text-sm text-red-600">{joinError}</p>}
        </CardBody>
      </Card>

      {/* My rooms */}
      {isPro && (
        <div>
          <h2 className="font-sans font-bold text-slate-900 mb-4">Room yang Kubuat</h2>
          {loading ? (
            <div className="text-center py-8 text-slate-400 text-sm">Memuat...</div>
          ) : rooms.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-medium text-slate-600 mb-1">Belum ada room</h3>
              <p className="text-slate-400 text-sm mb-4">Buat room baru dan bagikan kodenya ke teman.</p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" />
                Buat Room Baru
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {rooms.map(room => (
                <div key={room.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{room.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md tracking-widest">
                          {room.room_code}
                        </span>
                        <button onClick={() => copyCode(room.room_code)} className="text-slate-400 hover:text-brand-600">
                          {copied === room.room_code ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${room.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {room.is_active ? 'Aktif' : 'Selesai'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> Berakhir: {new Date(room.expires_at).toLocaleDateString('id-ID')}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => router.push(`/study-room/${room.id}`)} className="flex-1">
                      <Trophy className="w-3.5 h-3.5" />
                      Leaderboard
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => copyCode(room.room_code)}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create room modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="font-sans font-bold text-slate-900 text-lg mb-5">Buat Study Room</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Room</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="contoh: UTS Manajemen Keuangan"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Dokumen / Soal</label>
                <select
                  value={docId}
                  onChange={e => setDocId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                >
                  <option value="">Pilih dokumen...</option>
                  {myDocs.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
                {myDocs.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">Kamu belum punya dokumen. Upload diktat dulu!</p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
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
