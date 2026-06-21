'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Brain, Loader2, MessageSquareText, TrendingUp } from 'lucide-react'

type Prediction = {
  deadlineId: string
  courseName: string
  title: string | null
  riskScore: number
  riskLabel: 'rendah' | 'sedang' | 'tinggi'
}

type RiskResponse = {
  modelTrained: boolean
  trainingSamples: number
  trainingAccuracy: number | null
  predictions: Prediction[]
  error?: string
}

const RISK_STYLE: Record<Prediction['riskLabel'], string> = {
  tinggi: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  sedang: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  rendah: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
}

/**
 * Panel machine learning NEXA Assistant — SENGAJA dipisah visual dari chat
 * (yang LLM-based) supaya jelas: ini bukan AI generatif, ini model statistik
 * (regresi logistik) yang dilatih dari histori deadline-mu sendiri, plus
 * bandit (Thompson Sampling) yang belajar gaya pengingat mana yang paling
 * efektif buat KAMU secara spesifik dari hasil nyata, bukan generik.
 */
export default function MLRiskPanel() {
  const [data, setData] = useState<RiskResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [nudges, setNudges] = useState<Record<string, string>>({})
  const [nudgeLoading, setNudgeLoading] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/ml/risk', { cache: 'no-store' })
      .then((r) => r.json())
      .then((json) => {
        if (!active) return
        if (json.error) { setError(json.error); return }
        setData(json)
      })
      .catch(() => active && setError('Gagal memuat prediksi risiko.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  async function showNudge(deadlineId: string) {
    setNudgeLoading(deadlineId)
    try {
      const res = await fetch('/api/ml/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deadline_id: deadlineId }),
      })
      const json = await res.json().catch(() => null)
      if (res.ok && json?.message) {
        setNudges((prev) => ({ ...prev, [deadlineId]: json.message }))
      }
    } finally {
      setNudgeLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-violet-100 bg-white p-8">
        <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-violet-100 bg-white p-5 text-sm text-slate-500">{error}</div>
    )
  }

  if (!data) return null

  const atRisk = data.predictions.filter((p) => p.riskLabel !== 'rendah')

  return (
    <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50/50 p-5">
      <div className="mb-3 flex items-center gap-2">
        <div className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-violet-600 text-white">
          <Brain className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-950">Prediksi Risiko Telat</h2>
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-violet-700">
              Machine Learning
            </span>
          </div>
          <p className="text-xs text-slate-500">Regresi logistik — dilatih dari histori deadline-mu sendiri, bukan AI generatif.</p>
        </div>
      </div>

      {data.modelTrained ? (
        <p className="mb-4 text-xs text-slate-400">
          Model dilatih dari {data.trainingSamples} deadline yang sudah kamu selesaikan
          {data.trainingAccuracy !== null && ` · akurasi training ${(data.trainingAccuracy * 100).toFixed(0)}%`}.
        </p>
      ) : (
        <p className="mb-4 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">
          Histori kamu masih sedikit ({data.trainingSamples} deadline selesai) — pakai estimasi dasar dulu.
          Model akan makin akurat seiring kamu menyelesaikan lebih banyak deadline.
        </p>
      )}

      {data.predictions.length === 0 ? (
        <p className="text-sm text-slate-400">Tidak ada deadline aktif untuk diprediksi. Mantap, semua beres!</p>
      ) : atRisk.length === 0 ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          Semua deadline aktif diprediksi risiko rendah. Pertahankan ritmenya 💪
        </p>
      ) : (
        <div className="space-y-2">
          {atRisk.map((p) => (
            <div key={p.deadlineId} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-950">{p.title || p.courseName}</p>
                  {p.title && <p className="truncate text-xs text-slate-400">{p.courseName}</p>}
                </div>
                <span className={`flex-none rounded-full px-2.5 py-1 text-[11px] font-black ${RISK_STYLE[p.riskLabel]}`}>
                  {p.riskLabel === 'tinggi' && <AlertTriangle className="mr-1 inline h-3 w-3" />}
                  {Math.round(p.riskScore * 100)}% risiko {p.riskLabel}
                </span>
              </div>

              {nudges[p.deadlineId] ? (
                <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-800">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 flex-none" />
                  {nudges[p.deadlineId]}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => showNudge(p.deadlineId)}
                  disabled={nudgeLoading === p.deadlineId}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-3 py-1.5 text-xs font-black text-violet-700 hover:bg-violet-50 disabled:opacity-50"
                >
                  {nudgeLoading === p.deadlineId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquareText className="h-3.5 w-3.5" />}
                  Tampilkan pengingat
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px] leading-4 text-slate-400">
        Gaya pengingat dipilih otomatis oleh algoritma bandit (Thompson Sampling) yang belajar gaya mana
        paling sering bikin kamu selesai tepat waktu — beda-beda per orang.
      </p>
    </div>
  )
}
