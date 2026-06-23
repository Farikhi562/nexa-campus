/**
 * Lookup meta badge dari registry `BADGES` (lib/badges.ts) berdasarkan id.
 *
 * Tujuan: <AnimatedBadge>/<InlineBadge> cukup dikasih `badgeId`, kategori & tier
 * diresolusikan otomatis dari sini. API (arena/teman/profil) TIDAK perlu diubah —
 * cukup kirim id featured_badge seperti sekarang.
 *
 * Toleran terhadap penamaan field:
 *   kategori : category | type | group
 *   tier     : tier | rarity | level
 *   nama     : name | title | label
 *
 * ⚠️ Catatan: file ini meng-import `BADGES` dari '@/lib/badges'. Itu harus
 * client-safe (array data biasa). Kalau lib/badges.ts kebetulan meng-import modul
 * server-only, pindahkan array BADGES ke file data terpisah (mis. lib/badges/data.ts)
 * lalu ganti import di bawah. Pemakaian `BADGES.find(...)` & `BADGES.map(...)` di
 * route yang ada menunjukkan ini memang array data biasa, jadi umumnya aman.
 */

import { BADGES } from '@/lib/badges'

export type BadgeMeta = {
  category: string | null
  tier: string | null
  name: string | null
}

const EMPTY: BadgeMeta = { category: null, tier: null, name: null }

// Index sekali di module-load untuk lookup O(1).
const INDEX: Map<string, BadgeMeta> = (() => {
  const map = new Map<string, BadgeMeta>()
  const list = Array.isArray(BADGES) ? (BADGES as unknown[]) : []
  for (const raw of list) {
    if (!raw || typeof raw !== 'object') continue
    const b = raw as Record<string, unknown>
    const id = typeof b.id === 'string' ? b.id : null
    if (!id) continue

    const category =
      pickString(b.category) ?? pickString(b.type) ?? pickString(b.group) ?? null
    const tier =
      pickString(b.tier) ?? pickString(b.rarity) ?? pickString(b.level) ?? null
    const name =
      pickString(b.name) ?? pickString(b.title) ?? pickString(b.label) ?? null

    map.set(id, { category, tier, name })
  }
  return map
})()

function pickString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

/** Ambil meta badge dari id. Tidak pernah throw; balikin null-field kalau tak ketemu. */
export function getBadgeMeta(id?: string | null): BadgeMeta {
  if (!id) return EMPTY
  return INDEX.get(id) ?? EMPTY
}
