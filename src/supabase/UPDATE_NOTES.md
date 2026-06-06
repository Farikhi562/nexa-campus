# NEXA Campus — Update (Leaderboard, Midtrans, Avatar, Gemini, SEO)

## 1) SQL yang harus dijalankan (urut)

Di **Supabase → SQL Editor**, jalankan berurutan (semua idempotent):

1. `supabase/schema.sql` — struktur dasar (kalau belum pernah).
2. `supabase/migrations/20260605_leaderboard_referral_profile.sql` — **wajib untuk update ini.**
   Membuat: `is_public_profile`, `points_events`, fungsi `award_points`,
   `get_leaderboard`, `get_my_rank`, tabel `payment_orders` (Midtrans), memastikan
   tabel `referrals`, RLS, dan backfill poin dari deadline yang sudah selesai.

## 2) Environment variables

| Variable                             | Wajib       | Fungsi                                                                                                          |
| ------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | ya          | Koneksi Supabase                                                                                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | ya          | Koneksi Supabase                                                                                                |
| `SUPABASE_SERVICE_ROLE_KEY`          | ya          | Admin lihat semua data, referral reward, upgrade plan via webhook (server-only)                                 |
| `GEMINI_API_KEY`                     | opsional    | Aktifkan Tanya NEXA & AI Quick Add. Tanpa ini → fallback "AI feature is not configured yet." + parser sederhana |
| `GEMINI_MODEL`                       | opsional    | Default `gemini-2.5-flash-lite` / `gemini-2.5-flash`                                                            |
| `ADMIN_EMAILS`                       | ya (admin)  | Email admin, pisah koma. Kosong → halaman /admin tampilkan pesan setup                                          |
| `NEXT_PUBLIC_SITE_URL`               | disarankan  | Base URL untuk SEO (canonical, sitemap, OG) & finish-URL pembayaran                                             |
| `MIDTRANS_SERVER_KEY`                | untuk bayar | Server key Midtrans (server-only)                                                                               |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY`    | untuk bayar | Client key Midtrans (Snap.js)                                                                                   |
| `MIDTRANS_IS_PRODUCTION`             | opsional    | `true` untuk production, default sandbox                                                                        |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | opsional    | Sama, untuk memilih URL snap.js di client                                                                       |

> Set **Payment Notification URL** di dashboard Midtrans ke:
> `https://<domain>/api/payments/midtrans/notification`

## 3) Storage

Bucket `profile-photos` (public read, write owner-only) sudah dibuat di `schema.sql`.
Foto profil diupload ke situ dan URL-nya disimpan di `profiles.avatar_url`.

## 4) Cara test

- **Gemini**: isi `GEMINI_API_KEY` → Dashboard → panel Tanya NEXA → tanya "ringkas deadline minggu ini".
  Tanpa key: muncul "AI feature is not configured yet."; AI Quick Add tetap jalan pakai parser sederhana.
- **Avatar**: header kanan atas menampilkan foto (atau inisial). Klik → dropdown Lihat Profil / Leaderboard / Pengaturan / Logout.
- **Leaderboard**: selesaikan beberapa deadline → buka `/dashboard/leaderboard` → cek tab Minggu ini / Bulan ini / Semua waktu, podium, dan kartu "kamu peringkat #X". Set profil privat → namamu hilang dari papan publik.
- **Admin referral**: isi `ADMIN_EMAILS` + login sebagai admin → `/admin` → lihat panel "Referral reward". Tanpa `ADMIN_EMAILS` → pesan setup, tidak crash.
- **FOMO Pulse/Command**: login sebagai radar/pulse → dashboard menampilkan kartu countdown + fitur terkunci (gembok) + Command Focus Plan blur. Command → kartu hilang.
- **Midtrans**: isi env Midtrans → Billing → "Bayar sekarang" → Snap popup. Setelah bayar (sandbox), webhook meng-upgrade plan otomatis.
- **SEO**: cek `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest`, dan `<script type="application/ld+json">` di halaman.

## 5) Menjalankan

```bash
npm install
npm run dev      # development
npm run build    # production build
npm run lint     # jika tersedia
```

> Catatan: arsip ini berisi folder `src/` + `supabase/`. Pasang ke project Next.js
> kamu yang sudah punya package.json/next.config/tailwind.config. Verifikasi tipe:
> seluruh `src/**` lulus `tsc --noEmit` (0 error).
