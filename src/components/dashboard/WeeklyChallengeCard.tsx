'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CheckCircle2, Flame, Loader2, Trophy } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

type Mission = {
  id: string
  label: string
  current: number
  goal: number
  href: string
  reward: string
}

type Data = {
  weekLabel: string
  done: number
  total: number
  missions: Mission[]
  rewardClaimed?: boolean
}

export default function WeeklyChallengeCard() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch('/api/weekly-challenge', { cache: 'no-store' })
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => { if (active) setData(ok ? json : null) })
      .catch(() => { if (active) setData(null) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) {
    return <Card><CardContent className="flex h-40 items-center justify-center text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></CardContent></Card>
  }

  if (!data) return null
  const pct = Math.round((data.done / Math.max(1, data.total)) * 100)

  return (
    <Card className="border-amber-100 bg-gradient-to-br from-white via-amber-50/60 to-teal-50">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
              <Flame className="h-3.5 w-3.5" /> Weekly Challenge
            </div>
            <h2 className="text-lg font-black text-slate-950">Race minggu ini · {data.weekLabel}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">Selesaikan misi mingguan buat ngejar badge dan poin. Karena rupanya progress bar lebih efektif daripada ceramah motivasi.</p>
          </div>
          <Badge tone={data.done === data.total ? 'success' : 'warning'}>{data.done}/{data.total} selesai</Badge>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-teal-400" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {data.missions.map((mission) => {
            const complete = mission.current >= mission.goal
            return (
              <Link key={mission.id} href={mission.href} className="rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-950">{mission.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{mission.current}/{mission.goal} · {mission.reward}</p>
                  </div>
                  {complete ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Trophy className="h-5 w-5 text-slate-300" />}
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
