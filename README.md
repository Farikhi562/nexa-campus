# NEXA v1.6.42 — Single Profile Badge Showcase Fix

Patch ini benerin sistem badge profile:

- Badge profile sekarang **cuma 1 yang bisa dipilih**.
- Klik badge unlocked = jadi badge utama profile.
- Klik badge yang sudah aktif = unselect/sembunyikan.
- Klik badge locked = tetap munculin syarat unlock.
- API `/api/badges/pin` sekarang otomatis unpin badge lama sebelum pin badge baru.
- API `/api/badges/me` dan `/api/badges/[userId]` cuma balikin 1 pinned badge utama.
- `PublicUserBadges`, `CurrentUserBadges`, `UnifiedBadgeStrip`, `ProfileBadgeShowcase` default limit jadi 1.
- Migration membersihkan data lama yang sudah telanjur punya banyak pinned badge dan bikin partial unique index.

## Cara pasang Windows CMD

```bat
xcopy /E /Y "nexa_v1_6_42_single_profile_badge_fix\*" "."
node scripts\install-v1.6.42.mjs
npm run build
git add -A
git commit -m "fix: allow only one profile badge showcase"
git push
```

## SQL Supabase

Jalankan:

```txt
supabase/migrations/20260615_single_profile_badge_showcase.sql
```

## Test

1. Buka `/dashboard/badges`.
2. Klik badge yang sudah kebuka.
3. Counter harus berubah jadi `1/1 tampil`.
4. Klik badge lain, badge utama langsung ganti.
5. Buka profile/dashboard/friends, yang tampil cuma 1 badge.
