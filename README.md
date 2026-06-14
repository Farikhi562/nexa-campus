# NEXA Campus v1.6.36 — Badge Profile Showcase v2

Patch ini ngebenerin badge yang sebelumnya terlalu polos/jelek.

## Isi patch

- 30 badge baru dengan distribusi jelas:
  - Biasa: 3 badge, emoji/basic, tidak animasi.
  - Langka: 6 badge, static bagus, tidak animasi.
  - Epic: 15 badge, animasi subtle.
  - Legend: 5 badge, animasi premium.
  - Mythos: 1 badge saja, animasi paling kuat.
- Badge bisa tampil di profile lewat `ProfileBadgeShowcase`.
- Halaman badge tetap ada di:
  - `/dashboard/badges`
  - `/dashboard/achievements`
  - `/dashboard/profile/badges`
- API badge:
  - `/api/badges/me`
  - `/api/badges/[userId]`
- Migration:
  - `supabase/migrations/20260615_badge_profile_showcase_v2.sql`

## Cara pasang Windows CMD

Dari root project:

```bat
xcopy /E /Y "nexa_v1_6_36_badge_profile_showcase\*" "."
node scripts\install-v1.6.36.mjs
npm run build
git add -A
git commit -m "feat: refresh badge system and profile showcase"
git push
```

Jalankan SQL migration di Supabase SQL Editor:

```txt
supabase/migrations/20260615_badge_profile_showcase_v2.sql
```

## Biar akun owner dapat Mythos otomatis di UI

Isi env Vercel:

```env
NEXA_OWNER_EMAILS=fauzanalfa36@gmail.com
COMMAND_LIFETIME_EMAILS=fauzanalfa36@gmail.com
ADMIN_EMAILS=fauzanalfa36@gmail.com
```

## Kalau mau grant Mythos ke database juga

Jalankan di Supabase:

```sql
insert into public.nexa_user_badges (user_id, badge_key, source, is_pinned)
select u.id, 'mythos_architect', 'owner_manual', true
from auth.users u
where lower(u.email) = lower('fauzanalfa36@gmail.com')
on conflict (user_id, badge_key) do update
set is_pinned = true;
```

## Kalau auto inject profile gagal

Tambahkan manual ke halaman/component profile kamu:

```tsx
import ProfileBadgeShowcase from '@/components/badges/ProfileBadgeShowcase'
```

Lalu taruh di JSX profile:

```tsx
<ProfileBadgeShowcase compact limit={6} />
```

## Catatan

Patch ini tidak pakai framer-motion, jadi tidak nambah dependency. Semua animasi pakai CSS biasa biar build tetap waras dan browser user tidak dijadikan korban ritual.
