'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DocumentCard from '@/components/DocumentCard'
import Button from '@/components/ui/Button'
import { Plus, BookOpen, Trophy, TrendingUp, Lock, Edit3, User, Award, Sparkles, Store, BellRing, CreditCard } from 'lucide-react'
import Link from 'next/link'
import type { Document, Profile, Plan } from '@/types'
import { PLAN_LIMITS } from '@/types'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile]     = useState<Profile | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [stats, setStats]         = useState({ totalSessions: 0, avgScore: 0, bestScore: 0 })
  const [loading, setLoading]     = useState(true)

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, docsRes, sessionsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('documents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('exam_sessions').select('score, status').eq('user_id', user.id).eq('status', 'completed'),
    ])

    if (profileRes.data) setProfile(profileRes.data as Profile)
    if (docsRes.data)    setDocuments(docsRes.data as Document[])

    if (sessionsRes.data && sessionsRes.data.length > 0) {
      const scores = sessionsRes.data.map(s => s.score ?? 0)
      setStats({
        totalSessions: scores.length,
        avgScore:      Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        bestScore:     Math.max(...scores),
      })
    }

    setLoading(false)
  }, [supabase])

  useEffect(() => { fetchData() }, [fetchData])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Halo, {profile?.full_name?.split(' ')[0] || 'Mahasiswa'}
              </h1>
              <p className="text-slate-600 mt-1">Kelola belajarmu dan tingkatkan performa akademik</p>
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
        <div className="bg-gradient-brand rounded-2xl p-8 text-white shadow-lg">
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
          ].map(({ icon: Icon, label, value, sub, color, lightColor }) => (
            <div key={label} className={`bg-gradient-to-br ${lightColor} border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all`}>
              <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-slate-600 mb-1">{label}</p>
              <p className="text-3xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 mt-2">{sub}</p>
            </div>
          ))}
        </div>

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
            <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-brand-100 to-brand-50 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-brand-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2 text-lg">Mulai Upload Materi Belajarmu</h3>
              <p className="text-slate-600 mb-6 max-w-sm mx-auto">
                Upload PDF, image, atau dokumen lainnya untuk mulai membuat soal ujian dengan bantuan AI.
              </p>
              <Button onClick={() => router.push('/dashboard/upload')} className="mx-auto">
                <Plus className="w-4 h-4" />
                Upload Materi Pertama
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onDelete={handleDelete}
                  onStartExam={handleStartExam}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        {plan === 'free' && (
          <div className="bg-gradient-to-r from-brand-600 to-cyan-600 rounded-2xl p-8 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                  <CreditCard className="h-3.5 w-3.5" />
                  Paket paling laku: Basic Rp15.000/bulan
                </div>
                <h3 className="text-2xl font-bold mb-2">Upgrade untuk buka fitur yang bisa langsung terasa</h3>
                <p className="text-blue-100 max-w-xl">
                  Basic membuka mock exam tak terbatas, export PDF, dan lapak marketplace. Pro membuka smart reminder otomatis dan study room.
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
