'use client'

import { useEffect, useState } from 'react'
import { BrainCircuit, CheckCircle2, Loader2, TrendingDown, TrendingUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type InsightData =
  | { enoughData: false; sampleSize: number; minSample: number }
  | {
      enoughData: true
      sampleSize: number
      peakHour: number
      peakDayLabel: string
      suggestedTime: string
      recentRate: number | null
      olderRate: number | null
      trendDelta: number | null
    }

/**
 * "NEXA belajar dari histori kamu" — jujur: ini bukan AI/ML, cuma agregasi
 * dari deadline yang sudah pernah diselesaikan sendiri (jam berapa paling
 * sering, tren completion rate), terus dipakai buat 1 saran konkret. Makin
 * banyak histori, makin akurat saran jam remindernya — makanya kalau data
 * masih sedikit, kartu ini nunjukin progress "X/5" bukan maksa nyaranin
 * sesuatu dari data yang belum cukup.
 */
export default function ActivityLearningCard({ userId }: { userId: string }) {
  const [data, setData] = useState<InsightData | null>(null)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)

  useEffect(() => {
    let active = true
    fetch('/api/insights/activity-pattern', { cache: 'no-store' })
      .then((res) => res.json())
      .then((json) => { if (active) setData(json?.data ?? null) })
      .catch(() => { if (active) setData(null) })
    return () => { active = false }
  }, [])

  async function applySuggestedTime(time: string) {
    setApplying(true)
    const supabase = createClient()
    // Update jam reminder di semua channel yang sudah pernah di-setup user (telegram/push/whatsapp),
    // biar konsisten — kalau channel-nya belum pernah disetup, dibiarkan (nggak bikin baris baru sendiri).
    await supabase
      .from('reminder_preferences')
      .update({ reminder_time: time })
      .eq('user_id', userId)
      .in('channel', ['telegram', 'push', 'whatsapp'])
    setApplying(false)
    setApplied(true)
  }

  if (!data) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Menganalisis kebiasaan...
        </div>
      </div>
    )
  }

  if (!data.enoughData) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
        <div className="flex items-center gap-2 text-blue-700">
          <BrainCircuit className="h-4 w-4" />
          <p className="text-xs font-black uppercase tracking-wide">NEXA belajar dari kamu</p>
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Baru {data.sampleSize} dari {data.minSample} deadline selesai yang kecatat — lanjut selesaiin
          deadline seperti biasa, nanti NEXA kasih saran jam reminder yang cocok sama pola kamu sendiri.
        </p>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-all"
            style={{ width: `${Math.min(100, (data.sampleSize / data.minSample) * 100)}%` }}
          />
        </div>
      </div>
    )
  }

  const trend = data.trendDelta

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 text-blue-700">
        <BrainCircuit className="h-4 w-4" />
        <p className="text-xs font-black uppercase tracking-wide">NEXA belajar dari kamu</p>
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-700">
        Dari {data.sampleSize} deadline terakhir yang selesai, paling sering kelar sekitar{' '}
        <span className="font-black text-slate-950">jam {String(data.peakHour).padStart(2, '0')}.00</span>, dan hari{' '}
        <span className="font-black text-slate-950">{data.peakDayLabel}</span> jadi hari paling produktif.
      </p>

      {trend !== null && (
        <p className={`mt-2 inline-flex items-center gap-1.5 text-xs font-black ${trend >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
          {trend >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          Completion rate {trend >= 0 ? 'naik' : 'turun'} {Math.abs(trend)}% dibanding 4 minggu sebelumnya
        </p>
      )}

      <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
        <p className="text-xs leading-5 text-slate-600">
          Saran: coba geser jam reminder ke <span className="font-black text-slate-950">{data.suggestedTime}</span> —
          2 jam sebelum jam kamu biasanya baru gerak, biar ada waktu ancang-ancang.
        </p>
        {applied ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> Jam reminder sudah diupdate.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => void applySuggestedTime(data.suggestedTime)}
            disabled={applying}
            className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-black text-white disabled:opacity-50"
          >
            {applying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Pakai jam ini
          </button>
        )}
      </div>
    </div>
  )
}
