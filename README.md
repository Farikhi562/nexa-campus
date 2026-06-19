# NEXA Campus — Batch 9: Security Hardening

Fix untuk **semua 9 temuan** dari audit keamanan sebelumnya. 23 file (1 migration SQL +
2 lib baru + 20 route yang dipatch). Semua diverifikasi `tsc --noEmit` (0 error, full source
asli) dan `next build` produksi (sukses, semua route ter-bundle).

## 🔴 Kritis

### 1. `payment_orders` — RLS tidak pernah enable
**Fix:** `docs/MIGRATION_security_hardening.sql` §1 — enable RLS + policy SELECT-own-only.
Sengaja TIDAK ada policy insert/update/delete untuk `authenticated` (order hanya dibuat/diupdate
lewat service-role client di server, client tidak pernah butuh tulis langsung).

### 2. `award_points` RPC bisa dipanggil bebas dari client
**Fix:** `docs/MIGRATION_security_hardening.sql` §2 — function di-redefinisi: parameter
`p_points` **dihapus total** (poin sekarang hardcode di server via whitelist 5 kind), dan
`p_ref` **wajib diisi** (dedup selalu aktif, tidak bisa di-spam).
**5 call site di kode diupdate** (hapus `p_points` dari pemanggilan, sesuai signature baru):
`focus/complete`, `smart-input/confirm`, `daily-pulse`, `deadlines` (create), `deadlines/[id]`
(complete + ontime_bonus).
**Diverifikasi:** 10 test assertion mensimulasikan logic SQL di JS — termasuk skenario exploit
asli (kirim `p_points: 999999999` → diabaikan; loop 1000x tanpa ref → 0 yang berhasil insert).

### 3. Cron reminder — header `x-vercel-cron` bisa dipalsukan (bug saya sendiri dari Batch 6)
**Fix:** `src/app/api/cron/send-reminders/route.ts` — baris pengecekan header itu dihapus.
Sekarang murni `CRON_SECRET` via `Authorization: Bearer`, sesuai dokumentasi resmi Vercel.

## 🟠 Tinggi

### 4. Telegram webhook fail-open kalau env kosong
**Fix:** `src/app/api/telegram/webhook/route.ts` — sekarang fail-**closed**. Kalau
`TELEGRAM_WEBHOOK_SECRET` belum diset, endpoint menolak (503) alih-alih melewati validasi.

### 5. Nol rate limiting di seluruh aplikasi
**Fix:** Infrastruktur baru — `docs/MIGRATION_security_hardening.sql` §4 (tabel `rate_limits` +
function `check_rate_limit`, atomic via `insert ... on conflict ... do update ... returning`,
tidak butuh Redis/layanan eksternal) + `src/lib/rate-limit.ts` (wrapper TS).
**Dipasang di 8 endpoint:**

| Endpoint | Limit |
|---|---|
| `ai-extract` | 20/jam |
| `ai-extract-image` | 15/jam |
| `ask-nexa` (chatbot) | 30/jam |
| `quick-nl` | 30/jam |
| `smart-input/parse-text` | 20/jam |
| `smart-input/parse-image` | 15/jam |
| `smart-input/parse-file` | 15/jam |
| `study-rooms/join-by-code` | 10/5 menit (anti brute-force) |

**PENTING:** `checkRateLimit()` **fail-open** kalau RPC belum ada (migration belum dijalankan)
— supaya kode tidak mematikan fitur AI sebelum migration jalan. Begitu migration dieksekusi,
proteksi otomatis aktif tanpa redeploy kode. **Jalankan migration SEGERA setelah deploy kode ini.**

## 🟡 Sedang

### 6. Kode join Study Room cuma 16,7 juta kombinasi (hex 6 karakter)
**Fix:** `docs/MIGRATION_security_hardening.sql` §3 — alfabet diperlebar jadi 34 karakter
(alfanumerik tanpa I/O) → ~1,5 miliar kombinasi. Panjang tetap 6 karakter (UI sudah ada
`maxLength={6}`, sengaja tidak diubah). Digabung dengan rate limit #5 di atas.

### 7. `is_public_profile` tidak ditegakkan
**Fix:** `src/app/api/profile/[id]/route.ts` — sekarang dicek. Kalau bukan pemilik profil DAN
bukan teman DAN `is_public_profile === false`, response dipangkas jadi minimal (`id`,
`full_name`, `avatar_url`, `private: true`).
**Asumsi yang saya buat** (tolong dikoreksi kalau beda dari maksud aslinya): teman tetap bisa
lihat profil lengkap meski `is_public_profile=false` — mirip pola `dm_privacy` di tempat lain.
`is_public_profile` null/undefined (data lama) dianggap public, supaya tidak mematahkan profil
yang belum pernah set nilai eksplisit.

### 8. MIME upload cuma dicek dari `file.type` (header client, gampang dipalsukan)
**Fix:** `src/lib/file-signature.ts` (baru) — verifikasi magic byte (isi file sebenarnya).
Dipasang di 3 route upload: `chats/[friendId]/upload`, `study-rooms/[id]/upload`,
`profile/photo`. Cakupan: JPEG/PNG/GIF/WEBP/PDF/ZIP (docx/xlsx terdeteksi sebagai ZIP, ini
wajar). Video & text/plain tidak ada signature sederhana yang reliable, jadi tetap lolos di
lapis ini (mengandalkan validasi MIME header yang sudah ada sebagai lapis pertama).
**Diverifikasi:** 16 test assertion dengan byte signature asli, termasuk kasus utama — file
PDF yang diklaim `image/png` berhasil terdeteksi & ditolak.

## ⚪ Rendah

### 9a. Admin route `subscription-intents` punya logic sendiri yang gak sinkron
**Fix:** `src/app/api/admin/subscription-intents/[id]/route.ts` — sekarang pakai
`isAdminEmail()` dari `lib/admin.ts` (satu sumber kebenaran), bukan implementasi duplikat.

### 9b. Signature Midtrans pakai `===` bukan `timingSafeEqual`
**Fix:** `src/lib/payments/midtrans.ts` — pakai `crypto.timingSafeEqual` (defense in depth).

---

## ✅ Yang sudah diverifikasi
- `tsc --noEmit` strict, full source asli + semua patch Batch 9: **0 error**.
- `next build` produksi (Next.js 14.2.35): **sukses**, semua route (termasuk yang dipatch)
  ter-bundle normal.
- 16 test assertion runtime untuk `file-signature.ts` (byte signature asli).
- 10 test assertion untuk logic `award_points` baru (simulasi JS dari logic SQL).

## ⚠️ Yang TIDAK bisa saya verifikasi dari sandbox ini
- **Migration SQL belum pernah dieksekusi ke Postgres sungguhan** (tidak ada koneksi database
  live di sini). Logic-nya sudah saya tulis hati-hati & disimulasikan di JS, tapi **wajib
  ditest di Supabase SQL Editor kamu** sebelum production — terutama:
  - Pastikan `drop function if exists public.award_points(text, integer, text);` berhasil
    (kalau ada dependency lain yang masih merujuk overload lama, mungkin perlu penyesuaian).
  - Test manual: buat 1 deadline baru, complete-kan, cek `points_events` bertambah dengan
    angka yang benar (2, lalu 10+5 kalau on-time).
  - Test `generate_room_code()`: buat beberapa room baru, pastikan kode 6 karakter ter-generate
    tanpa error.
- Rate limiting: logic-nya benar secara desain (atomic SQL), tapi belum pernah benar-benar
  dipanggil 20+ kali berturut-turut terhadap Postgres sungguhan untuk lihat perilaku window
  reset-nya persis seperti yang diharapkan — sarankan test manual setelah deploy.

## 📋 Cara pasang (urutan penting)
1. **Backup database dulu** (perubahan ini menyentuh fungsi inti poin & pembayaran).
2. Jalankan `docs/MIGRATION_security_hardening.sql` di Supabase SQL Editor.
3. Timpa 21 file kode + 2 lib baru.
4. Pastikan env `CRON_SECRET` dan `TELEGRAM_WEBHOOK_SECRET` sudah diset di Vercel (kalau belum,
   cron reminder & Telegram webhook akan berhenti berfungsi sampai diisi — ini **disengaja**,
   bagian dari fix #3 dan #4 di atas).
5. `npm run build` (sudah divalidasi hijau di sandbox).
6. Test manual sesuai daftar di atas (poin, room code, rate limit, upload file disguised).
