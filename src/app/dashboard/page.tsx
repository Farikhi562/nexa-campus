'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DocumentCard from '@/components/DocumentCard'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/EmptyState'
import OnboardingOverlay from '@/components/OnboardingOverlay'
import { Plus, BookOpen, Trophy, TrendingUp, Lock, Edit3, User, Award, Sparkles, Store, BellRing, CreditCard, Flame } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import Link from 'next/link'
import type { Document, Profile, Plan } from '@/types'
import { PLAN_LIMITS } from '@/types'
import { hasProAccess } from '@/lib/plans'

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const [profile, setProfile]     = useState<Profile | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats]         = useState({ totalSessions: 0, avgScore: 0, bestScore: 0, streak: 0 })
  const [scoreHistory, setScoreHistory] = useState<Array<{ name: string; score: number }>>([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Document['status']>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'questions'>('newest')
  const [loading, setLoading]     = useState(true)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, docsRes, sessionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase
        .from('exam_sessions')
        .select('score, status, completed_at, document:documents(title)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false }),
    ])

    if (profileRes.data) setProfile(profileRes.data as Profile)
    if (docsRes.data)    setDocuments(docsRes.data as Document[])
    setShowOnboarding(Boolean(profileRes.data && !profileRes.data.onboarding_completed && (docsRes.data?.length ?? 0) === 0))

    if (sessionsRes.data && sessionsRes.data.length > 0) {
      const scores = sessionsRes.data.map(s => s.score ?? 0)
      const recent = [...sessionsRes.data].reverse().slice(-7)
      setScoreHistory(recent.map((session, index) => {
        const documentInfo = (session as { document?: unknown }).document
        const title = Array.isArray(documentInfo)
          ? (documentInfo[0] as { title?: string } | undefined)?.title
          : (documentInfo as { title?: string } | undefined)?.title
        return {
          name: title?.slice(0, 16) || `Exam ${index + 1}`,
          score: session.score ?? 0,
        }
      }))

      const today = new Date()
      let streak = 0
      const doneDates = new Set(sessionsRes.data
        .filter((session) => session.completed_at)
        .map((session) => new Date(session.completed_at!).toISOString().slice(0, 10)))
      while (doneDates.has(today.toISOString().slice(0, 10))) {
        streak++
        today.setDate(today.getDate() - 1)
      }

      setStats({
        totalSessions: scores.length,
        avgScore:      Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        bestScore:     Math.max(...scores),
        streak,
      })
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Poll processing docs every 5s
  useEffect(() => {
    const hasProcessing = documents.some(d => d.status === 'processing' || d.status === 'pending')
    if (!hasProcessing) return
    const t = setInterval(fetchData, 5000)
    return () => clearInterval(t)
  }, [documents, fetchData])

  async function handleDelete(docId: string) {
    if (!confirm('Hapus dokumen ini? Soal dan sesi ujian terkait juga akan dihapus.')) return
    await supabase.from('documents').delete().eq('id', docId)
    setDocuments(prev => prev.filter(d => d.id !== docId))
  }

  async function handleStartExam(docId: string) {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: docId }),
    })
    const { data, error } = await res.json()
    if (error) { alert(error); return }
    router.push(`/exam/${data.sessionId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Memuat dashboard...</p>
        </div>
      </div>
    )
  }

  const plan          = (profile?.plan ?? 'free') as Plan
  const limits        = PLAN_LIMITS[plan]
  const docCount      = documents.length
  const maxDocs       = limits.maxDocuments
  const canAddMore    = maxDocs === null || docCount < maxDocs
  const visibleDocuments = documents
    .filter((doc) => {
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter
      const matchesSearch = doc.title.toLowerCase().includes(debouncedSearch.toLowerCase().trim())
      return matchesStatus && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sortBy === 'questions') return (b.question_count ?? 0) - (a.question_count ?? 0)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const weakness = profile?.weakness_analysis
  const canSeeAiAnalysis = hasProAccess(profile) && stats.totalSessions >= 3

  return (
    <div className="min-h-screen text-slate-100">
      {profile && showOnboarding && (
        <OnboardingOverlay
          profile={profile}
          onComplete={() => {
            setShowOnboarding(false)
            setProfile((current) => current ? { ...current, onboarding_completed: true } : current)
          }}
        />
      )}
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-white">
                Halo, {profile?.full_name?.split(' ')[0] || 'Mahasiswa'}
              </h1>
              <p className="text-slate-300 mt-1">Kelola belajarmu dan tingkatkan performa akademik</p>
            </div>
            <Button
              onClick={() => canAddMore ? router.push('/dashboard/upload') : alert('Batas dokumen tercapai. Upgrade paketmu!')}
              disabled={!canAddMore}
              className="flex-shrink-0 shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Upload Materi Baru
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Profile Card */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#4F8EF7] to-[#A78BFA] p-8 text-white shadow-2xl shadow-blue-500/20">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white bg-opacity-20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">{profile?.full_name || 'Lengkapi Profil'}</h2>
                <div className="space-y-0.5 text-white text-opacity-90 text-sm">
                  {profile?.jurusan && <p>Jurusan: {profile.jurusan}</p>}
                  {profile?.universitas && <p>Kampus: {profile.universitas}</p>}
                  {profile?.provinsi && <p>Provinsi: {profile.provinsi}</p>}
                </div>
              </div>
            </div>
            <Link href="/dashboard/profile">
              <Button variant="secondary" className="bg-white text-brand-700 hover:bg-blue-50">
                <Edit3 className="w-4 h-4" />
                Edit Profil
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { 
              icon: BookOpen, 
              label: 'Materi Belajar', 
              value: docCount,
              sub: `${maxDocs ? `${docCount}/${maxDocs}` : 'Tak terbatas'}`,
              color: 'from-brand-500 to-brand-600',
              lightColor: 'from-brand-50 to-brand-100'
            },
            { 
              icon: Trophy, 
              label: 'Sesi Ujian', 
              value: stats.totalSessions,
              sub: 'Selesai',
              color: 'from-orange-500 to-red-500',
              lightColor: 'from-orange-50 to-red-50'
            },
            { 
              icon: TrendingUp, 
              label: 'Rata-Rata Score', 
              value: stats.totalSessions ? `${stats.avgScore}%` : '-',
              sub: 'dari 100',
              color: 'from-green-500 to-emerald-500',
              lightColor: 'from-green-50 to-emerald-50'
            },
            { 
              icon: Award, 
              label: 'Best Score', 
              value: stats.totalSessions ? `${stats.bestScore}%` : '-',
              sub: 'Tertinggi',
              color: 'from-cyan-500 to-blue-500',
              lightColor: 'from-cyan-50 to-blue-50'
            },
            {
              icon: Flame,
              label: 'Streak Belajar',
              value: stats.streak,
              sub: 'hari berturut-turut',
              color: 'from-red-500 to-orange-500',
              lightColor: 'from-red-50 to-orange-50'
            },
          ].map(({ icon: Icon, label, value, sub, color, lightColor }) => (
            <div key={label} className="nexa-card p-6">
              <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-slate-300 mb-1">{label}</p>
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-xs text-slate-400 mt-2">{sub}</p>
            </div>
          ))}
        </div>

        <div className="nexa-card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white">Grafik Score</h2>
              <p className="mt-1 text-sm text-slate-400">7 exam terakhir</p>
            </div>
          </div>
          <div className="h-64">
            {scoreHistory.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-500">
                Selesaikan exam pertama untuk melihat grafik.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {canSeeAiAnalysis && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-amber-700">Analisis AI Pro</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">Analisis Kelemahanmu</h2>
              </div>
              <Sparkles className="h-6 w-6 text-amber-600" />
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm font-black text-slate-950">Kelemahanmu</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {weakness?.weakTopics?.length ? weakness.weakTopics.join(', ') : 'Selesaikan beberapa exam lagi agar AI bisa membaca pola topik yang paling sering salah.'}
                </p>
              </div>
              <div className="rounded-xl bg-white p-4">
                <p className="text-sm font-black text-slate-950">Rekomendasi</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {weakness?.recommendations?.length ? weakness.recommendations.slice(0, 2).join(' ') : 'Review pembahasan soal yang salah, ulangi latihan dari dokumen yang sama, lalu cek tren skor setelah 5 exam baru.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sales-ready quick actions */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: 'Campus Tools',
              desc: '15 tools akademik untuk IPK, sitasi, planner, karier, dan habit.',
              icon: Sparkles,
              href: '/dashboard/tools',
            },
            {
              title: 'Marketplace',
              desc: 'Cari barang/jasa kampus. Basic dan Pro bisa buka lapak.',
              icon: Store,
              href: '/dashboard/marketplace',
            },
            {
              title: 'Smart Reminder',
              desc: 'Atur tugas, praktikum, kuis, presentasi, dan ujian.',
              icon: BellRing,
              href: '/dashboard/jadwal',
            },
          ].map(({ title, desc, icon: Icon, href }) => (
            <Link key={title} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
              <Icon className="mb-4 h-6 w-6 text-brand-600" />
              <h3 className="font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Documents Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Materi Belajarku</h2>
              <p className="text-slate-600 text-sm mt-1">Kelola dokumen dan mulai ujian</p>
            </div>
            {!canAddMore && (
              <div className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                <span className="flex items-center gap-2 text-orange-700 text-sm font-medium">
                  <Lock className="w-4 h-4" />
                  Batas tercapai
                </span>
              </div>
            )}
          </div>

          {documents.length === 0 ? (
            <EmptyState
              variant="documents"
              title="Belum ada materi nih! Upload PDF pertamamu yuk"
              description="PDF akan diproses OCR dan AI supaya bisa jadi soal latihan otomatis."
              actionLabel="Upload PDF Pertama"
              href="/dashboard/upload"
            />
          ) : (
            <>
              <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari judul materi..."
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm">
                  <option value="all">Semua status</option>
                  <option value="pending">Processing</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Ready</option>
                  <option value="error">Error</option>
                </select>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm">
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                  <option value="questions">Jumlah soal</option>
                </select>
              </div>
              <p className="mb-4 text-sm font-semibold text-slate-500">Menampilkan {visibleDocuments.length} dari {documents.length} materi</p>
              {visibleDocuments.length === 0 ? (
                <EmptyState
                  variant="search"
                  title="Tidak ada materi dengan kata kunci ini"
                  actionLabel="Clear Search"
                  onAction={() => { setSearch(''); setStatusFilter('all') }}
                />
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleDocuments.map(doc => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onDelete={handleDelete}
                      onStartExam={handleStartExam}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Upgrade CTA */}
        {plan === 'free' && (
          <div className="bg-gradient-to-r from-brand-600 to-cyan-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                  <CreditCard className="h-3.5 w-3.5" />
                  Paket paling laku: Basic Rp19.000/bulan
                </div>
                <h3 className="text-2xl font-bold mb-2">Upgrade untuk buka fitur yang bisa langsung terasa</h3>
                <p className="text-blue-100 max-w-xl">
                  Basic membuka mock exam tak terbatas, export PDF, 5 Campus Tools, dan lapak marketplace. Pro membuka semua tool AI, Chat PDF, analisis kelemahan, tim belajar, dan room private.
                </p>
              </div>
              <Link href="/pricing">
                <Button variant="secondary" className="text-brand-700 font-semibold flex-shrink-0">
                  Lihat Paket
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
