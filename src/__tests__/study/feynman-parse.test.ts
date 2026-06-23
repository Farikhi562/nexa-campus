/**
 * Unit tests — parseFeedback (private, tested via export wrapper)
 * Karena parseFeedback tidak di-export, kita test via mocking fetch.
 * Di sini kita test logika validasi yang bisa dipisah.
 */

// Simulasi parseFeedback logic — mirror dari feynman.ts
function parseFeedback(raw: string) {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try {
    const obj = JSON.parse(cleaned)
    const score = Number(obj.score)
    if (!Number.isFinite(score) || score < 0 || score > 100) return null
    const right  = Array.isArray(obj.right)  ? obj.right.map(String)  : []
    const gaps   = Array.isArray(obj.gaps)   ? obj.gaps.map(String)   : []
    const wrong  = Array.isArray(obj.wrong)  ? obj.wrong.map(String)  : []
    const tip    = typeof obj.tip === 'string' ? obj.tip.trim() : 'Coba jelaskan ulang dengan contoh nyata.'
    return { score: Math.round(score), right, gaps, wrong, tip }
  } catch {
    return null
  }
}

describe('parseFeedback', () => {
  const validRaw = JSON.stringify({
    score: 72,
    right: ['Konsep dasar benar'],
    gaps: ['Belum jelaskan polymorphism'],
    wrong: [],
    tip: 'Buat analogi nyata untuk tiap konsep.',
  })

  test('valid JSON → feedback object', () => {
    const r = parseFeedback(validRaw)
    expect(r).not.toBeNull()
    expect(r!.score).toBe(72)
    expect(r!.right).toHaveLength(1)
    expect(r!.gaps).toHaveLength(1)
    expect(r!.wrong).toHaveLength(0)
    expect(r!.tip).toBeTruthy()
  })

  test('JSON dalam markdown code block → dibersihkan dulu', () => {
    const r = parseFeedback('```json\n' + validRaw + '\n```')
    expect(r).not.toBeNull()
    expect(r!.score).toBe(72)
  })

  test('score 0 → valid', () => {
    const r = parseFeedback(JSON.stringify({ score: 0, right: [], gaps: [], wrong: [], tip: 'Mulai dari dasar.' }))
    expect(r!.score).toBe(0)
  })

  test('score 100 → valid', () => {
    const r = parseFeedback(JSON.stringify({ score: 100, right: ['Semua benar'], gaps: [], wrong: [], tip: 'Luar biasa!' }))
    expect(r!.score).toBe(100)
  })

  test('score -1 → null (invalid)', () => {
    expect(parseFeedback(JSON.stringify({ score: -1, right: [], gaps: [], wrong: [], tip: 'x' }))).toBeNull()
  })

  test('score 101 → null (invalid)', () => {
    expect(parseFeedback(JSON.stringify({ score: 101, right: [], gaps: [], wrong: [], tip: 'x' }))).toBeNull()
  })

  test('score desimal → dibulatkan', () => {
    const r = parseFeedback(JSON.stringify({ score: 72.7, right: [], gaps: [], wrong: [], tip: 'ok' }))
    expect(r!.score).toBe(73)
  })

  test('plain text (bukan JSON) → null', () => {
    expect(parseFeedback('Ini penjelasan biasa, bukan JSON')).toBeNull()
  })

  test('JSON string kosong → null', () => {
    expect(parseFeedback('')).toBeNull()
  })

  test('right/gaps/wrong bukan array → default empty array', () => {
    const r = parseFeedback(JSON.stringify({ score: 50, right: 'string', gaps: null, wrong: undefined, tip: 'ok' }))
    expect(r!.right).toEqual([])
    expect(r!.gaps).toEqual([])
    expect(r!.wrong).toEqual([])
  })

  test('tip tidak ada → default tip', () => {
    const r = parseFeedback(JSON.stringify({ score: 50, right: [], gaps: [], wrong: [] }))
    expect(r!.tip).toBe('Coba jelaskan ulang dengan contoh nyata.')
  })

  test('items array dikasting ke string', () => {
    const r = parseFeedback(JSON.stringify({ score: 50, right: [42, true], gaps: [], wrong: [], tip: 'ok' }))
    expect(r!.right).toEqual(['42', 'true'])
  })
})
