# NEXA Campus — Update (Leaderboard, Midtrans, Avatar, Gemini, SEO)

## 1) SQL yang harus dijalankan (urut)

Di **Supabase → SQL Editor**, jalankan berurutan (semua idempotent):

1. `supabase/schema.sql` — struktur dasar (kalau belum pernah).
2. `supabase/migrations/20260605_leaderboard_referral_profile.sql` — **wajib untuk update ini.**
   Membuat: `is_public_profile`, `points_events`, fungsi `award_points`,
   `get_leaderboard`, `get_my_rank`, tabel `payment_orders` (Midtrans), memastikan
   tabel `referrals`, RLS, dan backfill poin dari deadline yang sudah selesai.

## 2) Environment variables

| Variable | Wajib | Fungsi |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ya | Koneksi Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ya | Koneksi Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | ya | Admin lihat semua data, referral reward, upgrade plan via webhook (server-only) |
| `GEMINI_API_KEY` | opsional | Aktifkan Tanya NEXA & AI Quick Add. Tanpa ini → fallback "AI feature is not configured yet." + parser sederhana |
| `GEMINI_MODEL` | opsional | Default `gemini-2.5-flash-lite` / `gemini-2.5-flash` |
| `ADMIN_EMAILS` | ya (admin) | Email admin, pisah koma. Kosong → halaman /admin tampilkan pesan setup |
| `NEXT_PUBLIC_SITE_URL` | disarankan | Base URL untuk SEO (canonical, sitemap, OG) & finish-URL pembayaran |
| `MIDTRANS_SERVER_KEY` | untuk bayar | Server key Midtrans (server-only) |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | untuk bayar | Client key Midtrans (Snap.js) |
| `MIDTRANS_IS_PRODUCTION` | opsional | `true` untuk production, default sandbox |
| `NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION` | opsional | Sama, untuk memilih URL snap.js di client |

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

---

## Update lanjutan: Badges & AI dari Foto

### Badges / Achievement
- Halaman baru `/dashboard/achievements` + link di sidebar & menu avatar.
- 13 lencana (bronze/silver/gold/special) yang terbuka otomatis dari data yang
  sudah ada: jumlah deadline dicatat & diselesaikan, selesai tepat waktu, streak,
  total poin, dan jumlah referral. Lencana terkunci tampil dengan gembok + progress bar.
- **Tidak butuh tabel baru** — dihitung dari `academic_deadlines`, `points_events`,
  dan `referrals`. Endpoint: `GET /api/achievements`.

### AI Quick Add dari Foto (Gemini Vision)
- Di halaman AI Quick Add ada tombol **"Upload Foto Jadwal"** (selain input teks).
  Foto papan tulis / screenshot jadwal → otomatis jadi draft deadline.
- Endpoint baru: `POST /api/deadlines/ai-extract-image` (gated Pulse/Command,
  maks 5MB, JPG/PNG/WebP). Wajib `GEMINI_API_KEY` (foto tidak bisa diparse offline).
- Env opsional `GEMINI_VISION_MODEL` (default ikut `GEMINI_MODEL` → `gemini-2.5-flash`).
- Catatan: AI Quick Add teks sekarang **fallback ke parser sederhana** saat Gemini
  gagal, jadi tidak lagi buntu dengan pesan "tidak bisa dipakai".

---

## Update lanjutan 2: Fix plan + Menu titik-tiga + Focus Mode

### Fix `profiles_plan_check` (user baru gagal)
Jalankan **`supabase/migrations/20260606_fix_new_user_plan.sql`** sekali di SQL Editor.
Ini mengganti trigger `handle_new_user` (penyebabnya) supaya user baru selalu dibuat
dengan `plan = 'radar'`, merapikan data lama, dan set default kolom. Setelah ini,
signup user baru tidak akan error lagi.

### Menu titik-tiga (☰/⋮) di kiri header
Di mobile, ada tombol titik-tiga di kiri header → drawer berisi **semua halaman**
(Dashboard, Leaderboard, Pencapaian, Focus, Deadline, Reminder, Profil, Billing, dll.).
Daftar menu sekarang satu sumber di `components/dashboard/nav-items.ts`.

### Fitur baru: Focus Mode (Pomodoro)
- Halaman `/dashboard/focus`: timer Pomodoro (25/5, 45/10, 15/3) dengan ring progress,
  start/jeda/reset, dan hitungan sesi.
- Menyelesaikan sesi fokus pertama tiap hari memberi **+5 poin** (dibatasi 1x/hari via
  `award_points('focus_session', ..., 'focus-<tanggal>')` → anti-spam). Poin masuk ke
  leaderboard. Tidak perlu tabel baru.

---

## PENTING: kalau masih kena error 500/400 (leaderboard, profil, dll.)

Itu tandanya migration belum jalan penuh. **Solusi paling gampang:** buka Supabase →
SQL Editor → paste seluruh isi **`supabase/setup_all.sql`** → Run (sekali, idempotent).
Satu file ini memastikan SEMUA tabel, kolom (`is_public_profile`, dll.), fungsi
leaderboard (`get_leaderboard`, `get_my_rank`, `award_points`), `payment_orders`,
trigger user-baru, dan storage bucket benar-benar ada.

Setelah itu:
- `GET /api/leaderboard` tidak 500 lagi (sekarang juga turun anggun, bukan crash).
- `POST /rest/v1/profiles` tidak 400 lagi (kolom lengkap).
- `POST /api/ask-nexa` tidak 500 lagi — kalau Gemini bermasalah, balas pesan ramah
  (cek `GEMINI_API_KEY` / `GEMINI_MODEL`).

---

## Kalau user baru TETAP kena profiles_plan_check + leaderboard belum aktif

Akar masalah: (a) baris profil lama punya `plan='user'` (invalid) — constraint dicek ke
seluruh baris saat UPDATE; (b) `setup_all.sql` kemungkinan gagal di tengah sehingga
ter-rollback semua (fungsi leaderboard tidak terbuat).

**Lakukan dua hal:**

1. **Deploy build terbaru.** Form onboarding sekarang pakai **sistem 3 lapis** dan
   mengirim `plan:'radar'`, jadi nilai `plan` lama yang invalid otomatis tertimpa jadi
   valid (lapis 1). Kalau ada kolom belum ada → turun ke lapis 2 (inti) → lapis 3 (minimal).
   Ini bikin user baru bisa bikin profil **walau SQL belum sempurna**.

2. **Jalankan `supabase/fix_now.sql`** (bukan setup_all dulu). File ini minimal &
   anti-gagal (tanpa bagian storage yang sering bikin rollback). Setelah ini:
   leaderboard aktif + semua baris `plan` lama dirapikan.

> `setup_all.sql` tetap bisa dipakai untuk setup lengkap; bagian storage-nya kini
> dibungkus exception agar tidak membatalkan seluruh script.

### Ask NEXA masih "tidak bisa menjawab"
Itu murni `GEMINI_API_KEY`/model. Cek key valid di Google AI Studio; hapus env
`GEMINI_MODEL` agar pakai default `gemini-2.5-flash-lite`. Lihat log server `[Ask NEXA]`
untuk alasan persis.
