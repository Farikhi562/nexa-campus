/**
 * Regresi logistik dari nol — bukan wrapper API LLM, bukan if-else yang
 * disamarkan. Ini gradient descent beneran: bobot (weights) DIPELAJARI dari
 * data training lewat iterasi minimisasi loss (binary cross-entropy + L2
 * regularization), bukan ditentukan manual.
 *
 * Dipakai untuk: prediksi probabilitas sebuah deadline akan telat,
 * dilatih per-user dari histori deadline yang sudah pernah diselesaikan.
 */

export type TrainOptions = {
  /** Learning rate gradient descent. */
  learningRate?: number
  /** Jumlah iterasi maksimum. */
  epochs?: number
  /** Kekuatan L2 regularization (mencegah overfit/weight blow-up di data kecil). */
  l2?: number
}

export type LogisticModel = {
  weights: number[]
  bias: number
  /** Mean & std per fitur dari data training — dipakai untuk normalisasi input prediksi. */
  featureMean: number[]
  featureStd: number[]
  /** Binary cross-entropy di data training (bukan data uji terpisah — n per user kecil). */
  trainingLoss: number
  trainingAccuracy: number
  epochsRun: number
  samples: number
}

function sigmoid(z: number): number {
  // Clamp biar tidak overflow exp() untuk z yang sangat negatif/positif.
  if (z >= 0) {
    const e = Math.exp(-z)
    return 1 / (1 + e)
  }
  const e = Math.exp(z)
  return e / (1 + e)
}

function meanStd(values: number[]): { mean: number; std: number } {
  const n = values.length
  const mean = values.reduce((s, v) => s + v, 0) / n
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n
  const std = Math.sqrt(variance)
  return { mean, std: std > 1e-9 ? std : 1 } // hindari div-by-zero untuk fitur konstan
}

function normalize(X: number[][], mean: number[], std: number[]): number[][] {
  return X.map((row) => row.map((v, j) => (v - mean[j]) / std[j]))
}

/**
 * Latih model dari data (X, y). X = array fitur numerik per sample,
 * y = label biner (1 = telat, 0 = tepat waktu).
 */
export function trainLogisticRegression(X: number[][], y: number[], options: TrainOptions = {}): LogisticModel {
  const { learningRate = 0.1, epochs = 500, l2 = 0.05 } = options
  const n = X.length
  const numFeatures = X[0]?.length ?? 0

  if (n === 0 || numFeatures === 0) {
    return { weights: [], bias: 0, featureMean: [], featureStd: [], trainingLoss: 0, trainingAccuracy: 0, epochsRun: 0, samples: 0 }
  }

  const featureMean: number[] = []
  const featureStd: number[] = []
  for (let j = 0; j < numFeatures; j++) {
    const col = X.map((row) => row[j])
    const { mean, std } = meanStd(col)
    featureMean.push(mean)
    featureStd.push(std)
  }
  const Xn = normalize(X, featureMean, featureStd)

  let weights = new Array(numFeatures).fill(0)
  let bias = 0

  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradW = new Array(numFeatures).fill(0)
    let gradB = 0

    for (let i = 0; i < n; i++) {
      const z = Xn[i].reduce((s, x, j) => s + x * weights[j], bias)
      const pred = sigmoid(z)
      const error = pred - y[i]
      for (let j = 0; j < numFeatures; j++) gradW[j] += error * Xn[i][j]
      gradB += error
    }

    for (let j = 0; j < numFeatures; j++) {
      // Gradient rata-rata + L2 regularization (tidak menyentuh bias).
      weights[j] -= learningRate * (gradW[j] / n + l2 * weights[j])
    }
    bias -= learningRate * (gradB / n)
  }

  // Training loss & akurasi (bukan akurasi data uji — n per user terlalu
  // kecil untuk train/test split yang bermakna; ini transparansi seberapa
  // baik model cocok dengan histori, bukan klaim generalisasi).
  let loss = 0
  let correct = 0
  for (let i = 0; i < n; i++) {
    const z = Xn[i].reduce((s, x, j) => s + x * weights[j], bias)
    const pred = sigmoid(z)
    const clamped = Math.min(Math.max(pred, 1e-7), 1 - 1e-7)
    loss += -(y[i] * Math.log(clamped) + (1 - y[i]) * Math.log(1 - clamped))
    if ((pred >= 0.5 ? 1 : 0) === y[i]) correct++
  }

  return {
    weights,
    bias,
    featureMean,
    featureStd,
    trainingLoss: loss / n,
    trainingAccuracy: correct / n,
    epochsRun: epochs,
    samples: n,
  }
}

/** Prediksi probabilitas (0-1) untuk satu sample fitur, pakai model yang sudah dilatih. */
export function predictProba(model: LogisticModel, features: number[]): number {
  if (model.weights.length === 0) return 0.5 // model belum dilatih -> netral
  const xn = features.map((v, j) => (v - model.featureMean[j]) / model.featureStd[j])
  const z = xn.reduce((s, x, j) => s + x * model.weights[j], model.bias)
  return sigmoid(z)
}
