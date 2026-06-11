'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Flame, Trophy } from 'lucide-react'

type TeaserData = {
  rank: number | null
  points: number
  currentStreak: number
}

export default function LeaderboardTeaser() {
  const [data, setData] = useState<TeaserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/leaderboard?scope=weekly', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => {
        if (!active) return
        const me = json?.me ?? null
        setData({
          rank: me?.rank ?? null,
          points: me?.points ?? 0,
          currentStreak: me?.current_streak ?? 0,
        })
      })
      .catch(() => null)
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  return (
    <Link
      href="/dashboard/leaderboard"
      className="focus-ring group relative block overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-4 text-white shadow-xl transition hover:-translate-y-0.5 sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(251,191,36,0.22),transparent_16rem)]" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 animate-float">
            <Trophy className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-300">Leaderboard · Minggu ini</p>
            {loading ? (
              <p className="mt-0.5 text-base font-black text-white">Memuat peringkat…</p>
            ) : data?.rank ? (
              <p className="mt-0.5 text-base font-black text-white">
                Kamu peringkat #{data.rank} · {data.points} poin
              </p>
            ) : (
              <p className="mt-0.5 text-base font-black text-white">Belum punya poin minggu ini. Mulai dari check-in atau selesaikan deadline.</p>
            )}
            {data && (
              <p className={`mt-0.5 inline-flex items-center gap-1 text-xs font-bold ${
                data.currentStreak > 0 ? 'text-orange-300' : 'text-slate-400'
              }`}>
                {data.currentStreak > 0 ? (
                  <><Flame className="h-3.5 w-3.5" /> {data.currentStreak} hari streak. Pertahankan.</>
                ) : (
                  <>Mulai streak baru dengan check-in atau menyelesaikan deadline hari ini</>
                )}
              </p>
            )}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-white" />
      </div>
    </Link>
  )
}
