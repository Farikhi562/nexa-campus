'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Copy, Download, FileText, Lock, MessageCircle, Send, Share2, Sparkles } from 'lucide-react'
import Button from '@/components/ui/Button'
import ProUpgradeModal from '@/components/ProUpgradeModal'
import { createClient } from '@/lib/supabase/client'
import { hasProAccess } from '@/lib/plans'
import type { Profile, Question } from '@/types'
import jsPDF from 'jspdf'

type ChatRow = { id: string; role: 'user' | 'assistant'; message: string; created_at: string }
type DocRow = { id: string; title: string; extracted_text: string | null; summary: string | null; question_count: number }
type TeamRow = { id: string; name: string }

export default function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [doc, setDoc] = useState<DocRow | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [chats, setChats] = useState<ChatRow[]>([])
  const [teams, setTeams] = useState<TeamRow[]>([])
  const [tab, setTab] = useState<'soal' | 'chat'>('soal')
  const [message, setMessage] = useState('')
  const [loadingChat, setLoadingChat] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState('')
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [selectedTeam, setSelectedTeam] = useState('')

  const isPro = hasProAccess(profile)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const [profileRes, docRes, questionRes, chatRes, memberRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('documents').select('id,title,extracted_text,summary,question_count').eq('id', documentId).eq('user_id', user.id).single(),
        supabase.from('questions').select('*').eq('document_id', documentId).order('order_index'),
        fetch(`/api/documents/${documentId}/chat`).then((res) => res.json()).catch(() => ({ data: [] })),
        supabase.from('team_members').select('study_teams(id,name)').eq('user_id', user.id),
      ])

      if (profileRes.data) setProfile(profileRes.data as Profile)
      if (docRes.data) setDoc(docRes.data as DocRow)
      if (questionRes.data) setQuestions(questionRes.data as Question[])
      if (chatRes.data) setChats(chatRes.data)
      const teamRows = ((memberRes.data || []) as Array<{ study_teams: TeamRow | TeamRow[] | null }>)
        .flatMap((row) => Array.isArray(row.study_teams) ? row.study_teams : row.study_teams ? [row.study_teams] : [])
      setTeams(teamRows)
    }
    load()
  }, [documentId, router, supabase])

  function requirePro(feature: string) {
    if (isPro) return true
    setUpgradeFeature(feature)
    return false
  }

  async function sendChat() {
    if (!message.trim() || !requirePro('Chat with PDF khusus Pro')) return
    const userMessage: ChatRow = { id: `u-${Date.now()}`, role: 'user', message: message.trim(), created_at: new Date().toISOString() }
    setChats((current) => [...current, userMessage])
    setMessage('')
    setLoadingChat(true)
    const res = await fetch(`/api/documents/${documentId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage.message }),
    })
    const data = await res.json()
    if (data.reply) {
      setChats((current) => [...current, { id: `a-${Date.now()}`, role: 'assistant', message: data.reply, created_at: new Date().toISOString() }])
    } else if (data.error) {
      setChats((current) => [...current, { id: `e-${Date.now()}`, role: 'assistant', message: data.error, created_at: new Date().toISOString() }])
    }
    setLoadingChat(false)
  }

  async function makeSummary() {
    if (!requirePro('Ringkasan otomatis PDF khusus Pro')) return
    setSummaryOpen(true)
    if (doc?.summary) return
    setSummaryLoading(true)
    const res = await fetch(`/api/documents/${documentId}/summary`, { method: 'POST' })
    const data = await res.json()
    if (data.summary) setDoc((current) => current ? { ...current, summary: data.summary } : current)
    setSummaryLoading(false)
  }

  async function shareToTeam() {
    if (!selectedTeam || !requirePro('Share Dokumen ke tim khusus Pro')) return
    await fetch(`/api/documents/${documentId}/share-team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: selectedTeam }),
    })
    alert('Dokumen dibagikan ke tim.')
  }

  function downloadSummaryPdf() {
    const pdf = new jsPDF()
    pdf.setFontSize(16)
    pdf.text('NEXA Campus Ecosystem - Ringkasan Dokumen', 14, 18)
    pdf.setFontSize(11)
    pdf.text(doc?.title || 'Dokumen', 14, 28)
    pdf.setFontSize(10)
    pdf.text(pdf.splitTextToSize(doc?.summary || '', 180), 14, 42)
    pdf.save(`ringkasan-${doc?.title || 'nexa'}.pdf`)
  }

  function exportQuizlet() {
    if (!requirePro('Export Quizlet khusus Pro')) return
    const rows = questions.map((q) => `${q.question_text}\t${q.correct_answer}. ${q.options[q.correct_answer]}${q.explanation ? ` - ${q.explanation}` : ''}`).join('\n')
    const blob = new Blob([rows], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc?.title || 'quizlet'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportWordLike() {
    if (!requirePro('Export Word khusus Pro')) return
    const html = `<h1>${doc?.title}</h1>${questions.map((q, index) => `<h3>${index + 1}. ${q.question_text}</h3><p>A. ${q.options.A}<br/>B. ${q.options.B}<br/>C. ${q.options.C}<br/>D. ${q.options.D}</p><p><b>Kunci:</b> ${q.correct_answer}. ${q.options[q.correct_answer]}</p><p>${q.explanation || ''}</p>`).join('')}`
    const blob = new Blob([html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc?.title || 'soal'}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke dashboard
      </Link>

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-brand-700">Detail Dokumen</p>
            <h1 className="mt-2 text-2xl font-black text-slate-950">{doc?.title || 'Dokumen'}</h1>
            <p className="mt-1 text-sm text-slate-500">{doc?.question_count || 0} soal tersedia</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={makeSummary}>
              <Sparkles className="h-4 w-4" />
              Buat Ringkasan
            </Button>
            <Button type="button" variant="outline" onClick={exportQuizlet}>Export Quizlet</Button>
            <Button type="button" variant="outline" onClick={exportWordLike}>Export Word</Button>
          </div>
        </div>

        <div className="mt-5 flex gap-2 border-b border-slate-200">
          <button onClick={() => setTab('soal')} className={`px-4 py-2 text-sm font-black ${tab === 'soal' ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500'}`}>Soal</button>
          <button onClick={() => isPro ? setTab('chat') : setUpgradeFeature('Chat with PDF khusus Pro')} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-black ${tab === 'chat' ? 'border-b-2 border-brand-600 text-brand-700' : 'text-slate-500'}`}>
            Chat {!isPro && <Lock className="h-3.5 w-3.5 text-red-500" />}
          </button>
        </div>
      </section>

      {tab === 'soal' ? (
        <section className="grid gap-3">
          {questions.map((q, index) => (
            <article key={q.id} className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-black text-slate-950">{index + 1}. {q.question_text}</h2>
              <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
                {(['A', 'B', 'C', 'D'] as const).map((key) => (
                  <p key={key} className={key === q.correct_answer ? 'font-bold text-emerald-700' : ''}>{key}. {q.options[key]}</p>
                ))}
              </div>
              {q.explanation && <p className="mt-3 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">{q.explanation}</p>}
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="h-[480px] space-y-3 overflow-y-auto bg-slate-50 p-4">
            {chats.length === 0 && <p className="text-center text-sm text-slate-500">Tanya isi Dokumen ini, misalnya “Ringkas poin utama” atau “Buat contoh soal dari bab 2”.</p>}
            {chats.map((chat) => (
              <div key={chat.id} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${chat.role === 'user' ? 'rounded-br-sm bg-brand-600 text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'}`}>{chat.message}</p>
              </div>
            ))}
            {loadingChat && <p className="text-sm text-slate-500">AI sedang mengetik...</p>}
          </div>
          <div className="flex gap-2 border-t border-slate-200 p-3">
            <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendChat()} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-brand-500" placeholder="Tanya tentang Dokumen..." />
            <Button type="button" onClick={sendChat} disabled={!message.trim() || loadingChat}><Send className="h-4 w-4" /></Button>
          </div>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="flex items-center gap-2 font-black text-slate-950"><Share2 className="h-4 w-4 text-brand-600" /> Share ke Tim</h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="">Pilih tim</option>
            {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
          <Button type="button" onClick={shareToTeam} disabled={!selectedTeam}>Share</Button>
        </div>
      </section>

      {summaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-black text-slate-950">Ringkasan PDF</h2>
              <button onClick={() => setSummaryOpen(false)} className="text-slate-400">Tutup</button>
            </div>
            <div className="mt-4 whitespace-pre-wrap rounded-lg bg-slate-50 p-4 text-sm leading-7 text-slate-700">
              {summaryLoading ? 'Membuat ringkasan...' : doc?.summary || 'Belum ada ringkasan.'}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => navigator.clipboard.writeText(doc?.summary || '')}><Copy className="h-4 w-4" />Copy</Button>
              <Button type="button" onClick={downloadSummaryPdf}><Download className="h-4 w-4" />Download PDF</Button>
            </div>
          </div>
        </div>
      )}

      <ProUpgradeModal open={Boolean(upgradeFeature)} feature={upgradeFeature} onClose={() => setUpgradeFeature('')} />
    </div>
  )
}
