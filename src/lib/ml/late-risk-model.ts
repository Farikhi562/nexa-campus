import 'server-only'
import { trainLogisticRegression, predictProba, type LogisticModel } from './logistic-regression'

/**
 * Fitur yang dipakai model risiko-telat. Sengaja kecil & bersih (6 fitur)
 * karena data per-user biasanya tidak banyak (puluhan-ratusan deadline) —
 * fitur yang terlalu banyak relatif ke jumlah sample bikin overfit.
 */
const PRIORITY_RANK: Record<string, number> = { low: 0, normal: 1, high: 2, urgent: 3 }

export type DeadlineForTraining = {
  id: string
  type: string
  priority: string
  created_at: string
  deadline_date: string
  deadline_time: string
  reminder_enabled: boolean
  /** true = selesai TEPAT WAKTU, false = selesai TERLAMBAT. Dari histori (sudah resolved). */
  wasOnTime: boolean
}

export type DeadlineForPrediction = {
  id: string
  course_name: string
  title: string | null
  type: string
  priority: string
  created_at: string
  deadline_date: string
  deadline_time: string
  reminder_enabled: boolean
}

function leadTimeDays(createdAt: string, deadlineDate: string): number {
  const created = new Date(createdAt).getTime()
  const due = new Date(`${deadlineDate}T00:00:00`).getTime()
  return Math.max(0, (due - created) / 86_400_000)
}

function isWeekend(deadlineDate: string): number {
  const day = new Date(`${deadlineDate}T00:00:00`).getDay()
  return day === 0 || day === 6 ? 1 : 0
}

function hourFraction(deadlineTime: string): number {
  const hour = Number(deadlineTime.slice(0, 2))
  return Number.isFinite(hour) ? hour / 23 : 0.5
}

/**
 * Target-encode "type" jadi tingkat keterlambatan historis (dengan smoothing
 * supaya tipe yang jarang muncul tidak overfit ke 0%/100%). Dihitung dari
 * SET TRAINING yang sama (bukan kebocoran data dari luar), wajar untuk model
 * personal sederhana seperti ini.
 */
function buildTypeLatenessRates(rows: DeadlineForTraining[]): Map<string, number> {
  const globalLateRate = rows.length > 0 ? rows.filter((r) => !r.wasOnTime).length / rows.length : 0.3
  const SMOOTHING = 3 // setara menambah 3 sample "rata-rata" ke tiap tipe

  const byType = new Map<string, { late: number; total: number }>()
  for (const row of rows) {
    const entry = byType.get(row.type) ?? { late: 0, total: 0 }
    entry.total += 1
    if (!row.wasOnTime) entry.late += 1
    byType.set(row.type, entry)
  }

  const rates = new Map<string, number>()
  byType.forEach(({ late, total }, type) => {
    rates.set(type, (late + SMOOTHING * globalLateRate) / (total + SMOOTHING))
  })
  return rates
}

function featureVector(
  d: { type: string; priority: string; created_at: string; deadline_date: string; deadline_time: string; reminder_enabled: boolean },
  typeLatenessRates: Map<string, number>,
  fallbackLatenessRate: number
): number[] {
  return [
    leadTimeDays(d.created_at, d.deadline_date),
    PRIORITY_RANK[d.priority] ?? 1,
    typeLatenessRates.get(d.type) ?? fallbackLatenessRate,
    isWeekend(d.deadline_date),
    hourFraction(d.deadline_time),
    d.reminder_enabled ? 1 : 0,
  ]
}

export const MIN_TRAINING_SAMPLES = 8

export type RiskPrediction = {
  deadlineId: string
  courseName: string
  title: string | null
  riskScore: number // 0-1, probabilitas telat
  riskLabel: 'rendah' | 'sedang' | 'tinggi'
}

export type RiskModelResult = {
  /** false kalau data historis belum cukup -> pakai fallback heuristik sederhana, bukan model. */
  modelTrained: boolean
  trainingSamples: number
  trainingAccuracy: number | null
  predictions: RiskPrediction[]
}

function riskLabel(score: number): RiskPrediction['riskLabel'] {
  if (score >= 0.6) return 'tinggi'
  if (score >= 0.35) return 'sedang'
  return 'rendah'
}

/**
 * Latih model risiko-telat dari histori user (deadline yang sudah resolved),
 * lalu prediksi risiko untuk deadline yang masih pending. Training dilakukan
 * SETIAP PANGGILAN (bukan disimpan/di-cache) — dataset per-user kecil,
 * gradient descent 300-500 epoch untuk <500 sample selesai dalam puluhan ms,
 * jadi tidak perlu kompleksitas tambahan (cron retrain, tabel model
 * tersimpan, dll).
 */
export function trainAndPredict(
  history: DeadlineForTraining[],
  pending: DeadlineForPrediction[]
): RiskModelResult {
  if (history.length < MIN_TRAINING_SAMPLES) {
    // Belum cukup data buat melatih model yang bermakna. Fallback transparan:
    // pakai tingkat keterlambatan global sederhana (atau 30% kalau histori
    // kosong total) sebagai estimasi kasar, BUKAN mengarang model.
    const fallbackRate = history.length > 0
      ? history.filter((r) => !r.wasOnTime).length / history.length
      : 0.3
    return {
      modelTrained: false,
      trainingSamples: history.length,
      trainingAccuracy: null,
      predictions: pending.map((d) => ({
        deadlineId: d.id,
        courseName: d.course_name,
        title: d.title,
        riskScore: fallbackRate,
        riskLabel: riskLabel(fallbackRate),
      })),
    }
  }

  const typeLatenessRates = buildTypeLatenessRates(history)
  const globalLateRate = history.filter((r) => !r.wasOnTime).length / history.length

  const X = history.map((d) => featureVector(d, typeLatenessRates, globalLateRate))
  const y = history.map((d) => (d.wasOnTime ? 0 : 1)) // label = 1 berarti TELAT

  const model: LogisticModel = trainLogisticRegression(X, y, { epochs: 400, learningRate: 0.2, l2: 0.08 })

  const predictions = pending.map((d) => {
    const features = featureVector(d, typeLatenessRates, globalLateRate)
    const score = predictProba(model, features)
    return {
      deadlineId: d.id,
      courseName: d.course_name,
      title: d.title,
      riskScore: score,
      riskLabel: riskLabel(score),
    }
  })

  return {
    modelTrained: true,
    trainingSamples: model.samples,
    trainingAccuracy: model.trainingAccuracy,
    predictions,
  }
}
