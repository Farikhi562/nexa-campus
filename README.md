# NEXA Campus v1.6.39 — Badge Unlock Rules + Owner All Badges + Subscription Milestones

Patch ini memperbaiki masalah badge yang sudah memenuhi syarat tapi tidak kebuka, karena sebelumnya UI cuma tahu badge dari tabel `nexa_user_badges`, sementara progress/event user belum otomatis disync.

## Yang berubah

- `fauzanalfa36@gmail.com` otomatis unlock **semua badge**.
- Ada tombol **Sync Badge** di `/dashboard/badges`.
- `/api/badges/me` otomatis sync badge tiap halaman dibuka.
- Endpoint baru `/api/badges/sync` buat paksa cek ulang requirement.
- Tabel baru `nexa_badge_progress` buat nyimpen metric achievement.
- RPC baru `bump_nexa_badge_progress()` buat fitur lain menambah progress.
- Tambah 10 badge baru:
  - Pulse Spark — Langka — 1x langganan Pulse
  - Command Spark — Langka — 1x langganan Command
  - Pulse Hexaflame — Epic — 6x langganan Pulse
  - Command Hexacrown — Legend — 6x langganan Command
  - Pulse Year Guardian — Legend — 1 tahun Pulse / 12 order Pulse
  - Command Year Overlord — Legend — 1 tahun Command / 12 order Command
  - Six-Month Rank One — Epic — 6 bulan berturut Top 1 leaderboard
  - Leaderboard Year Titan — Legend — 1 tahun aktif di leaderboard
  - Referral Singularity — Mythos — 100 referral valid
  - 500 Deadline Commander — Legend — 500 deadline

## Cara pasang Windows CMD

Dari root project:

```bat
xcopy /E /Y "nexa_v1_6_39_badge_unlock_rules_subscription\*" "."
node scripts\install-v1.6.39.mjs
npm run build
```

Jalankan migration di Supabase SQL Editor:

```txt
supabase/migrations/20260615_badge_owner_unlock_subscription_milestones.sql
```

Deploy:

```bat
git add -A
git commit -m "feat: add badge unlock rules and subscription milestones"
git push
```

## Env owner

Pastikan Vercel env ini ada:

```env
NEXA_OWNER_EMAILS=fauzanalfa36@gmail.com
COMMAND_LIFETIME_EMAILS=fauzanalfa36@gmail.com
ADMIN_EMAILS=fauzanalfa36@gmail.com
```

Patch tetap punya fallback hardcoded owner email `fauzanalfa36@gmail.com`, jadi akun owner tetap kebuka walau env lupa, karena manusia memang spesialis lupa env.

## Cara unlock otomatis dari fitur

Kalau fitur tertentu selesai, panggil RPC ini dari Supabase client user login:

```sql
select public.bump_nexa_badge_progress('ai_quick_add_count', 1);
select public.bump_nexa_badge_progress('study_room_voice_notes', 1);
select public.bump_nexa_badge_progress('study_room_calls_started', 1);
select public.bump_nexa_badge_progress('top1_leaderboard_month_streak', 1);
select public.bump_nexa_badge_progress('referral_count', 1);
```

Lalu user buka `/dashboard/badges` dan klik **Sync Badge**, atau endpoint `/api/badges/me` akan sync otomatis.

## Metric yang dibaca sync engine

- `deadline_total` / data dari `academic_deadlines`
- `referral_count` / data referral dari `profiles` atau `referrals` kalau ada
- `top1_leaderboard_month_streak`
- `leaderboard_active_months`
- `ai_quick_add_count`
- `risk_scan_count`
- `custom_reminder_count`
- `study_room_voice_notes`
- `study_room_calls_started`
- `focus_sessions`
- `active_days`
- `main_features_used`

## Test cepat

```txt
1. Buka /dashboard/badges
2. Klik Sync Badge
3. Akun fauzanalfa36@gmail.com harus unlock semua badge
4. Klik badge unlocked buat tampil/sembunyi di profile
5. Cek profile badge publik tetap tampil via PublicUserBadges
```

## SQL owner manual kalau perlu

```sql
select public.grant_all_nexa_badges_to_email('fauzanalfa36@gmail.com');
```
