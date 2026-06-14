# NEXA Campus v1.6.38 - Locked Badge + Profile Pin + Public Showcase

Patch ini memperbaiki badge flow:

- Badge yang belum user dapat tampil blur + ikon kunci.
- Klik badge locked menampilkan syarat unlock.
- Mythos tetap paling susah dan cuma 1.
- Klik badge yang sudah kebuka untuk tampil/sembunyi di profile.
- Maksimal 6 badge tampil di profile.
- Badge pinned bisa dilihat publik lewat API `/api/badges/[userId]`.
- Komponen `PublicUserBadges` bisa dipasang di user card, profile publik, friend list, leaderboard, study room, arena, dan halaman lain.

## Files utama

```txt
src/lib/badges/catalog.ts
src/components/badges/NexaBadgeCard.tsx
src/components/badges/BadgeCollection.tsx
src/components/badges/ProfileBadgeShowcase.tsx
src/components/badges/PublicUserBadges.tsx
src/components/badges/badgeStyles.tsx
src/app/api/badges/me/route.ts
src/app/api/badges/[userId]/route.ts
src/app/api/badges/pin/route.ts
src/app/dashboard/badges/page.tsx
src/app/dashboard/achievements/page.tsx
src/app/dashboard/profile/badges/page.tsx
supabase/migrations/20260615_badge_locks_profile_pinning.sql
scripts/install-v1.6.38.mjs
```

## Install Windows CMD

```bat
xcopy /E /Y "nexa_v1_6_38_locked_badge_pin_profile\*" "."
node scripts\install-v1.6.38.mjs
npm run build
```

Jalankan migration di Supabase SQL Editor:

```txt
supabase/migrations/20260615_badge_locks_profile_pinning.sql
```

Deploy:

```bat
git add -A
git commit -m "feat: add locked badges and public profile showcase"
git push
```

## Cara tampilkan badge di profile

Kalau auto-inject script gagal, tambahkan manual di halaman profile:

```tsx
import ProfileBadgeShowcase from '@/components/badges/ProfileBadgeShowcase'

<ProfileBadgeShowcase title="Badge yang tampil di profile" limit={6} />
```

## Cara tampilkan badge user di semua halaman

Pakai komponen ini di user card, leaderboard row, friend list, study room member, arena team member, dll:

```tsx
import PublicUserBadges from '@/components/badges/PublicUserBadges'

<PublicUserBadges userId={user.id} limit={4} />
```

## Test flow

1. Buka `/dashboard/badges`.
2. Badge yang belum kebuka harus blur + lock.
3. Klik badge locked, harus muncul syarat.
4. Klik badge unlocked, harus muncul pesan "tampil di profile".
5. Buka `/dashboard/profile/badges` atau halaman profile.
6. Badge pinned harus muncul.
7. Buka `/api/badges/<user_id>` dari user lain, pinned badge harus kebaca.

## SQL grant Mythos owner

```sql
insert into public.nexa_user_badges (user_id, badge_key, source, is_pinned)
select u.id, 'mythos_architect', 'owner_manual', true
from auth.users u
where lower(u.email) = lower('fauzanalfa36@gmail.com')
on conflict (user_id, badge_key) do update
set is_pinned = true;
```
