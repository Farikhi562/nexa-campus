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

---

## Update lanjutan 3: Notifikasi HP asli (push), Telegram tutorial, auto-hapus deadline lewat

### 1) SQL yang harus dijalankan

Di **Supabase → SQL Editor**, jalankan:

`supabase/migrations/20260808_push_channel_and_autodelete.sql` — bikin tabel
`push_subscriptions` (+ RLS), fix constraint `reminder_preferences` (unique
jadi per `user_id + channel`, izinkan channel `'push'`), izinkan channel
`'push'` di `reminder_logs`, dan tambah kolom `auto_delete_expired_deadlines`
+ `auto_delete_expired_after_days` di `profiles`.

### 2) Environment variables baru

| Variable | Wajib | Fungsi |
| --- | --- | --- |
| `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` | opsional | Tanpa `@`, contoh `nexacampus_bot`. Kalau diisi, tombol "Buka Bot Telegram" muncul di tutorial Settings → Reminder dan deep-link langsung ke `t.me/<username>`. Kalau kosong, tutorial tetap tampil tanpa tombol itu. |

Env yang **sudah ada sebelumnya** dan sekarang benar-benar dipakai penuh
(sebelumnya cuma sebagian jalan karena bug di atas): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `TELEGRAM_BOT_TOKEN`, `CRON_SECRET`,
`SUPABASE_SERVICE_ROLE_KEY`.

### 3) Jadwal Cron yang perlu didaftarkan

Dua route cron perlu dipanggil terjadwal dengan header
`Authorization: Bearer <CRON_SECRET>`. Kalau hosting di Vercel, daftarkan di
`vercel.json` (file ini sengaja tidak disertakan di arsip ini, sesuaikan
dengan `vercel.json` project kamu yang sudah ada) atau lewat dashboard Vercel
→ Project Settings → Cron Jobs:

| Path | Jadwal disarankan | Catatan |
| --- | --- | --- |
| `/api/cron/send-reminders` | tiap jam (`0 * * * *`) | Reminder Telegram + Push dicek tiap jam biar cocok sama `reminder_time` pilihan tiap user. Plan Vercel Hobby cuma bisa 1x/hari — kalau masih di Hobby, jadwalkan sekali di jam yang paling banyak dipilih user (default `08:00` WIB). |
| `/api/cron/cleanup-expired-deadlines` | sekali sehari (misal `30 20 * * *` UTC = ~03:30 WIB) | Cukup sekali sehari, cuma jalan buat user yang aktifin opsi auto-hapus. |

### 4) Cara test

- **Push notification**: login → Settings → Reminder → klik "Aktifkan
  Notifikasi HP" → izinkan permission browser → klik "Kirim tes" → notifikasi
  asli harus muncul di HP/laptop (icon logo NEXA, ada tombol Buka/Tutup).
  Kalau `NEXT_PUBLIC_VAPID_PUBLIC_KEY` kosong, tombolnya kasih pesan error
  yang jelas, bukan diam.
- **Telegram tutorial**: buka Settings → Reminder → bagian "Cara setup
  Telegram" harus tampil 5 langkah. Isi `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
  → tombol "Buka Bot Telegram" muncul dan deep-link ke bot yang benar.
- **Reminder beneran terkirim**: set salah satu deadline ke H-1/hari-H,
  aktifkan `reminder_enabled`, pastikan sudah subscribe push & isi Telegram
  chat ID, lalu panggil manual:
  `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/send-reminders`
  → response JSON harus nunjukkan `telegram.sent` dan/atau `push.sent` > 0.
- **Auto-hapus deadline lewat**: di Settings → Reminder, nyalakan toggle
  "Hapus otomatis deadline yang sudah lewat", pilih "Langsung", lalu panggil
  manual: `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/cleanup-expired-deadlines`
  → deadline lama user itu (yang statusnya belum selesai maupun sudah) harus
  hilang dari daftar. **Hati-hati waktu test di data production** — ini
  penghapusan permanen.

---

## Update lanjutan 4: WhatsApp reminder (Wablas) + hapus notifikasi

### 1) SQL yang harus dijalankan

**Tidak ada migration baru untuk update ini.** Channel `'whatsapp'` sudah
diizinkan sejak schema awal, dan fix unique constraint `reminder_preferences`
di "Update lanjutan 3" (`20260808_push_channel_and_autodelete.sql`) sudah
otomatis mencakup channel `whatsapp` juga. Kalau migration itu belum
dijalankan, jalankan dulu sebelum test fitur WhatsApp.

### 2) Environment variables baru

| Variable | Wajib | Fungsi |
| --- | --- | --- |
| `WABLAS_API_URL` | wajib untuk WhatsApp aktif | URL endpoint kirim pesan dari akun Wablas kamu, contoh: `https://<namaserver>.wablas.com/api/send-message`. Tiap akun Wablas beda sub-domain, cek di dashboard Wablas kamu. |
| `WABLAS_TOKEN` | wajib untuk WhatsApp aktif | Token dari dashboard Wablas (menu Device/Settings). |

Kalau dua env ini kosong, kartu "Notifikasi WhatsApp" di Settings tetap
tampil tapi dengan badge "Gateway belum diaktifkan server" dan tombol tes
disabled — nggak bikin error, cuma nonaktif dengan jelas.

### 3) Cara test

- **WhatsApp**: isi `WABLAS_API_URL` + `WABLAS_TOKEN` → restart server →
  Settings → Reminder → kartu "Notifikasi WhatsApp" → isi nomor → klik
  "Kirim Test WhatsApp" → pesan harus masuk ke WA nomor itu dalam beberapa
  detik. Kalau gagal, baca pesan error yang muncul (biasanya langsung dari
  response Wablas, jadi cukup jelas apa yang salah — token, nomor, atau
  device offline).
- **Reminder WhatsApp beneran terkirim**: sama seperti test push/telegram di
  atas — set salah satu deadline ke H-1/hari-H, aktifkan togglenya di kartu
  WhatsApp, lalu panggil manual:
  `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/send-reminders`
  → response JSON harus nunjukkan `whatsapp.sent > 0`.
- **Hapus notifikasi**: buka bell icon atau `/dashboard/notifications` →
  klik ikon tempat sampah di satu notifikasi (harus langsung hilang), lalu
  coba "Hapus semua" (harus muncul konfirmasi dulu sebelum benar-benar
  menghapus semuanya).

### 4) Rekomendasi lanjutan (belum dikerjakan, sengaja)

Copy marketing/legal berikut masih menyiratkan "WhatsApp belum aktif" dan
sebaiknya direview manual sebelum diedit (khususnya privacy policy, karena
sekarang ada disclosure baru: nomor WhatsApp yang kamu isi dikirim ke Wablas
sebagai pemroses pihak ketiga):
- `src/app/page.tsx` (badge "WhatsApp menyusul", FAQ landing page)
- `src/app/terms/page.tsx`
- `src/app/privacy/page.tsx`
- `src/components/LoginClient.tsx` ("Telegram dulu, Wablas nanti.")

---

## Update lanjutan 5: Fix build + notifikasi popup in-app

### 1) Tidak ada SQL baru

Popup notifikasi pakai tabel `notifications` yang sudah ada, lewat Supabase
Realtime (`postgres_changes`) yang **sudah dipakai sebelumnya** oleh bell
icon — kalau bell icon kamu sebelumnya sudah update otomatis tanpa refresh
manual, berarti Realtime sudah aktif buat tabel ini dan popup baru bakal
langsung jalan juga. Kalau belum pernah dicek, pastikan di Supabase
Dashboard → Database → Replication, tabel `public.notifications` statusnya
ON.

### 2) Cara test

- Buka app di 2 tab/device (atau 1 tab + curl manual), pastikan login.
- Trigger notifikasi baru — cara paling gampang: panggil
  `/api/cron/send-reminders` manual (lihat "Update lanjutan 2") pada
  deadline yang H-1/hari-H, ATAU langsung insert baris tes ke tabel
  `notifications` lewat SQL Editor:
  ```sql
  insert into public.notifications (user_id, type, title, message, link)
  values ('<user-id-kamu>', 'system', 'Tes Popup', 'Ini notifikasi tes buat cek popup.', '/dashboard');
  ```
- Popup harus muncul dalam &lt;1 detik tanpa reload halaman. Di HP: coba
  geser kartu ke samping buat nutup. Di desktop: harus nongol di
  pojok kanan-atas, bukan full-width.

### 3) Fix build Vercel

Error `react/no-unescaped-entities` di `DeadlineAutoDeleteSettings.tsx`
(dari kutip lurus di teks JSX) sudah diperbaiki. Kalau deploy berikutnya
masih gagal karena ESLint, kemungkinan besar itu file lama yang memang
belum pernah disentuh Claude — cek nama file & baris di build log, pola
perbaikannya sama: ganti `"kata"` jadi `&quot;kata&quot;` di teks JSX, atau
tambah `/* eslint-disable react/no-unescaped-entities */` di baris ke-2
file kalau teksnya banyak.

---

## Update lanjutan 6: Fix glitch/modal + gesture notifikasi + insight histori

### 1) Tidak ada SQL baru

Semua fitur round ini pakai tabel yang sudah ada (`academic_deadlines`,
`notifications`, `reminder_preferences`). Tidak ada migration baru.

### 2) Cara test

- **Fix garis-garis**: buka Command Focus Plan (kartu biru tua di dashboard,
  kalau plan kamu bukan Command) di HP Android — harusnya kelihatan
  overlay lock yang bersih, bukan noise/garis-garis di belakangnya.
- **Fix modal laporkan**: buka profil orang lain → klik "Laporkan" → modal
  harus kebuka penuh dengan tombol "Kirim Laporan" kelihatan & bisa
  di-scroll kalau perlu, TIDAK ketutup bottom nav.
- **Gesture tarik notifikasi**: di HP, pastikan halaman lagi di paling atas
  (belum di-scroll), tarik layar ke bawah dari dekat atas — harus muncul
  indikator panah, lanjut tarik sampai panel notifikasi kebuka penuh. Tarik
  panel ke atas lagi buat nutup.
- **Insight belajar dari histori**: butuh minimal 5 deadline yang sudah
  ditandai selesai (`status = 'completed'`) dalam 8 minggu terakhir baru
  insight-nya muncul lengkap — kalau belum, kartu nunjukin progress bar aja.
  Test cepat: tandai 5+ deadline lama sebagai selesai, refresh dashboard,
  kartu "NEXA belajar dari kamu" harus muncul dengan jam & hari tersaran +
  tombol "Pakai jam ini" yang beneran update `reminder_preferences`.

### 3) Keputusan yang masih perlu dikonfirmasi

Soal "jangan pake kamu" — kata "kamu" masih dipakai di 54 file lain di luar
5 file yang sudah dibersihkan dari "lu". Belum disentuh karena skalanya
besar (butuh baca tiap kalimat biar nggak jadi aneh grammar-nya, bukan
sekadar cari-ganti). Tunggu arahan: mau disapu semua sekaligus, atau
diprioritaskan ke halaman tertentu dulu?
