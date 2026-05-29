'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BookOpen, Copy, Crown, MessageCircle, Send, Trophy, Users } from 'lucide-react'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

type Team = { id: string; name: string; description: string | null; invite_code: string; creator_id: string }
type Member = { id: string; role: string; profiles?: { full_name: string | null; email: string } | null }
type SharedDoc = { id: string; documents?: { id: string; title: string; question_count: number; status: string } | null }
type TeamMessage = { id: string; user_id: string; message: string; created_at: string; profiles?: { full_name: string | null } | null }

export default function TeamDetailPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const params = useParams()
  const teamId = params.teamId as string

  const [team, setTeam] = useState<Team | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [docs, setDocs] = useState<SharedDoc[]>([])
  const [messages, setMessages] = useState<TeamMessage[]>([])
  const [message, setMessage] = useState('')
  const [tab, setTab] = useState<'members' | 'docs' | 'leaderboard' | 'chat'>('members')
  const [myId, setMyId] = useState<string | null>(null)

  const fetchTeam = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setMyId(user.id)

    const membership = await supabase.from('team_members').select('id').eq('team_id', teamId).eq('user_id', user.id).single()
    if (!membership.data) {
      router.push('/tim')
      return
    }

    const [teamRes, memberRes, docRes, messageRes] = await Promise.all([
      supabase.from('study_teams').select('*').eq('id', teamId).single(),
      supabase.from('team_members').select('id, role, profiles:user_id(full_name,email)').eq('team_id', teamId).order('joined_at', { ascending: true }),
      supabase.from('team_documents').select('id, documents:document_id(id,title,question_count,status)').eq('team_id', teamId).order('created_at', { ascending: false }),
      supabase.from('team_messages').select('id,user_id,message,created_at,profiles:user_id(full_name)').eq('team_id', teamId).order('created_at', { ascending: true }).limit(100),
    ])

    if (teamRes.data) setTeam(teamRes.data as Team)
    setMembers((memberRes.data || []) as unknown as Member[])
    setDocs((docRes.data || []) as unknown as SharedDoc[])
    setMessages((messageRes.data || []) as unknown as TeamMessage[])
  }, [router, supabase, teamId])

  useEffect(() => { fetchTeam() }, [fetchTeam])

  useEffect(() => {
    const channel = supabase.channel(`team-chat-${teamId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_messages', filter: `team_id=eq.${teamId}` }, () => fetchTeam())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchTeam, supabase, teamId])

  async function sendMessage() {
    const text = message.trim()
    if (!text || !myId) return
    setMessage('')
    const { error } = await supabase.from('team_messages').insert({ team_id: teamId, user_id: myId, message: text })
    if (error) alert(error.message)
  }

  const tabs = [
    ['members', 'Anggota', Users],
    ['docs', 'Materi Bersama', BookOpen],
    ['leaderboard', 'Leaderboard', Trophy],
    ['chat', 'Chat', MessageCircle],
  ] as const

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/tim')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Tim
      </button>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-950">{team?.name || 'Tim Belajar'}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{team?.description || 'Library dan chat belajar bersama.'}</p>
          </div>
          {team?.invite_code && (
            <button onClick={() => navigator.clipboard.writeText(team.invite_code)} className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
              <Copy className="h-4 w-4" />
              {team.invite_code}
            </button>
          )}
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={`inline-flex flex-shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${tab === id ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        {tab === 'members' && (
          <div className="grid gap-3 md:grid-cols-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 font-black text-brand-700">
                  {(member.profiles?.full_name || member.profiles?.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-slate-950">{member.profiles?.full_name || member.profiles?.email || 'Anggota'}</p>
                  <p className="text-xs font-bold text-slate-500">{member.role}</p>
                </div>
                {member.role === 'owner' && <Crown className="h-4 w-4 text-amber-500" />}
              </div>
            ))}
          </div>
        )}

        {tab === 'docs' && (
          <div className="grid gap-3 md:grid-cols-2">
            {docs.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">Belum ada Dokumen dishare ke tim.</p> : docs.map((item) => item.documents && (
              <Link key={item.id} href={`/dashboard/documents/${item.documents.id}`} className="rounded-lg border border-slate-200 p-4 transition hover:border-brand-300">
                <p className="font-black text-slate-950">{item.documents.title}</p>
                <p className="mt-2 text-xs font-semibold text-slate-500">{item.documents.question_count || 0} soal tersedia</p>
              </Link>
            ))}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div className="py-12 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-amber-400" />
            <p className="font-black text-slate-950">Leaderboard internal siap dipakai.</p>
            <p className="mt-1 text-sm text-slate-500">Skor anggota dari Dokumen bersama akan tampil setelah sesi exam selesai.</p>
          </div>
        )}

        {tab === 'chat' && (
          <div className="flex h-[560px] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-slate-50 p-4">
              {messages.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Belum ada chat.</p>}
              {messages.map((item) => (
                <div key={item.id} className={`flex ${item.user_id === myId ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 ${item.user_id === myId ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm bg-white text-slate-800 shadow-sm'}`}>
                    {item.user_id !== myId && <p className="mb-1 text-xs font-black text-brand-600">{item.profiles?.full_name || 'Anggota'}</p>}
                    {item.message}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} placeholder="Tulis pesan..." className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-brand-500" />
              <Button onClick={sendMessage}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
