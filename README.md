# NEXA Campus v1.6.40 — Badge Consistency Everywhere

Patch ini ngerapihin badge biar **satu sistem yang sama** dipakai di profile, dashboard, teman, leaderboard, study room, arena, dan user card lain. Badge lama yang masih nyempil bakal ditimpa lewat compatibility component + injector script.

## Yang dibenerin

- `PublicUserBadges` sekarang selalu pakai badge showcase baru.
- `ProfileBadgeShowcase` tetap jadi pusat badge yang dipilih user untuk tampil di profile publik.
- `UnifiedBadgeStrip` jadi komponen standar buat semua halaman.
- Dashboard/profile dapat `CurrentUserBadges`.
- Friend/member/leaderboard/study room/arena target umum dicoba auto-inject `PublicUserBadges`.
- API `/api/badges/me` dan `/api/badges/[userId]` sekarang konsisten balikin:
  - `badges`
  - `pinnedBadges`
  - `autoBadges`
  - `ownerOverride`
- Akun owner `fauzanalfa36@gmail.com` tetap unlock semua badge.
- Owner otomatis punya pinned showcase top-tier: Mythos, Legend, dan badge pamer lain.

## Cara pasang Windows CMD

Dari root project:

```bat
xcopy /E /Y "nexa_v1_6_40_badge_consistency_everywhere\*" "."
node scripts\install-v1.6.40.mjs
npm run build
git add -A
git commit -m "fix: unify badges across all pages"
git push
```

Jalankan migration di Supabase SQL Editor:

```txt
supabase/migrations/20260615_badge_consistency_everywhere.sql
```

## Komponen standar mulai sekarang

Untuk nampilin badge user lain:

```tsx
import PublicUserBadges from '@/components/badges/PublicUserBadges'

<PublicUserBadges userId={user.id} limit={4} />
```

Untuk nampilin badge user login/current profile:

```tsx
import CurrentUserBadges from '@/components/badges/CurrentUserBadges'

<CurrentUserBadges limit={6} />
```

Untuk halaman profile penuh:

```tsx
import ProfileBadgeShowcase from '@/components/badges/ProfileBadgeShowcase'

<ProfileBadgeShowcase title="Badge yang tampil di profile" limit={6} />
```

## Cek setelah deploy

Buka:

```txt
/dashboard/badges
/dashboard/profile/badges
/dashboard
/dashboard/friends atau /dashboard/cari-teman
/dashboard/leaderboard
/dashboard/study-room/[id]
```

Badge yang tampil harus badge baru yang sama: Mythos/Legend/Epic/Langka/Biasa dari katalog `src/lib/badges/catalog.ts`.

## Kalau masih ada badge lama

Berarti ada file custom yang hardcode badge sendiri. Cari:

```bat
findstr /S /I /N "badge achievement pencapaian mythos legend epic langka" src\*.tsx
```

Terus ganti bagian badge lamanya dengan:

```tsx
<PublicUserBadges userId={user.id} limit={4} />
```

atau kalau itu profile sendiri:

```tsx
<CurrentUserBadges limit={6} />
```

Karena ya, badge lama yang hardcode itu kayak cicak di balik lemari, harus diburu manual kalau script nggak nemu.
