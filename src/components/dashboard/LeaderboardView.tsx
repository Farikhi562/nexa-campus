'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Crown, Flame, Loader2, Medal, RefreshCw, TrendingUp, Trophy } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { Card, CardContent } from '@/components/ui/Card'
import type { LeaderboardEntry, LeaderboardMe, LeaderboardScope } from '@/types'

type ApiResponse = {
  scope: LeaderboardScope
  entries: LeaderboardEntry[]
  me: LeaderboardMe | null
  setup?: boolean
  error?: string
}

const scopes: Array<{ key: LeaderboardScope; label: string }> = [
  { key: 'weekly', label: 'Minggu ini' },
  { key: 'monthly', label: 'Bulan ini' },
  { key: 'all_time', label: 'Semua waktu' },
]

function initials(name?: string | null) {
  if (!name) return 'N'
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || 'N'
}

function Avatar({
  url,
  name,
  size = 'md',
}: {
  url?: string | null
  name?: string | null
  size?: 'md' | 'lg'
}) {
  const dim = size === 'lg' ? 'h-16 w-16 text-lg' : 'h-11 w-11 text-sm'
  return (
    <span
      className={`flex ${dim} flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 font-black text-slate-700 ring-1 ring-slate-200`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  )
}

const podiumStyles = [
  {
    ring: 'ring-amber-300',
    bg: 'from-amber-50 to-white',
    icon: 'text-amber-500',
    order: 'order-2 -mt-2',
  },
  {
    ring: 'ring-slate-300',
    bg: 'from-slate-50 to-white',
    icon: 'text-slate-400',
    order: 'order-1 mt-4',
  },
  {
    ring: 'ring-orange-300',
    bg: 'from-orange-50 to-white',
    icon: 'text-orange-400',
    order: 'order-3 mt-4',
  },
]

export default function LeaderboardView({ currentUserId }: { currentUserId: string }) {
  const [scope, setScope] = useState<LeaderboardScope>('weekly')
  const [data, setData] = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (nextScope: LeaderboardScope) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/leaderboard?scope=${nextScope}`, { cache: 'no-store' })
      const json = (await res.json()) as ApiResponse
      if (!res.ok) {
        setError(json.error || 'Leaderboard gagal dimuat.')
        setData(null)
      } else {
        setData(json)
      }
    } catch {
      setError('Leaderboard gagal dimuat. Coba lagi sebentar.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(scope)
  }, [scope, load])

  const entries = data?.entries ?? []
  const podium = entries.slice(0, 3)
  const rest = entries.slice(3)
  const me = data?.me ?? null

  const aheadPoints = me?.rank && me.rank > 1 ? (entries[me.rank - 2]?.points ?? null) : null
  const pointsToClimb = aheadPoints != null && me ? Math.max(1, aheadPoints - me.points + 1) : 0

  return (
    <div className="space-y-5">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(45,212,191,0.28),transparent_20rem)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_90%,rgba(251,191,36,0.18),transparent_18rem)]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-300/10 px-3 py-1.5 text-xs font-black text-teal-100">
              <Trophy className="h-3.5 w-3.5" />
              NEXA Leaderboard
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Naik peringkat. Jangan ketinggalan.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Tiap deadline yang kamu catat & selesaikan = poin. Selesai tepat waktu = bonus. Saingi
              mahasiswa lain.
            </p>
          </div>
          <button
            onClick={() => load(scope)}
            className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/15"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </section>

      {/* Your rank — FOMO */}
      {me && me.points > 0 ? (
        <Card className="border-teal-100 bg-gradient-to-br from-teal-50/70 to-white">
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-slate-950 text-white">
                <span className="text-[10px] font-bold uppercase tracking-wide text-teal-300">
                  Rank
                </span>
                <span className="text-xl font-black leading-none">
                  {me.rank ? `#${me.rank}` : '—'}
                </span>
              </div>
              <div>
                <p className="text-lg font-black text-slate-950">{me.points} poin</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    {me.current_streak} hari streak
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>{me.total_players} peserta</span>
                </p>
              </div>
            </div>
            {pointsToClimb > 0 && me.rank ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900">
                <span className="inline-flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  {pointsToClimb} poin lagi buat salip #{me.rank - 1}!
                </span>
              </div>
            ) : me.rank === 1 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800">
                <span className="inline-flex items-center gap-1.5">
                  <Crown className="h-4 w-4" /> Kamu juara! Pertahankan.
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 text-sm font-bold leading-6 text-amber-900 sm:p-5">
            {me && !me.is_public
              ? 'Profilmu di-set privat, jadi kamu tidak tampil di papan publik. Aktifkan "Tampil di leaderboard" di profil untuk ikut bersaing.'
              : 'Kamu belum punya poin di periode ini. Catat & selesaikan deadline untuk naik —'}
            {(!me || me.is_public) && (
              <Link href="/dashboard/deadlines/new" className="ml-1 underline">
                tambah deadline sekarang.
              </Link>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scope tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {scopes.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setScope(key)}
            className={`focus-ring inline-flex min-h-10 flex-shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
              scope === key
                ? 'bg-slate-950 text-white shadow-lg'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-10 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : data?.setup ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6 text-center text-sm leading-6 text-amber-900">
            Leaderboard belum aktif. Minta admin menjalankan{' '}
            <span className="font-black">supabase/setup_all.sql</span> di Supabase SQL Editor, lalu
            coba lagi.
          </CardContent>
        </Card>
      ) : entries.length === 0 && !error ? (
        <Card>
          <CardContent className="p-6 text-center text-sm leading-6 text-slate-600">
            Belum ada yang punya poin di periode ini. Jadilah yang pertama!
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Podium */}
          {podium.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {podium.map((entry, index) => {
                const style = podiumStyles[index]
                const isMe = entry.user_id === currentUserId
                return (
                  <Card
                    key={entry.user_id}
                    className={`bg-gradient-to-b ${style.bg} ${style.order} ring-2 ${style.ring}`}
                  >
                    <CardContent className="flex flex-col items-center p-3 text-center sm:p-4">
                      <div className="relative">
                        <Avatar url={entry.avatar_url} name={entry.display_name} size="lg" />
                        <span
                          className={`absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white text-xs font-black shadow ring-1 ring-slate-200 ${style.icon}`}
                        >
                          {index === 0 ? <Crown className="h-4 w-4" /> : index + 1}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-1 text-sm font-black text-slate-950">
                        {entry.display_name}
                        {isMe ? ' (kamu)' : ''}
                      </p>
                      <p className="line-clamp-1 text-[11px] text-slate-500">
                        {entry.campus_name || 'Kampus —'}
                      </p>
                      <p className="mt-2 text-lg font-black text-slate-950">{entry.points}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                        poin
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Rest of list */}
          {rest.length > 0 && (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {rest.map((entry) => {
                    const isMe = entry.user_id === currentUserId
                    return (
                      <div
                        key={entry.user_id}
                        className={`flex items-center justify-between gap-3 p-3 sm:p-4 ${isMe ? 'bg-teal-50/60' : 'hover:bg-slate-50'}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="w-7 text-center text-sm font-black text-slate-400">
                            {entry.rank}
                          </span>
                          <Avatar url={entry.avatar_url} name={entry.display_name} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-slate-950">
                              {entry.display_name}
                              {isMe ? ' (kamu)' : ''}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {entry.campus_name || 'Kampus —'}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-3">
                          {entry.plan !== 'radar' && (
                            <Medal className="hidden h-4 w-4 text-teal-500 sm:block" />
                          )}
                          <span className="text-sm font-black text-slate-950">{entry.points}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <p className="px-1 text-center text-xs leading-5 text-slate-400">
        Poin: catat deadline +2, selesaikan +10, tepat waktu +5 bonus. Atur privasi tampil di
        leaderboard lewat profil. Email kamu tidak pernah ditampilkan.
      </p>
    </div>
  )
}
