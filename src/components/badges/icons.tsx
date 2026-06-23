'use client'

/**
 * Ikon badge animasi — satu bentuk per kategori, SVG murni.
 * Animasi via class dari AnimatedBadge.module.css (transform/opacity saja → 60fps,
 * dan otomatis diam saat prefers-reduced-motion).
 *
 * Tiap ikon menerima className opsional untuk elemen yang bergerak,
 * agar AnimatedBadge bisa mengatur idle-motion-nya.
 */

import styles from './AnimatedBadge.module.css'

type IconProps = {
  /** warna utama (mengikuti tier glow) */
  tint: string
  /** apakah animasi aktif */
  animate: boolean
}

// helper class join
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

// ─── Deadline → tumpukan buku ─────────────────────────────────────────────────

export function DeadlineIcon({ animate }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={cx(styles.icon, animate && styles.float)} aria-hidden>
      {/* buku bawah */}
      <rect x="12" y="40" width="40" height="10" rx="2.5" fill="#2563eb" />
      <rect x="12" y="40" width="40" height="3.5" rx="1.75" fill="#1d4ed8" opacity="0.6" />
      {/* buku tengah */}
      <rect x="15" y="29" width="34" height="10" rx="2.5" fill="#16a34a" className={cx(animate && styles.bookMid)} />
      <rect x="15" y="29" width="34" height="3.5" rx="1.75" fill="#15803d" opacity="0.6" />
      {/* buku atas (merah, miring) */}
      <g className={cx(animate && styles.bookTop)} style={{ transformOrigin: '32px 24px' }}>
        <rect x="18" y="18" width="28" height="10" rx="2.5" fill="#dc2626" />
        <rect x="18" y="18" width="28" height="3.5" rx="1.75" fill="#b91c1c" opacity="0.6" />
        {/* pita pembatas */}
        <rect x="38" y="18" width="3" height="14" fill="#fbbf24" />
      </g>
    </svg>
  )
}

// ─── Referral → Saturn berputar ───────────────────────────────────────────────

export function ReferralIcon({ animate }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={styles.icon} aria-hidden>
      {/* planet */}
      <circle cx="32" cy="32" r="13" fill="url(#planetGrad)" />
      <ellipse cx="27" cy="27" rx="4" ry="3" fill="#fde68a" opacity="0.5" />
      <circle cx="38" cy="36" r="2.5" fill="#92400e" opacity="0.35" />
      {/* cincin berputar */}
      <g className={cx(animate && styles.ringSpin)} style={{ transformOrigin: '32px 32px' }}>
        <ellipse cx="32" cy="32" rx="24" ry="8" fill="none" stroke="#c4b5fd" strokeWidth="2.5" transform="rotate(-20 32 32)" />
        <ellipse cx="32" cy="32" rx="24" ry="8" fill="none" stroke="#a78bfa" strokeWidth="1" transform="rotate(-20 32 32)" opacity="0.6" />
      </g>
      <defs>
        <radialGradient id="planetGrad" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </radialGradient>
      </defs>
    </svg>
  )
}

// ─── Leaderboard → piala ──────────────────────────────────────────────────────

export function LeaderboardIcon({ animate }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={cx(styles.icon, animate && styles.float)} aria-hidden>
      {/* gagang */}
      <path d="M16 18 H48 V26 a8 8 0 0 1-8 8 H24 a8 8 0 0 1-8-8 Z" fill="url(#cupGrad)" />
      <path d="M16 20 a6 6 0 0 0-8 6 a8 8 0 0 0 8 8" fill="none" stroke="#d97706" strokeWidth="3" />
      <path d="M48 20 a6 6 0 0 1 8 6 a8 8 0 0 1-8 8" fill="none" stroke="#d97706" strokeWidth="3" />
      {/* batang & alas */}
      <rect x="29" y="34" width="6" height="8" fill="#b45309" />
      <rect x="22" y="42" width="20" height="5" rx="1.5" fill="#92400e" />
      <rect x="25" y="47" width="14" height="4" rx="1" fill="#78350f" />
      {/* bintang */}
      <path d="M32 20 l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6Z" fill="#fffbeb" className={cx(animate && styles.starPulse)} style={{ transformOrigin: '32px 25px' }} />
      <defs>
        <linearGradient id="cupGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Study → topi wisuda ──────────────────────────────────────────────────────

export function StudyIcon({ animate }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={styles.icon} aria-hidden>
      <path d="M32 16 L56 26 L32 36 L8 26 Z" fill="url(#capGrad)" />
      <path d="M32 36 L48 29.5 V40 a16 7 0 0 1-32 0 V29.5 Z" fill="#1e3a8a" opacity="0.85" />
      {/* tali + tassel */}
      <line x1="56" y1="26" x2="56" y2="40" stroke="#fbbf24" strokeWidth="1.6" />
      <g className={cx(animate && styles.tassel)} style={{ transformOrigin: '56px 40px' }}>
        <circle cx="56" cy="42" r="3" fill="#f59e0b" />
        <rect x="54.5" y="42" width="3" height="7" rx="1.5" fill="#f59e0b" />
      </g>
      <defs>
        <linearGradient id="capGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Arena → pedang menyilang ─────────────────────────────────────────────────

export function ArenaIcon({ animate }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={styles.icon} aria-hidden>
      <g className={cx(animate && styles.gleam)}>
        {/* pedang 1 */}
        <g transform="rotate(45 32 32)">
          <rect x="30" y="10" width="4" height="32" rx="1" fill="#cbd5e1" />
          <rect x="30" y="10" width="2" height="32" fill="#f1f5f9" />
          <rect x="25" y="42" width="14" height="4" rx="2" fill="#92400e" />
          <rect x="31" y="46" width="2" height="8" fill="#78350f" />
        </g>
        {/* pedang 2 */}
        <g transform="rotate(-45 32 32)">
          <rect x="30" y="10" width="4" height="32" rx="1" fill="#94a3b8" />
          <rect x="32" y="10" width="2" height="32" fill="#e2e8f0" />
          <rect x="25" y="42" width="14" height="4" rx="2" fill="#a16207" />
          <rect x="31" y="46" width="2" height="8" fill="#854d0e" />
        </g>
      </g>
    </svg>
  )
}

// ─── Streak → api ─────────────────────────────────────────────────────────────

export function StreakIcon({ animate }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={styles.icon} aria-hidden>
      <g className={cx(animate && styles.flicker)} style={{ transformOrigin: '32px 44px' }}>
        <path d="M32 12 C40 24 46 28 46 38 a14 14 0 0 1-28 0 C18 30 24 28 24 20 C28 24 30 24 32 12 Z" fill="url(#flameOuter)" />
        <path d="M32 26 C36 32 38 34 38 40 a6 6 0 0 1-12 0 C26 36 29 34 32 26 Z" fill="url(#flameInner)" />
      </g>
      <defs>
        <linearGradient id="flameOuter" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="60%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        <linearGradient id="flameInner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Social → cincin terkait ──────────────────────────────────────────────────

export function SocialIcon({ animate }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={styles.icon} aria-hidden>
      <circle cx="24" cy="32" r="13" fill="none" stroke="#14b8a6" strokeWidth="4.5" className={cx(animate && styles.pulseA)} style={{ transformOrigin: '24px 32px' }} />
      <circle cx="40" cy="32" r="13" fill="none" stroke="#0ea5e9" strokeWidth="4.5" className={cx(animate && styles.pulseB)} style={{ transformOrigin: '40px 32px' }} />
    </svg>
  )
}

// ─── Founder → mahkota ────────────────────────────────────────────────────────

export function FounderIcon({ animate }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={cx(styles.icon, animate && styles.float)} aria-hidden>
      <path d="M12 24 L20 36 L32 20 L44 36 L52 24 L48 48 L16 48 Z" fill="url(#crownGrad)" />
      <rect x="16" y="48" width="32" height="5" rx="1.5" fill="#b45309" />
      <circle cx="12" cy="24" r="3.5" fill="#fcd34d" className={cx(animate && styles.gemA)} />
      <circle cx="32" cy="20" r="4" fill="#fde68a" className={cx(animate && styles.gemB)} />
      <circle cx="52" cy="24" r="3.5" fill="#fcd34d" className={cx(animate && styles.gemA)} />
      <defs>
        <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Generic → perisai berbintang ─────────────────────────────────────────────

export function GenericIcon({ animate }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={cx(styles.icon, animate && styles.float)} aria-hidden>
      <path d="M32 12 L50 18 V32 C50 44 42 50 32 54 C22 50 14 44 14 32 V18 Z" fill="url(#shieldGrad)" />
      <path d="M32 24 l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4-3.9-3.8 5.4-.8Z" fill="#fffbeb" className={cx(animate && styles.starPulse)} style={{ transformOrigin: '32px 32px' }} />
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="100%" stopColor="#0d9488" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ─── Mapping kategori → komponen ──────────────────────────────────────────────

import type { BadgeCategory } from '@/lib/badges/visuals'

export const ICON_BY_CATEGORY: Record<BadgeCategory, (p: IconProps) => React.ReactElement> = {
  deadline:    DeadlineIcon,
  referral:    ReferralIcon,
  leaderboard: LeaderboardIcon,
  study:       StudyIcon,
  arena:       ArenaIcon,
  streak:      StreakIcon,
  social:      SocialIcon,
  founder:     FounderIcon,
  generic:     GenericIcon,
}
