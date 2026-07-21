'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, BarChart3, CheckCircle2, Clock3, Loader2, Sparkles, Target, TrendingDown, TrendingUp } from 'lucide-react'

 type ReviewData = {
  range: { startDate: string; endDate: string }
  metrics: {
    due: number
    completed: number
    overdue: number
    focusMinutes: number
    focusSessions: number
    checkins: number
    goalsCompleted: number
    completionRate: number
    goalRate: number
  }
  trends: { completed: number; focusMinutes: number; completionRate: number }
  recommendation: { title: string; body: string; actionLabel: string; actionHref: string }
}

function Trend({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-black ${positive ? 'text-emerald-600' : 'text-red-600'}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? '+' : ''}{value}%
    </span>
  )
}

export default function WeeklyReviewCard() {
  const [data, setData] = useState<ReviewData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/weekly-review', { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json().catch(() => null)
        if (!response.ok || !result?.data) throw new Error(result?.error || 'Weekly Review gagal dimuat.')
        if (active) setData(result.data)
      })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : 'Weekly Review gagal dimuat.') })
    return () => { active = false }
  }, [])

  if (error) return null

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
      <div className="border-b border-slate-100 bg-slate-950 p-5 text-white sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-blue-200">
              <BarChart3 className="h-3.5 w-3.5" /> Weekly Review
            </div>
            <h2 className="mt-3 text-xl font-black sm:text-2xl">Minggu lu sebenarnya produktif apa cuma sibuk?</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Ringkasan tujuh hari, karena perasaan “kayaknya gue produktif” tidak diterima sebagai data.</p>
          </div>
          {data && <p className="text-xs font-bold text-slate-400">{data.range.startDate} sampai {data.range.endDate}</p>}
        </div>
      </div>

      {!data ? (
        <div className="flex min-h-48 items-center justify-center gap-2 text-sm font-bold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Menghitung jejak produktivitas...
        </div>
      ) : (
        <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)] sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="mt-3 text-2xl font-black text-slate-950">{data.metrics.completed}/{data.metrics.due}</p>
              <div className="mt-1 flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-500">Deadline selesai</span><Trend value={data.trends.completed} /></div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <Target className="h-5 w-5 text-blue-600" />
              <p className="mt-3 text-2xl font-black text-slate-950">{data.metrics.completionRate}%</p>
              <div className="mt-1 flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-500">Completion rate</span><Trend value={data.trends.completionRate} /></div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <Clock3 className="h-5 w-5 text-orange-600" />
              <p className="mt-3 text-2xl font-black text-slate-950">{data.metrics.focusMinutes}</p>
              <div className="mt-1 flex items-center justify-between gap-2"><span className="text-xs font-bold text-slate-500">Menit fokus</span><Trend value={data.trends.focusMinutes} /></div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <Sparkles className="h-5 w-5 text-violet-600" />
              <p className="mt-3 text-2xl font-black text-slate-950">{data.metrics.goalRate}%</p>
              <p className="mt-1 text-xs font-bold text-slate-500">Target harian tercapai</p>
            </div>
          </div>

          <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
            <p className="text-xs font-black uppercase tracking-wide text-orange-700">Rekomendasi berikutnya</p>
            <h3 className="mt-2 text-lg font-black text-slate-950">{data.recommendation.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{data.recommendation.body}</p>
            <Link href={data.recommendation.actionHref} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-slate-800">
              {data.recommendation.actionLabel} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </section>
  )
}
