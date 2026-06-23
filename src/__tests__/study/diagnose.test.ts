/**
 * Unit tests — lib/study/diagnose (deterministik, tanpa AI, tanpa DB)
 * Jalankan: npx jest src/__tests__/study/diagnose.test.ts
 */

import { analyzeWeakness } from '../../lib/study/diagnose'
import type { PackRow } from '../../lib/study/diagnose'

// ─── Helper: buat PackRow ─────────────────────────────────────────────────────

const now = new Date().toISOString()

function pack(overrides: Partial<PackRow> & { id: string; topic: string }): PackRow {
  return {
    quiz: new Array(10).fill({ q: 'x' }),  // 10 soal default
    quiz_best_score: null,
    quiz_attempts: 0,
    quiz_last_wrong: null,
    created_at: now,
    updated_at: now,
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('analyzeWeakness', () => {
  // ── no attempts ──────────────────────────────────────────────────────────

  test('pack dengan 0 attempts → weak (no_attempts)', () => {
    const { weak_areas } = analyzeWeakness([
      pack({ id: 'p1', topic: 'OOP', quiz_attempts: 0, quiz_best_score: null }),
    ])
    expect(weak_areas).toHaveLength(1)
    expect(weak_areas[0].reason).toBe('no_attempts')
    expect(isNaN(weak_areas[0].score_ratio)).toBe(true)
  })

  test('pack dengan attempts=0 dan best_score=0 → weak (no_attempts)', () => {
    const { weak_areas } = analyzeWeakness([
      pack({ id: 'p1', topic: 'SQL', quiz_attempts: 0, quiz_best_score: 0 }),
    ])
    expect(weak_areas[0].reason).toBe('no_attempts')
  })

  // ── low score ─────────────────────────────────────────────────────────────

  test('skor 5/10 (50%) → low_score', () => {
    const { weak_areas } = analyzeWeakness([
      pack({ id: 'p1', topic: 'Algo', quiz_attempts: 2, quiz_best_score: 5 }),
    ])
    expect(weak_areas[0].reason).toBe('low_score')
    expect(weak_areas[0].score_ratio).toBeCloseTo(0.5)
  })

  test('skor 6/10 (60%) — batas bawah threshold → low_score', () => {
    const { weak_areas } = analyzeWeakness([
      pack({ id: 'p1', topic: 'OS', quiz_attempts: 1, quiz_best_score: 6 }),
    ])
    // 60% == threshold, masih weak
    expect(weak_areas[0].reason).toBe('low_score')
  })

  test('skor 7/10 (70%) → bukan weak (strong)', () => {
    const { strong_areas, weak_areas } = analyzeWeakness([
      pack({ id: 'p1', topic: 'Network', quiz_attempts: 3, quiz_best_score: 7 }),
    ])
    expect(weak_areas).toHaveLength(0)
    expect(strong_areas[0].score_ratio).toBeCloseTo(0.7)
  })

  // ── stale ─────────────────────────────────────────────────────────────────

  test('skor 80% tapi updated > 14 hari → stale', () => {
    const staleDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    const { weak_areas } = analyzeWeakness([
      pack({ id: 'p1', topic: 'DB', quiz_attempts: 2, quiz_best_score: 8, updated_at: staleDate }),
    ])
    expect(weak_areas[0].reason).toBe('stale')
  })

  test('skor 100% tidak masuk stale (sudah perfect)', () => {
    const staleDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { weak_areas, strong_areas } = analyzeWeakness([
      pack({ id: 'p1', topic: 'DB', quiz_attempts: 5, quiz_best_score: 10, updated_at: staleDate }),
    ])
    expect(weak_areas).toHaveLength(0)
    expect(strong_areas).toHaveLength(1)
  })

  // ── ordering ──────────────────────────────────────────────────────────────

  test('weak_areas diurutkan: no_attempts dulu, lalu low_score tertinggi', () => {
    const { weak_areas } = analyzeWeakness([
      pack({ id: 'p1', topic: 'A', quiz_attempts: 2, quiz_best_score: 5 }),  // 50%
      pack({ id: 'p2', topic: 'B', quiz_attempts: 0, quiz_best_score: null }),// no attempt
      pack({ id: 'p3', topic: 'C', quiz_attempts: 1, quiz_best_score: 4 }),  // 40%
    ])
    expect(weak_areas[0].reason).toBe('no_attempts')
    expect(weak_areas[1].topic).toBe('C') // 40% < 50%
    expect(weak_areas[2].topic).toBe('A')
  })

  // ── pack tanpa quiz → skip ────────────────────────────────────────────────

  test('pack dengan quiz=[] (tanpa soal) → tidak masuk weak/strong', () => {
    const { weak_areas, strong_areas } = analyzeWeakness([
      { id: 'p1', topic: 'X', quiz: [], quiz_best_score: null, quiz_attempts: 0, quiz_last_wrong: null, created_at: now, updated_at: now },
    ])
    expect(weak_areas).toHaveLength(0)
    expect(strong_areas).toHaveLength(0)
  })

  // ── total_packs ───────────────────────────────────────────────────────────

  test('total_packs = jumlah pack yang masuk (termasuk no-quiz-pack)', () => {
    const { total_packs } = analyzeWeakness([
      pack({ id: 'p1', topic: 'A' }),
      pack({ id: 'p2', topic: 'B', quiz_attempts: 3, quiz_best_score: 9 }),
    ])
    expect(total_packs).toBe(2)
  })

  // ── quiz_last_wrong passthrough ───────────────────────────────────────────

  test('quiz_last_wrong disertakan di weak area', () => {
    const { weak_areas } = analyzeWeakness([
      pack({ id: 'p1', topic: 'Math', quiz_attempts: 1, quiz_best_score: 3, quiz_last_wrong: [0, 2, 7] }),
    ])
    expect(weak_areas[0].quiz_last_wrong).toEqual([0, 2, 7])
  })

  test('quiz_last_wrong null → default empty array', () => {
    const { weak_areas } = analyzeWeakness([
      pack({ id: 'p1', topic: 'Phys', quiz_attempts: 1, quiz_best_score: 3, quiz_last_wrong: null }),
    ])
    expect(weak_areas[0].quiz_last_wrong).toEqual([])
  })
})
