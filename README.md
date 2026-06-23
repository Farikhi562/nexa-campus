# Batch 24 — Sistem Badge Animasi (single source of truth)

## Masalah yang diperbaiki

Dari screenshot: badge di **halaman Pencapaian** (emoji 📚 🪐 di kartu) beda dengan
badge di **Arena** (medali gradient kecil di samping nama). Dua tempat itu render
badge dengan cara masing-masing → tampil tidak konsisten. Plus badge masih emoji,
padahal labelnya bilang "ANIMATED".

## Solusi

Satu komponen `<AnimatedBadge>` yang dipakai **semua** tempat (Pencapaian, Arena,
Teman, Leaderboard, Profil). Karena sumbernya satu, badge tidak bisa beda lagi.

- ❌ Tidak ada emoji — semua ikon SVG custom.
- ✅ Beneran animasi — CSS `transform`/`opacity` (60fps, hemat baterai).
- ✅ Hormati `prefers-reduced-motion` (animasi mati, badge tetap tampil).
- ✅ Zero dependency — tanpa Lottie, tanpa file JSON, tanpa library animasi.

9 bentuk ikon (per kategori) × 5 tier warna (common → mythos). Semua badge berbagi
satu "shine sweep" diagonal sebagai signature, jadi terasa satu keluarga.

---

## File baru

```
src/lib/badges/visuals.ts                       ← registry tier + kategori (SoT)
src/components/badges/
  ├─ icons.tsx                                  ← 9 ikon SVG animasi
  ├─ AnimatedBadge.module.css                   ← semua keyframes + reduce-motion
  ├─ AnimatedBadge.tsx                          ← KOMPONEN UTAMA (dipakai semua)
  ├─ BadgeCard.tsx                              ← kartu pencapaian (ganti kartu emoji)
  ├─ InlineBadge.tsx                            ← varian xs/sm untuk arena & teman
  └─ index.ts                                   ← barrel export
```

---

## Cara pasang

### 1. Halaman Pencapaian — ganti kartu emoji

```tsx
import { BadgeGrid, type BadgeCardData } from '@/components/badges'

// Map dari BADGES kamu (lib/badges.ts) + status earned user:
const cards: BadgeCardData[] = BADGES.map((b) => ({
  id: b.id,
  name: b.name,
  description: b.description,
  requirement: b.requirement,   // teks "Syarat:"
  category: b.category,         // 'deadline' | 'referral' | 'leaderboard' | ...
  tier: b.tier,                 // 'common' | 'rare' | 'epic' | 'legend' | 'mythos'
  unlocked: earnedIds.includes(b.id),
}))

<BadgeGrid badges={cards} />
```

> **Penting soal `category` & `tier`:** komponen menentukan bentuk ikon dari
> `category` dan warna dari `tier`. Pastikan tiap badge di `lib/badges.ts` punya dua
> field ini. Kalau penamaannya beda (mis. `type` bukan `category`), map saja saat
> bikin `BadgeCardData`. Nilai yang dikenal:
> - **category:** `deadline`, `referral`, `leaderboard`, `study`, `arena`, `streak`, `social`, `founder`, `generic`
> - **tier:** `common`, `rare`, `epic`, `legend`, `mythos`
>
> Kategori/tier yang tidak dikenal otomatis fallback aman (`generic` / `common`),
> jadi tidak akan error walau ada badge baru.

### 2. Arena — ganti medali gradient kecil di samping nama

**API tidak perlu diubah.** Cukup kirim `badgeId` (= `featured_badge` yang sudah
ada). Kategori, tier, dan nama diresolusikan otomatis dari registry `BADGES` lewat
`src/lib/badges/lookup.ts`.

Di tempat yang sekarang render badge creator/anggota (mis. `oleh <nama> <medali>`):

```tsx
import { InlineBadge } from '@/components/badges'

<span className="inline-flex items-center gap-1.5">
  {creatorName}
  <InlineBadge badgeId={creator_featured_badge} size="xs" />
</span>
```

Itu saja — `InlineBadge` cari sendiri bentuk + warnanya dari `BADGES`.
`category`/`tier`/`title` masih bisa dikirim manual kalau mau override.

### 3. Bagaimana auto-resolve bekerja

`lookup.ts` meng-index `BADGES` sekali saat load, lalu `getBadgeMeta(id)` balikin
`{ category, tier, name }`. Toleran terhadap penamaan field:

| butuh | dibaca dari (berurutan) |
|-------|-------------------------|
| kategori | `category` → `type` → `group` |
| tier | `tier` → `rarity` → `level` |
| nama | `name` → `title` → `label` |

Kalau id tak ketemu atau field kosong → fallback aman (`generic`/`common`),
tidak pernah error.

> ⚠️ **Satu syarat:** `lookup.ts` meng-`import { BADGES } from '@/lib/badges'`,
> jadi modul itu harus client-safe (array data biasa). Pemakaian `BADGES.find(...)`
> & `BADGES.map(...)` di route yang ada menandakan ini memang array data, jadi
> umumnya aman. Kalau ternyata `lib/badges.ts` ikut meng-import modul server-only
> dan build client gagal, pindahkan array `BADGES` ke file terpisah (mis.
> `lib/badges/data.ts`) lalu ubah satu baris import di `lookup.ts`.

---

## Ukuran

| size | px | dipakai di |
|------|----|-----------|
| `xs` | 20 | inline samping nama (arena, teman, chat) |
| `sm` | 32 | chip kecil, list |
| `md` | 56 | kartu pencapaian |
| `lg` | 88 | header profil / modal detail badge |

Di `xs`/`sm`, shine sweep & orbit otomatis dimatikan biar nggak ramai.

---

## Menambah kategori atau tier baru

- **Kategori baru:** tambah di `BadgeCategory` + `CATEGORY_LABEL` (visuals.ts),
  bikin ikon di `icons.tsx`, daftarkan di `ICON_BY_CATEGORY`.
- **Tier baru:** tambah entry di `TIER_THEME` (visuals.ts). Warna kartu, aura,
  chip semua dari sini.
- **Override ikon 1 badge spesifik:** isi `BADGE_ICON_OVERRIDE` (id → category).

Tidak ada perubahan database. Murni layer tampilan.
