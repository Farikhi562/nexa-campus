# Batch 25 — Wiring badge animasi ke Arena & Pencapaian

Lanjutan batch 24. Sekarang badge animasi benar-benar terpasang di dua layar dari
screenshot: **NEXA Arena** (kartu post) dan **Pencapaian** (grid badge).

> Butuh batch 24 (`src/components/badges/*` + `src/lib/badges/visuals.ts` +
> `src/lib/badges/lookup.ts`) sudah ada di project. Batch ini memakainya.

## Yang diperbaiki

- Arena: medali gradient + emoji di samping nama creator & anggota tim → diganti
  `<InlineBadge>` (sumber sama dengan halaman Pencapaian). **Tidak ada perubahan API** —
  `creator_featured_badge` & `team_members[].profile.featured_badge` yang sudah dikirim
  route `/api/arena` langsung dipakai.
- Pencapaian: kartu emoji → kartu badge animasi, plus filter kategori dan tombol
  "Jadikan utama" yang ke-wire ke `PATCH /api/achievements/featured` (endpoint sudah ada).

## File baru

```
src/components/arena/ArenaPostCard.tsx        ← kartu arena (mirror screenshot 1)
src/components/arena/ArenaListExample.tsx      ← contoh wiring daftar arena
src/components/achievements/AchievementsView.tsx ← halaman pencapaian (mirror screenshot 2)
src/app/achievements/page.example.tsx          ← contoh wiring server page
docs/arena-preview.png                          ← hasil render kartu arena
```

## Pasang

### Arena
Ganti komponen kartu arena lama dengan `ArenaPostCard`. Tipe `ArenaPost` = persis
response `GET /api/arena`, jadi tinggal map `data`. Lihat `ArenaListExample.tsx`.

```tsx
import { ArenaPostCard } from '@/components/arena/ArenaPostCard'

<ArenaPostCard post={post} isOwner={post.creator_id === me} onDelete={...} />
```

### Pencapaian
Map `BADGES` → `BadgeCardData`, kirim `earnedIds` + `featuredBadgeId`. Lihat
`page.example.tsx`. Sesuaikan sumber `earnedIds` (tabel `user_badges` atau hasil
`evaluateBadges`).

```tsx
<AchievementsView badges={cards} earnedIds={earnedIds} featuredBadgeId={featured} />
```

## Catatan

- `ArenaPostCard` pakai Tailwind + lucide-react (sudah dipakai di project).
- Badge inline meresolusi kategori/tier sendiri dari registry (`lookup.ts`), jadi
  cukup `featured_badge` id. Lihat README batch 24.
- Status open/tutup dibaca dari `post.status` (fallback: dianggap buka).
- Tombol "Jadikan utama" hanya muncul di badge yang sudah unlocked.
