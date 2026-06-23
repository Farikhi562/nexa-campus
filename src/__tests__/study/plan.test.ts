/**
 * Unit tests — lib/study/plan (deterministik: checklistFromRoadmap, validateChecklist)
 */

import { checklistFromRoadmap, validateChecklist } from '../../lib/study/plan'

// ─── checklistFromRoadmap ─────────────────────────────────────────────────────

describe('checklistFromRoadmap', () => {
  test('roadmap null → fallback generik (5 item)', () => {
    const items = checklistFromRoadmap(null)
    expect(items.length).toBe(5)
    items.forEach((it) => {
      expect(it.id).toBeTruthy()
      expect(it.done).toBe(false)
    })
  })

  test('roadmap [] → fallback generik', () => {
    const items = checklistFromRoadmap([])
    expect(items.length).toBe(5)
  })

  test('roadmap bukan array → fallback generik', () => {
    const items = checklistFromRoadmap('invalid')
    expect(items.length).toBe(5)
  })

  test('roadmap 3 step → 3 + 1 review = 4 item', () => {
    const items = checklistFromRoadmap([
      { title: 'Intro OOP', order: 0 },
      { title: 'Class & Object', order: 1 },
      { title: 'Inheritance', order: 2 },
    ])
    expect(items.length).toBe(4) // 3 topik + 1 quiz item
    expect(items[0].text).toContain('Intro OOP')
    expect(items[3].text).toContain('kuis')
  })

  test('roadmap >10 step → max 10 + 1 = 11 item', () => {
    const road = Array.from({ length: 15 }, (_, i) => ({ title: `Topik ${i}` }))
    const items = checklistFromRoadmap(road)
    expect(items.length).toBe(11) // 10 + 1 review
  })

  test('order field sequential mulai dari 0', () => {
    const items = checklistFromRoadmap([{ title: 'A' }, { title: 'B' }])
    expect(items[0].order).toBe(0)
    expect(items[1].order).toBe(1)
    expect(items[2].order).toBe(2) // review item
  })

  test('step tanpa title → fallback ke "Topik N"', () => {
    const items = checklistFromRoadmap([{ description: 'no title here' }])
    expect(items[0].text).toContain('Topik 1')
  })

  test('semua item default done=false', () => {
    const items = checklistFromRoadmap([{ title: 'X' }, { title: 'Y' }])
    items.forEach((it) => expect(it.done).toBe(false))
  })
})

// ─── validateChecklist ────────────────────────────────────────────────────────

describe('validateChecklist', () => {
  const valid = [
    { id: 'cl-1', text: 'Baca materi', done: false, order: 0 },
    { id: 'cl-2', text: 'Kerjakan soal', done: true, order: 1 },
  ]

  test('array valid → kembalikan items', () => {
    const result = validateChecklist(valid)
    expect(result).toHaveLength(2)
    expect(result![0].id).toBe('cl-1')
  })

  test('null → null', () => {
    expect(validateChecklist(null)).toBeNull()
  })

  test('bukan array → null', () => {
    expect(validateChecklist('string')).toBeNull()
  })

  test('item tanpa id → null', () => {
    expect(validateChecklist([{ text: 'x', done: false, order: 0 }])).toBeNull()
  })

  test('item id kosong "" → null', () => {
    expect(validateChecklist([{ id: '', text: 'x', done: false, order: 0 }])).toBeNull()
  })

  test('item tanpa text → null', () => {
    expect(validateChecklist([{ id: 'a', done: false, order: 0 }])).toBeNull()
  })

  test('text di-truncate ke 200 char', () => {
    const longText = 'x'.repeat(300)
    const result = validateChecklist([{ id: 'a', text: longText, done: false, order: 0 }])
    expect(result![0].text.length).toBe(200)
  })

  test('done dikonversi ke boolean', () => {
    const r = validateChecklist([{ id: 'a', text: 'x', done: 1, order: 0 }])
    expect(r![0].done).toBe(true)
  })

  test('order default ke index kalau tidak ada', () => {
    const r = validateChecklist([{ id: 'a', text: 'x', done: false }])
    expect(r![0].order).toBe(0)
  })

  test('>50 items → null (limit keamanan)', () => {
    const items = Array.from({ length: 51 }, (_, i) => ({ id: `c${i}`, text: `item ${i}`, done: false, order: i }))
    expect(validateChecklist(items)).toBeNull()
  })

  test('tepat 50 items → valid', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({ id: `c${i}`, text: `item ${i}`, done: false, order: i }))
    expect(validateChecklist(items)).toHaveLength(50)
  })
})
