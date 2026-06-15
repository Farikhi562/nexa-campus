'use client'

import { useEffect, useState } from 'react'
import { Trophy, Medal, Loader2, Users } from 'lucide-react'

type Team = {
  post_id: string
  title: string
  competition_name: string | null
  competition_type: string
  campus_name: string | null
  placement: string
  verified: boolean
  member_count: number
  members_points: number
  team_score: number
  rank: number
}

type Badge = {
  post_id: string
  title: string
  competition_name: string | null
  placement: string
  verified: boolean
  badge_label: string
  created_at: string
}

const TYPES = [
  { value: '', label: 'Semua' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'bisnis', label: 'Bisnis' },
  { value: 'saintek', label: 'Saintek' },
  { value: 'desain', label: 'Desain' },
  { value: 'akademik', label: 'Akademik' },
  { value: 'esport', label: 'E-sport' },
]

function placementBadge(p: string) {
  switch (p) {
    case 'juara_1': return { label: '🥇 Juara 1', cls: 'bg-amber-100 text-amber-800' }
    case 'juara_2': return { label: '🥈 Juara 2', cls: 'bg-slate-200 text-slate-700' }
    case 'juara_3': return { label: '🥉 Juara 3', cls: 'bg-orange-100 text-orange-800' }
    case 'finalist': return { label: '🏅 Finalist', cls: 'bg-teal-100 text-teal-800' }
    default: return { label: '🎫 Peserta', cls: 'bg-slate-100 text-slate-500' }
  }
}

function rankColor(rank: number) {
  if (rank === 1) return 'text-amber-500'
  if (rank === 2) return 'text-slate-400'
  if (rank === 3) return 'text-orange-400'
  return 'text-slate-300'
}

export default function ArenaLeaderboard() {
  const [teams, setTeams] = useState<Team[]>([])
  const [myBadges, setMyBadges] = useState<Badge[]>([])
  const [type, setType] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    fetch(`/api/arena/leaderboard?type=${encodeURIComponent(type)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return
        if (data.error) { setError(data.error); return }
        setTeams(data.teams ?? [])
        setMyBadges(data.myBadges ?? [])
      })
      .catch(() => active && setError('Gagal memuat leaderboard.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [type])

  return (
    <div className="space-y-5">
      {/* Badge kompetisi milik user */}
      {myBadges.length > 0 && (
        <div className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/40 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-black text-slate-950">
            <Medal className="h-4 w-4 text-teal-600" /> Badge Kompetisi Kamu
          </h3>
          <div className="flex flex-wrap gap-2">
            {myBadges.map((b) => (
              <span
                key={b.post_id}
                title={b.competition_name || b.title}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold ${placementBadge(b.placement).cls}`}
              >
                {b.badge_label}
                <span className="font-normal opacity-70">· {b.competition_name || b.title}</span>
                {b.verified && <span className="text-emerald-600">✓</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              type === t.value
                ? 'bg-teal-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-teal-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Leaderboard tim */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Trophy className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-black text-slate-950">Leaderboard Tim</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
          </div>
        ) : error ? (
          <p className="px-4 py-8 text-center text-sm text-red-600">{error}</p>
        ) : teams.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            Belum ada tim yang terbentuk untuk kategori ini.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {teams.map((t) => {
              const pb = placementBadge(t.placement)
              return (
                <li key={t.post_id} className="flex items-center gap-3 px-4 py-3">
                  <span className={`w-7 flex-none text-center text-lg font-black ${rankColor(t.rank)}`}>
                    {t.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">
                      {t.competition_name || t.title}
                    </p>
                    <p className="flex items-center gap-2 truncate text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {t.member_count}</span>
                      <span>·</span>
                      <span>{t.members_points.toLocaleString('id-ID')} poin</span>
                      {t.campus_name && <><span>·</span><span className="truncate">{t.campus_name}</span></>}
                    </p>
                  </div>
                  <span className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-bold ${pb.cls}`}>
                    {pb.label}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
