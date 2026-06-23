/**
 * Unit tests — parsePlanSteps (private, tested via mirror)
 */

const ALLOWED_TYPES = ['read','watch','practice','quiz','review','write','rest']

function parsePlanSteps(raw: string) {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  try {
    const arr = JSON.parse(cleaned)
    if (!Array.isArray(arr) || arr.length === 0) return null
    const steps = []
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i]
      const id = typeof item.id === 'string' ? item.id : `s${i + 1}`
      const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : `Langkah ${i + 1}`
      const description = typeof item.description === 'string' ? item.description.trim() : ''
      const rawType = typeof item.type === 'string' ? item.type.toLowerCase() : 'read'
      const type = ALLOWED_TYPES.includes(rawType) ? rawType : 'read'
      const duration_minutes = Math.max(5, Math.min(45, Number.isFinite(Number(item.duration_minutes)) ? Number(item.duration_minutes) : 20))
      steps.push({ id, title, description, type, duration_minutes })
    }
    return steps.length >= 2 ? steps : null
  } catch {
    return null
  }
}

const VALID_STEPS = [
  { id: 's1', title: 'Baca ringkasan', description: 'Baca dari awal', type: 'read', duration_minutes: 20 },
  { id: 's2', title: 'Kuis', description: 'Kerjakan soal', type: 'quiz', duration_minutes: 15 },
  { id: 's3', title: 'Review', description: 'Tinjau ulang', type: 'review', duration_minutes: 10 },
]

describe('parsePlanSteps', () => {
  test('valid steps → array', () => {
    const r = parsePlanSteps(JSON.stringify(VALID_STEPS))
    expect(r).toHaveLength(3)
    expect(r![0].type).toBe('read')
    expect(r![1].duration_minutes).toBe(15)
  })

  test('dalam markdown block → dibersihkan', () => {
    const r = parsePlanSteps('```json\n' + JSON.stringify(VALID_STEPS) + '\n```')
    expect(r).toHaveLength(3)
  })

  test('1 step → null (minimum 2)', () => {
    expect(parsePlanSteps(JSON.stringify([VALID_STEPS[0]]))).toBeNull()
  })

  test('array kosong → null', () => {
    expect(parsePlanSteps('[]')).toBeNull()
  })

  test('bukan array → null', () => {
    expect(parsePlanSteps(JSON.stringify({ steps: [] }))).toBeNull()
  })

  test('plain text → null', () => {
    expect(parsePlanSteps('Ini bukan JSON')).toBeNull()
  })

  test('duration < 5 → clamp ke 5', () => {
    const r = parsePlanSteps(JSON.stringify([
      { ...VALID_STEPS[0], duration_minutes: 2 },
      VALID_STEPS[1],
    ]))
    expect(r![0].duration_minutes).toBe(5)
  })

  test('duration > 45 → clamp ke 45', () => {
    const r = parsePlanSteps(JSON.stringify([
      { ...VALID_STEPS[0], duration_minutes: 90 },
      VALID_STEPS[1],
    ]))
    expect(r![0].duration_minutes).toBe(45)
  })

  test('type tidak dikenal → default "read"', () => {
    const r = parsePlanSteps(JSON.stringify([
      { ...VALID_STEPS[0], type: 'meditate' },
      VALID_STEPS[1],
    ]))
    expect(r![0].type).toBe('read')
  })

  test('title kosong → fallback "Langkah N"', () => {
    const r = parsePlanSteps(JSON.stringify([
      { ...VALID_STEPS[0], title: '' },
      VALID_STEPS[1],
    ]))
    expect(r![0].title).toBe('Langkah 1')
  })

  test('id tidak ada → generated "sN"', () => {
    const r = parsePlanSteps(JSON.stringify([
      { title: 'X', description: 'y', type: 'read', duration_minutes: 10 },
      { title: 'Z', description: 'w', type: 'quiz', duration_minutes: 15 },
    ]))
    expect(r![0].id).toBe('s1')
    expect(r![1].id).toBe('s2')
  })

  test('semua tipe valid diterima', () => {
    const steps = ALLOWED_TYPES.map((t, i) => ({
      id: `s${i}`, title: t, description: '', type: t, duration_minutes: 10
    }))
    const r = parsePlanSteps(JSON.stringify(steps))
    expect(r).toHaveLength(ALLOWED_TYPES.length)
    ALLOWED_TYPES.forEach((t, i) => expect(r![i].type).toBe(t))
  })
})
