'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Medal,
  Play,
  Share2,
  Trophy,
  Users,
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import type { LeaderboardEntry, StudyRoom } from '@/types'

export default function StudyRoomPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string

  const [room, setRoom] = useState<StudyRoom | null>(null)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [participantCount, setParticipantCount] = useState(0)
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [joining, setJoining] = useState(false)

  const fetchRoom = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    setMyId(user.id)

    const { data: roomData } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (!roomData) {
      router.push('/study-room')
      return
    }

    setRoom(roomData as StudyRoom)

    const { data: participants } = await supabase
      .from('room_participants')
      .select(`
        user_id,
        session_id,
        profiles:user_id ( full_name, avatar_url ),
        exam_sessions:session_id ( score, time_taken_seconds, completed_at, status )
      `)
      .eq('room_id', roomId)

    setParticipantCount(participants?.length ?? 0)

    const board: LeaderboardEntry[] = (participants || [])
      .filter((p: any) => p.exam_sessions?.status === 'completed')
      .map((p: any) => ({
        rank: 0,
        user_id: p.user_id,
        full_name: p.profiles?.full_name ?? 'Anonim',
        avatar_url: p.profiles?.avatar_url ?? null,
        score: p.exam_sessions?.score ?? 0,
        time_taken_seconds: p.exam_sessions?.time_taken_seconds ?? 999999,
        completed_at: p.exam_sessions?.completed_at ?? '',
      }))
      .sort((a, b) => b.score !== a.score ? b.score - a.score : a.time_taken_seconds - b.time_taken_seconds)
      .map((entry, index) => ({ ...entry, rank: index + 1 }))

    setEntries(board)
    setLoading(false)
  }, [roomId, router, supabase])

  useEffect(() => {
    fetchRoom()
  }, [fetchRoom])

  useEffect(() => {
    const timer = window.setInterval(fetchRoom, 10000)
    return () => window.clearInterval(timer)
  }, [fetchRoom])

  async function handleJoinAndExam() {
    if (!room?.document_id || !myId || joining) return
    setJoining(true)

    await supabase.from('room_participants').upsert(
      { room_id: roomId, user_id: myId },
      { onConflict: 'room_id,user_id' }
    )

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: room.document_id, studyRoomId: roomId }),
    })
    const { data, error } = await res.json()

    if (error) {
      alert(error)
      setJoining(false)
      return
    }

    await supabase
      .from('room_participants')
      .update({ session_id: data.sessionId })
      .eq('room_id', roomId)
      .eq('user_id', myId)

    router.push(`/exam/${data.sessionId}`)
  }

  function copyCode() {
    if (!room) return
    navigator.clipboard.writeText(room.room_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
      </div>
    )
  }

  const myEntry = entries.find((entry) => entry.user_id === myId)
  const hasPlayed = Boolean(myEntry)
  const expired = room ? new Date(room.expires_at) < new Date() : false
  const canStartExam = Boolean(room?.document_id && room?.is_active && !expired && !hasPlayed)
  const MEDAL_COLORS = ['text-amber-500', 'text-slate-400', 'text-amber-700']

  return (
    <div className="space-y-6 animate-fade-in">
      <button onClick={() => router.push('/study-room')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Study Room
      </button>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="bg-brand-950 p-6 text-white sm:p-8">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-cyan-100">
                <Trophy className="h-3.5 w-3.5" />
                Live Study Room
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${room?.is_active && !expired ? 'bg-emerald-400/15 text-emerald-200' : 'bg-white/10 text-white/70'}`}>
                {room?.is_active && !expired ? 'Aktif' : 'Tidak aktif'}
              </span>
            </div>
            <h1 className="max-w-2xl text-3xl font-black tracking-tight md:text-4xl">{room?.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-brand-100">
              Bagikan kode room, mulai ujian dari dokumen yang sama, lalu pantau leaderboard saat teman selesai.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={handleJoinAndExam}
                loading={joining}
                disabled={!canStartExam}
                className="bg-white text-brand-800 hover:bg-brand-50"
              >
                <Play className="h-4 w-4" />
                {hasPlayed ? 'Sudah Selesai' : room?.document_id ? 'Mulai Ujian' : 'Belum Ada Dokumen'}
              </Button>
              <Button variant="outline" onClick={copyCode} className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                Salin Kode
              </Button>
            </div>
          </div>

          <aside className="border-t border-slate-200 bg-slate-50 p-6 lg:border-l lg:border-t-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Kode Room</p>
            <button onClick={copyCode} className="mt-2 flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-brand-300">
              <span className="font-mono text-2xl font-black tracking-[0.22em] text-slate-950">{room?.room_code}</span>
              {copied ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5 text-slate-400" />}
            </button>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                ['Peserta', String(participantCount), Users],
                ['Selesai', String(entries.length), CheckCircle2],
                ['Rank kamu', myEntry ? `#${myEntry.rank}` : '-', Medal],
              ].map(([label, value, Icon]) => (
                <div key={String(label)} className="rounded-lg border border-slate-200 bg-white p-3">
                  <Icon className="mb-2 h-4 w-4 text-brand-600" />
                  <p className="text-lg font-black text-slate-950">{String(value)}</p>
                  <p className="text-[11px] font-semibold text-slate-500">{String(label)}</p>
                </div>
              ))}
            </div>

            <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {expired ? 'Room sudah kadaluarsa' : `Aktif sampai ${room ? new Date(room.expires_at).toLocaleString('id-ID') : '-'}`}
            </p>
          </aside>
        </div>
      </section>

      {!room?.document_id && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700" />
            <div>
              <h2 className="font-black text-amber-950">Room belum punya dokumen ujian</h2>
              <p className="mt-1 text-sm leading-6 text-amber-800">
                Room ini bisa dipakai untuk share kode dan kumpul peserta, tapi tombol ujian aktif setelah room terhubung ke dokumen yang sudah diproses AI.
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-black text-slate-950">Leaderboard</h2>
            <p className="mt-1 text-xs text-slate-500">Diurutkan dari skor tertinggi, lalu waktu tercepat.</p>
          </div>
          <Trophy className="h-5 w-5 text-amber-500" />
        </div>

        {entries.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-slate-200" />
            <p className="font-bold text-slate-700">Belum ada peserta selesai</p>
            <p className="mt-1 text-sm text-slate-500">Leaderboard akan terisi otomatis setelah peserta submit ujian.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <div key={entry.user_id} className={`grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 ${entry.user_id === myId ? 'bg-brand-50' : ''}`}>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  {entry.rank <= 3 ? (
                    <Medal className={`h-5 w-5 ${MEDAL_COLORS[entry.rank - 1]}`} />
                  ) : (
                    <span className="text-sm font-black text-slate-500">#{entry.rank}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-950">
                    {entry.full_name || 'Anonim'}
                    {entry.user_id === myId && <span className="ml-2 text-xs font-bold text-brand-700">kamu</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {Math.floor(entry.time_taken_seconds / 60)}:{String(entry.time_taken_seconds % 60).padStart(2, '0')} menit
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-black ${entry.score >= 80 ? 'text-emerald-600' : entry.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                    {entry.score}
                  </p>
                  <p className="text-xs font-semibold text-slate-400">poin</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
