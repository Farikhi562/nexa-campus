/**
 * Multi-armed bandit — Thompson Sampling dengan prior Beta-Bernoulli.
 * Algoritma bandit asli (bukan A/B test acak, bukan rotasi round-robin):
 * tiap arm (pilihan) punya distribusi Beta(alpha, beta) yang merepresentasikan
 * keyakinan kita soal "seberapa sering arm ini berhasil". Setiap kali harus
 * memilih, kita SAMPLE dari tiap distribusi dan pilih yang sample-nya
 * tertinggi — otomatis menyeimbangkan eksplorasi (arm yang belum banyak
 * dicoba punya distribusi lebar, kadang menang) dan eksploitasi (arm yang
 * sudah terbukti bagus distribusinya menyempit di nilai tinggi).
 *
 * Reward biner: 1 = berhasil (mis. deadline selesai tepat waktu setelah
 * nudge ini ditampilkan), 0 = gagal (telat/tidak selesai).
 */

export type ArmStats = {
  armId: string
  alpha: number // prior sukses + jumlah reward=1 yang pernah terjadi
  beta: number // prior gagal + jumlah reward=0 yang pernah terjadi
}

/** Sample dari distribusi Beta(alpha, beta) pakai metode dua-Gamma (Marsaglia-Tsang disederhanakan untuk alpha/beta > 0). */
function sampleBeta(alpha: number, beta: number, rng: () => number = Math.random): number {
  const x = sampleGamma(alpha, rng)
  const y = sampleGamma(beta, rng)
  if (x + y === 0) return 0.5
  return x / (x + y)
}

/** Sample dari distribusi Gamma(shape, 1) — Marsaglia & Tsang (2000), standar & akurat untuk shape > 0. */
function sampleGamma(shape: number, rng: () => number): number {
  if (shape < 1) {
    // Boost trick: Gamma(shape) = Gamma(shape+1) * U^(1/shape)
    const u = rng()
    return sampleGamma(shape + 1, rng) * Math.pow(u, 1 / shape)
  }
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (let i = 0; i < 100; i++) {
    let x: number
    let v: number
    do {
      x = gaussian(rng)
      v = 1 + c * x
    } while (v <= 0)
    v = v * v * v
    const u = rng()
    if (u < 1 - 0.0331 * x * x * x * x) return d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
  return d // fallback praktis kalau 100 iterasi tidak konvergen (sangat jarang)
}

/** Sample dari distribusi normal standar via Box-Muller. */
function gaussian(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-12)
  const u2 = rng()
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
}

/**
 * Pilih 1 arm pakai Thompson Sampling. `rng` bisa di-inject untuk testing
 * deterministik (seeded), default pakai Math.random asli di production.
 */
export function selectArmThompson(arms: ArmStats[], rng: () => number = Math.random): string {
  if (arms.length === 0) throw new Error('selectArmThompson: arms kosong')
  let bestArm = arms[0].armId
  let bestSample = -Infinity
  for (const arm of arms) {
    const sample = sampleBeta(Math.max(arm.alpha, 1e-6), Math.max(arm.beta, 1e-6), rng)
    if (sample > bestSample) {
      bestSample = sample
      bestArm = arm.armId
    }
  }
  return bestArm
}

/** Update parameter Beta setelah reward diketahui — ini "belajar"-nya bandit. */
export function updateArm(stats: ArmStats, reward: 0 | 1): ArmStats {
  return reward === 1
    ? { ...stats, alpha: stats.alpha + 1 }
    : { ...stats, beta: stats.beta + 1 }
}

/** Estimasi rata-rata keberhasilan arm sejauh ini (mean distribusi Beta) — buat ditampilkan, bukan buat memilih. */
export function armSuccessRate(stats: ArmStats): number {
  return stats.alpha / (stats.alpha + stats.beta)
}
