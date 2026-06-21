/**
 * Validasi format URL evidence (spec G: "link evidence harus format URL valid").
 * Hanya menerima http/https — menolak javascript:, data:, file:, dll.
 */
export function isValidEvidenceUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.trim()) return false
  try {
    const url = new URL(value.trim())
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
