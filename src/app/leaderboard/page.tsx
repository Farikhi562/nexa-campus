'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type UserRank = {
  user_id: string
  total_exams: number
  avg_score: number
  current_streak: number
  profiles: { full_name: string | null; avatar_url: string | null; universitas: string | null } | null
}

type NationalRank = {
  university: string
  avgScore: number
  totalExams: number
  users: number
}

export default function LeaderboardPage() {
  const supabase = useMemo(() => createClient(), [])
  const [tab, setTab] = useState<'kampus' | 'nasional'>('kampus')
  const [me, setMe] = useState<{ id: string; universitas: string | null } | null>(null)
  const [rows, setRows] = useState<UserRank[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('profiles').select('universitas').eq('id', user.id).single()
    setMe({ id: user.id, universitas: profile?.universitas ?? null })

    const { data } = await supabase
      .from('leaderboard_stats')
      .select('*, profiles(full_name, avatar_url, universitas, is_public_profile)')
      .order('avg_score', { ascending: false })
      .order('total_exams', { ascending: false })

    setRows(((data ?? []) as UserRank[]).filter((row) => row.profiles))
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const campusRows = rows.filter((row) => row.profiles?.universitas && row.profiles.universitas === me?.universitas)
  const visibleCampus = campusRows.slice(0, 10)
  const myCampusRank = campusRows.findIndex((row) => row.user_id === me?.id) + 1

  const nationalRows: NationalRank[] = Object.values(rows.reduce<Record<string, NationalRank>>((acc, row) => {
    const university = row.profiles?.universitas || 'Kampus tidak diketahui'
    const current = acc[university] ?? { university, avgScore: 0, totalExams: 0, users: 0 }
    current.avgScore += row.avg_score
    current.totalExams += row.total_exams
    current.users += 1
    acc[university] = current
    return acc
  }, {}))
    .map((row) => ({ ...row, avgScore: Math.round(row.avgScore / Math.max(1, row.users)) }))
    .sort((a, b) => b.avgScore - a.avgScore || b.totalExams - a.totalExams)
    .slice(0, 10)

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
          <Trophy className="h-4 w-4" />
          Leaderboard Antar Kampus
        </div>
        <h1 className="text-3xl font-black text-slate-950">Rank belajar NEXA Campus Ecosystem</h1>
        <p className="mt-2 text-sm text-slate-600">Hanya profil yang opt-in publik yang tampil di leaderboard.</p>
      </section>

      <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {[
          ['kampus', 'Kampusku'],
          ['nasional', 'Nasional'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={`rounded-lg px-4 py-2 text-sm font-black ${tab === id ? 'bg-brand-600 text-white' : 'text-slate-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="rounded-xl bg-white p-8 text-center text-slate-500">Memuat leaderboard...</div>
      ) : tab === 'kampus' ? (
        <section className="space-y-3">
          {visibleCampus.map((row, index) => (
            <RankCard key={row.user_id} rank={index + 1} row={row} />
          ))}
          {myCampusRank > 10 && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm font-black text-brand-900">
              Kamu: #{myCampusRank} dari {campusRows.length} mahasiswa
            </div>
          )}
          {myCampusRank > 0 && myCampusRank <= 10 && (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm font-black text-brand-900">
              Kamu: #{myCampusRank} dari {campusRows.length} mahasiswa
            </div>
          )}
          {visibleCampus.length === 0 && <div className="rounded-xl bg-white p-8 text-center text-slate-500">Belum ada ranking untuk kampusmu.</div>}
        </section>
      ) : (
        <section className="space-y-3">
          {nationalRows.map((row, index) => (
            <div key={row.university} className="grid grid-cols-[48px_1fr_auto] items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xl font-black text-slate-400">#{index + 1}</div>
              <div>
                <p className="font-black text-slate-950">{row.university}</p>
                <p className="text-sm text-slate-500">{row.users} user publik - {row.totalExams} exam</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-brand-700">{row.avgScore}</p>
                <p className="text-xs text-slate-500">avg score</p>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}

function RankCard({ rank, row }: { rank: number; row: UserRank }) {
  const name = row.profiles?.full_name || 'Mahasiswa NEXA'
  return (
    <div className="grid grid-cols-[48px_44px_1fr_auto] items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xl font-black text-slate-400">#{rank}</div>
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-brand-100 font-black text-brand-700">
        {row.profiles?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={row.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : name.charAt(0)}
      </div>
      <div>
        <p className="font-black text-slate-950">{name}</p>
        <p className="text-sm text-slate-500">{row.profiles?.universitas || 'Kampus belum diisi'}</p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-black text-brand-700">{row.avg_score}</p>
        <p className="text-xs text-slate-500">{row.total_exams} exam - 🔥 {row.current_streak}</p>
      </div>
    </div>
  )
}
