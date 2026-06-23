/**
 * Badge VISUAL registry — single source of truth untuk tampilan badge.
 *
 * Masalah sebelumnya: halaman Pencapaian dan Arena render badge sendiri-sendiri
 * (emoji di kartu, medali gradient di arena) → tampil beda.
 *
 * Sekarang: SEMUA tempat pakai <AnimatedBadge category= tier= /> yang baca dari
 * sini. Mau di arena, kartu pencapaian, profil, leaderboard — visualnya identik.
 *
 * Visual diresolusikan dari `category` (bentuk ikon) + `tier` (warna/aura).
 * Tidak bergantung pada daftar badge spesifik, jadi tetap jalan walau lib/badges.ts
 * menambah badge baru — cukup pastikan badge baru punya category & tier yang valid.
 */

// ─── Tier ─────────────────────────────────────────────────────────────────────

export type BadgeTier = 'common' | 'rare' | 'epic' | 'legend' | 'mythos'

/** Tema warna per tier. Diambil dari screenshot: legend = amber, mythos = kosmik. */
export type TierTheme = {
  label: string
  /** gradient kartu (CSS) */
  cardBg: string
  /** warna garis tepi kartu */
  cardBorder: string
  /** warna teks judul di kartu */
  cardText: string
  /** warna aura/glow ikon (rgb tanpa alpha, dipakai di rgba()) */
  glow: string
  /** warna chip tier */
  chipBg: string
  chipText: string
  /** apakah tier ini punya partikel orbit (mythos only) */
  cosmic: boolean
}

export const TIER_THEME: Record<BadgeTier, TierTheme> = {
  common: {
    label: 'Common',
    cardBg: 'linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%)',
    cardBorder: '#d4d4d8',
    cardText: '#3f3f46',
    glow: '113,113,122',
    chipBg: '#e4e4e7',
    chipText: '#52525b',
    cosmic: false,
  },
  rare: {
    label: 'Rare',
    cardBg: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
    cardBorder: '#bfdbfe',
    cardText: '#1e40af',
    glow: '59,130,246',
    chipBg: '#dbeafe',
    chipText: '#1d4ed8',
    cosmic: false,
  },
  epic: {
    label: 'Epic',
    cardBg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
    cardBorder: '#e9d5ff',
    cardText: '#6b21a8',
    glow: '168,85,247',
    chipBg: '#f3e8ff',
    chipText: '#7e22ce',
    cosmic: false,
  },
  legend: {
    label: 'Legend',
    cardBg: 'linear-gradient(135deg, #fef9c3 0%, #fde68a 55%, #fcd34d 100%)',
    cardBorder: '#fcd34d',
    cardText: '#7c4a03',
    glow: '245,158,11',
    chipBg: 'rgba(255,255,255,0.6)',
    chipText: '#92400e',
    cosmic: false,
  },
  mythos: {
    label: 'Mythos',
    cardBg: 'linear-gradient(135deg, #1e1b4b 0%, #3b0764 45%, #4c1d95 70%, #1e3a8a 100%)',
    cardBorder: 'rgba(196,181,253,0.5)',
    cardText: '#f5f3ff',
    glow: '167,139,250',
    chipBg: 'rgba(255,255,255,0.18)',
    chipText: '#ede9fe',
    cosmic: true,
  },
}

// ─── Category ─────────────────────────────────────────────────────────────────
// Tiap kategori → satu bentuk ikon animasi. Tambah kategori baru di sini saja.

export type BadgeCategory =
  | 'deadline'
  | 'referral'
  | 'leaderboard'
  | 'study'
  | 'arena'
  | 'streak'
  | 'social'
  | 'founder'
  | 'generic'

/** Label kategori untuk eyebrow di kartu (mirror "DEADLINE • ANIMATED"). */
export const CATEGORY_LABEL: Record<BadgeCategory, string> = {
  deadline:    'Deadline',
  referral:    'Referral',
  leaderboard: 'Leaderboard',
  study:       'Belajar',
  arena:       'Arena',
  streak:      'Streak',
  social:      'Sosial',
  founder:     'Founder',
  generic:     'Umum',
}

// ─── Per-badge override (opsional) ────────────────────────────────────────────
// Kalau ada badge spesifik yang mau ikon beda dari default kategorinya,
// daftarkan id → category di sini. ID harus sama dengan id di lib/badges.ts.
// Kalau tidak terdaftar, AnimatedBadge pakai category yang dikirim langsung.

export const BADGE_ICON_OVERRIDE: Record<string, BadgeCategory> = {
  // Contoh dari screenshot — sesuaikan id dengan lib/badges.ts milikmu:
  'deadline_commander_500': 'deadline',
  'referral_singularity':   'referral',
  // 'leaderboard_xxx':      'leaderboard',
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set<BadgeCategory>([
  'deadline', 'referral', 'leaderboard', 'study', 'arena', 'streak', 'social', 'founder', 'generic',
])

/** Tentukan kategori ikon final dari (id, category). Fallback aman ke 'generic'. */
export function resolveIconCategory(opts: { id?: string | null; category?: string | null }): BadgeCategory {
  const { id, category } = opts
  if (id && BADGE_ICON_OVERRIDE[id]) return BADGE_ICON_OVERRIDE[id]
  if (category && VALID_CATEGORIES.has(category as BadgeCategory)) return category as BadgeCategory
  return 'generic'
}

/** Validasi tier, fallback ke 'common'. */
export function resolveTier(tier?: string | null): BadgeTier {
  if (tier && tier in TIER_THEME) return tier as BadgeTier
  return 'common'
}
