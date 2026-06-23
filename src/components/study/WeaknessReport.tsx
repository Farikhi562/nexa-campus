'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, BookOpen, CheckCircle2, Loader2, RefreshCw, Sparkles, TrendingUp } from 'lucide-react'
import type { DiagnoseResult, WeakArea } from '@/lib/study/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRatio(ratio: number): string {
  if (isNaN(ratio)) return 'Belum dikerjakan'
  return `${Math.round(ratio * 100)}%`
}

function ratioColor(ratio: number) {
  if (isNaN(ratio))   return 'text-zinc-400'
  if (ratio >= 0.80)  return 'text-emerald-400'
  if (ratio >= 0.60)  return 'text-amber-400'
  return                     'text-rose-400'
}

function barColor(ratio: number) {
  if (isNaN(ratio))   return 'bg-zinc-600'
  if (ratio >= 0.80)  return 'bg-emerald-500'
  if (ratio >= 0.60)  return 'bg-amber-500'
  return                     'bg-rose-500'
}

const reasonLabel: Record<WeakArea['reason'], string> = {
  low_score:    'Skor rendah',
  no_attempts:  'Belum dikerjakan',
  stale:        'Perlu diulang',
}

const reasonBadge: Record<WeakArea['reason'], string> = {
  low_score:    'bg-rose-900/50 text-rose-300 border-rose-700/50',
  no_attempts:  'bg-zinc-800    text-zinc-400 border-zinc-700',
  stale:        'bg-amber-900/50 text-amber-300 border-amber-700/50',
}

// ─── ScoreBar ─────────────────────────────────────────────────────────────────

function ScoreBar({ ratio, total }: { ratio: number; total: number }) {
  const pct = isNaN(ratio) ? 0 : Math.round(ratio * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-xs font-semibold ${ratioColor(ratio)}`}>{formatRatio(ratio)}</span>
        <span className="text-xs text-zinc-500">{total} soal</span>
      </div>
      <div className="h-1.5 rounded-full bg-zinc-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor(ratio)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── WeakCard ─────────────────────────────────────────────────────────────────

function WeakCard({ area, onStudy }: { area: WeakArea; onStudy: (packId: string) => void }) {
  return (
    <div className="rounded-2xl bg-zinc-800/60 border border-zinc-700/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-zinc-100 leading-tight">{area.topic}</p>
        <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs border ${reasonBadge[area.reason]}`}>
          {reasonLabel[area.reason]}
        </span>
      </div>
      <ScoreBar ratio={area.score_ratio} total={area.quiz_total} />
      {area.quiz_last_wrong.length > 0 && (
        <p className="text-xs text-zinc-500">
          Soal sering salah: nomor {area.quiz_last_wrong.slice(0, 5).map((i) => i + 1).join(', ')}
          {area.quiz_last_wrong.length > 5 ? ` +${area.quiz_last_wrong.length - 5} lainnya` : ''}
        </p>
      )}
      <button
        onClick={() => onStudy(area.pack_id)}
        className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-zinc-700 hover:bg-teal-700 text-xs font-medium text-zinc-200 py-2 transition-colors"
      >
        <BookOpen size={13} /> Pelajari ulang
      </button>
    </div>
  )
}

// ─── Strong row ───────────────────────────────────────────────────────────────

function StrongRow({ topic, ratio }: { topic: string; ratio: number }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-zinc-800 last:border-0">
      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
      <span className="text-sm text-zinc-300 flex-1 truncate">{topic}</span>
      <span className="text-xs font-semibold text-emerald-400">{formatRatio(ratio)}</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  /** Callback saat user klik "Pelajari ulang" — navigasi ke pack detail */
  onStudyPack?: (packId: string) => void
}

export function WeaknessReport({ onStudyPack }: Props) {
  const [data, setData]     = useState<DiagnoseResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/study/diagnose')
      const json = await res.json() as DiagnoseResult & { error?: string }
      if (!res.ok) { setError(json.error ?? 'Gagal memuat data.'); return }
      setData(json)
    } catch {
      setError('Gagal terhubung ke server.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  function handleStudy(packId: string) {
    onStudyPack?.(packId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-zinc-500">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Menganalisis perkembanganmu…</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-900/20 border border-rose-700/40 p-4 flex items-center gap-3">
        <AlertTriangle size={18} className="text-rose-400 shrink-0" />
        <p className="text-sm text-rose-300 flex-1">{error}</p>
        <button onClick={load} className="shrink-0 text-xs text-zinc-400 hover:text-zinc-200">
          <RefreshCw size={14} />
        </button>
      </div>
    )
  }

  if (!data || data.total_packs === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <TrendingUp size={32} className="mx-auto text-zinc-600" />
        <p className="text-sm text-zinc-400">Kamu belum punya materi belajar.</p>
        <p className="text-xs text-zinc-600">Buat study pack dulu dari tab Belajar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total materi', value: data.total_packs, color: 'text-zinc-200' },
          { label: 'Perlu diulang', value: data.weak_areas.length, color: 'text-rose-400' },
          { label: 'Sudah dikuasai', value: data.strong_areas.length, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl bg-zinc-800/50 border border-zinc-700/40 p-3 text-center">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* AI advice */}
      {data.ai_advice && (
        <div className="rounded-2xl bg-teal-900/25 border border-teal-700/40 px-4 py-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-teal-400" />
            <span className="text-xs font-semibold text-teal-300">Saran belajar personal</span>
          </div>
          <p className="text-sm text-teal-100 leading-relaxed">{data.ai_advice}</p>
        </div>
      )}

      {/* Weak areas */}
      {data.weak_areas.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-rose-400" />
            <h4 className="text-sm font-semibold text-zinc-200">Area yang perlu perhatian</h4>
          </div>
          <div className="space-y-3">
            {data.weak_areas.map((area) => (
              <WeakCard key={area.pack_id} area={area} onStudy={handleStudy} />
            ))}
          </div>
        </div>
      )}

      {/* Strong areas */}
      {data.strong_areas.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <h4 className="text-sm font-semibold text-zinc-200">Sudah dikuasai</h4>
          </div>
          <div className="rounded-2xl bg-zinc-800/40 border border-zinc-700/40 px-4 divide-y divide-zinc-800">
            {data.strong_areas.slice(0, 5).map((area) => (
              <StrongRow key={area.pack_id} topic={area.topic} ratio={area.score_ratio} />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={load}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors py-2"
      >
        <RefreshCw size={12} /> Perbarui analisis
      </button>
    </div>
  )
}
