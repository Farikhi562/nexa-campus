'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import { Trophy, Copy, CheckCircle2, Play, ArrowLeft, Medal } from 'lucide-react'
import type { StudyRoom, LeaderboardEntry } from '@/types'

export default function StudyRoomPage() {
  const supabase  = createClient()
  const router    = useRouter()
  const params    = useParams()
  const roomId    = params.roomId as string

  const [room,    setRoom]    = useState<StudyRoom | null>(null)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [myId,    setMyId]    = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState(false)
  const [joining, setJoining] = useState(false)

  const fetchRoom = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth/login'); return }
    setMyId(user.id)

    const { data: roomData } = await supabase
      .from('study_rooms')
      .select('*')
      .eq('id', roomId)
      .single()

    if (!roomData) { router.push('/study-room'); return }
    setRoom(roomData as StudyRoom)

    // Get leaderboard: join room_participants + exam_sessions + profiles
    const { data: participants } = await supabase
      .from('room_participants')
      .select(`
        user_id,
        session_id,
        profiles:user_id ( full_name, avatar_url ),
        exam_sessions:session_id ( score, time_taken_seconds, completed_at, status )
      `)
      .eq('room_id', roomId)

    if (participants) {
      const board: LeaderboardEntry[] = participants
        .filter((p: any) => p.exam_sessions?.status === 'completed')
        .map((p: any, idx: number) => ({
          rank: 0,
          user_id: p.user_id,
          full_name: p.profiles?.full_name ?? 'Anonim',
          avatar_url: p.profiles?.avatar_url ?? null,
          score: p.exam_sessions?.score ?? 0,
          time_taken_seconds: p.exam_sessions?.time_taken_seconds ?? 999,
          completed_at: p.exam_sessions?.completed_at ?? '',
        }))
        .sort((a: LeaderboardEntry, b: LeaderboardEntry) =>
          b.score !== a.score
            ? b.score - a.score
            : a.time_taken_seconds - b.time_taken_seconds
        )
        .map((e: LeaderboardEntry, i: number) => ({ ...e, rank: i + 1 }))

      setEntries(board)
    }
    setLoading(false)
  }, [roomId, router, supabase])

  useEffect(() => { fetchRoom() }, [fetchRoom])
  // Poll every 10s for new entries
  useEffect(() => {
    const t = setInterval(fetchRoom, 10000)
    return () => clearInterval(t)
  }, [fetchRoom])

  async function handleJoinAndExam() {
    if (!room || !myId) return
    setJoining(true)

    // Ensure participant record exists
    await supabase.from('room_participants').upsert(
      { room_id: roomId, user_id: myId },
      { onConflict: 'room_id,user_id' }
    )

    // Create exam session
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: room.document_id, studyRoomId: roomId }),
    })
    const { data, error } = await res.json()
    if (error) { alert(error); setJoining(false); return }

    // Link session to participant
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
    setTimeout(() => setCopied(false), 2000)
  }

  const MEDAL_COLORS = ['text-amber-500', 'text-slate-400', 'text-amber-700']

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
      </div>
    )
  }

  const myEntry   = entries.find(e => e.user_id === myId)
  const hasPlayed = !!myEntry

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-5 animate-fade-in">
        {/* Header */}
        <button onClick={() => router.push('/study-room')} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>

        <div className="bg-brand-950 rounded-3xl p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Study Room</span>
              </div>
              <h1 className="font-sans text-xl font-bold">{room?.title}</h1>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-brand-300 text-xs mb-1">Kode Room</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold tracking-widest">{room?.room_code}</span>
                <button onClick={copyCode} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {!hasPlayed && (
            <Button
              className="mt-5 w-full bg-white text-brand-700 hover:bg-brand-50"
              loading={joining}
              onClick={handleJoinAndExam}
            >
              <Play className="w-4 h-4" />
              Mulai Ujian Sekarang
            </Button>
          )}
          {hasPlayed && (
            <div className="mt-4 bg-white/10 rounded-xl p-3 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-medium">Kamu sudah selesai</p>
                <p className="text-xs text-brand-300">Skor: {myEntry?.score} · Rank #{myEntry?.rank}</p>
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-sans font-bold text-slate-900">Leaderboard</h2>
            <span className="text-xs text-slate-400">{entries.length} peserta selesai</span>
          </div>

          {entries.length === 0 ? (
            <div className="py-12 text-center">
              <Trophy className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">Belum ada yang selesai ujian</p>
              <p className="text-slate-300 text-xs mt-1">Bagikan kode room ke teman-temanmu!</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-4 px-5 py-4 ${entry.user_id === myId ? 'bg-brand-50' : ''}`}
                >
                  {/* Rank */}
                  <div className="w-8 flex-shrink-0 text-center">
                    {entry.rank <= 3 ? (
                      <Medal className={`w-5 h-5 mx-auto ${MEDAL_COLORS[entry.rank - 1]}`} />
                    ) : (
                      <span className="text-sm font-bold text-slate-400">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {(entry.full_name || '?').charAt(0).toUpperCase()}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {entry.full_name || 'Anonim'}
                      {entry.user_id === myId && <span className="ml-1 text-xs text-brand-600">(kamu)</span>}
                    </p>
                    <p className="text-xs text-slate-400">
                      {Math.floor(entry.time_taken_seconds / 60)}:{String(entry.time_taken_seconds % 60).padStart(2,'0')} menit
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className={`text-lg font-extrabold font-sans ${entry.score >= 80 ? 'text-green-600' : entry.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                      {entry.score}
                    </p>
                    <p className="text-xs text-slate-400">poin</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
