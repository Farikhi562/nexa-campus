# NEXA Campus — Paket Perbaikan (Batch 1)

Berisi file drop-in untuk menggantikan file yang sama di repo `dimsum`/NEXA Campus.
Struktur folder sudah mengikuti repo (`src/...`), jadi tinggal timpa.

> Catatan jujur soal scope: permintaanmu = 10 bug + translate + ganti AI model + push notif HP + Gmail reminder.
> Yang **bisa kuselesaikan jadi kode siap-pakai sekarang** ada di Batch 1 ini (AI model + translate + 4 bug).
> Push notif HP & Gmail reminder = **Fase 2**, karena butuh kredensial/aksi dari kamu (API key, VAPID key, app password Gmail) dan deploy. Rencananya ada di bawah.

---

## ✅ Yang sudah diperbaiki (Batch 1)

### 1. Ganti AI model → bisa pilih provider GRATIS (masalah "gemini-2.5-flash gabisa")
File baru/diubah:
- `src/lib/ai/llm.ts` **(BARU)** — layer AI multi-provider (Groq / OpenRouter / Cerebras / Gemini)
- `src/lib/ai/gemini.ts` — sekarang delegasi ke `llm.ts`
- `src/lib/ai/ask-nexa.ts` — tipe provider diperluas
- `src/app/api/deadlines/ai-extract/route.ts` — pakai `llm.ts` (fallback parser tetap ada)
- `src/app/api/deadlines/ai-extract-image/route.ts` — pakai `llm.ts` (vision)

👉 **Cara pakai: set `AI_PROVIDER=groq` + `AI_API_KEY=...` di Vercel.** Detail & perbandingan di `docs/AI_PROVIDER_GUIDE.md`.

### 2. Translate (i18n) tidak konsisten → diperbaiki
- `src/lib/i18n.tsx` — provider sekarang mendengarkan event perubahan bahasa & `localStorage`, jadi ganti bahasa langsung ter-update di seluruh komponen (sebelumnya sebagian UI tidak ikut berubah karena ada 2 sistem i18n yang tidak sinkron).
> Keterbatasan jujur: sebagian besar teks UI masih hardcoded Bahasa Indonesia. Sinkronisasi ini bikin switch bahasa berfungsi benar, tapi untuk EN/ZH 100% perlu ekstraksi string di tiap komponen (pekerjaan bertahap, bisa dilanjut terpisah).

### 3. BUG-002 — Heartbeat 500 (High)
- `src/app/api/presence/heartbeat/route.ts` — tidak lagi balas 500 (balas 200 `ok:false` + log), jadi console tidak dibanjiri error berulang.
> Akar masalah sebenarnya: tabel `user_presence` / RLS. Lihat `docs/MIGRATION_user_presence.sql` — jalankan di Supabase kalau tabelnya belum ada.

### 4. BUG-008 — User Pulse tetap diblokir fitur AI foto (High)
- `src/app/dashboard/deadlines/quick-add/page.tsx` — sekarang menghitung **plan efektif** (`getEffectivePlan`, sadar trial/founder/expiry), bukan kolom `plan` mentah.

---

## 🔧 Perbaikan kecil (patch manual, 1–2 baris — aman & cepat)

### BUG-001 — Favicon 404 (Low)
1. Taruh file `favicon.ico` di `src/app/favicon.ico` (Next.js App Router otomatis serve dari sini), atau
2. Tambah file `src/app/icon.png` (512×512). Next.js akan generate link icon otomatis.
   (Tidak perlu kode tambahan.)

### BUG-007 — Validasi form tanpa pesan error (Medium)
Di `src/components/DeadlineForm.tsx`:
- Baris ~215, ubah tag form:
  ```diff
  - <form onSubmit={submit} className="space-y-4 pb-24 sm:pb-0">
  + <form onSubmit={submit} noValidate className="space-y-4 pb-24 sm:pb-0">
  ```
  `noValidate` mematikan validasi bawaan browser (yang cuma auto-scroll tanpa pesan jelas), sehingga `validate()` milik kita yang jalan dan menampilkan pesan error bergaya di bawah form.
- (Opsional) biar pesan langsung kelihatan, di blok `if (validationError) { setError(...) }` tambah:
  ```ts
  setTimeout(() => document.querySelector('[data-form-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0)
  ```
  lalu di baris error display (~317) tambah atribut: `<p data-form-error ...>`.

### BUG-009 — Kontras tombol "Install Aplikasi" (Low, WCAG)
Cari tombol install (kemungkinan di `src/components/InstallAppPrompt.tsx` atau `PwaInstallBanner.tsx`)
yang pakai `bg-[#0284c7]` / `bg-sky-600` dengan teks putih (rasio 4.09:1).
Ganti ke warna lebih gelap agar ≥ 4.5:1, contoh:
```diff
- className="... bg-sky-600 text-white ..."
+ className="... bg-sky-700 text-white ..."
```
`sky-700 (#0369a1)` + teks putih ≈ 5.6:1 → lolos WCAG AA.

### BUG-003/004/005 (CORS foto, WebSocket realtime, hydration) — butuh konfigurasi, bukan 1 file
- **BUG-003 (CORS foto profil "local address space"):** ini karena Supabase Storage URL diakses dari konteks dev/preview. Pastikan `next.config` `images.remotePatterns` mengizinkan host Supabase-mu, dan akses lewat domain production (bukan IP/localhost). Catatan ada di `docs/NOTES_bug_003_004_005.md`.
- **BUG-004 (WebSocket realtime gagal):** cek `NEXT_PUBLIC_SUPABASE_URL` benar (wss), dan Realtime aktif di Supabase. Sering hanya muncul di preview deploy.
- **BUG-005 (hydration #425/#422):** biasanya karena render tergantung `Date.now()`/`localStorage`/random di server vs client (mis. komponen bahasa/streak). Bungkus bagian itu agar render setelah mount. Detail di `docs/NOTES_bug_003_004_005.md`.

---

## 🔜 Fase 2 — butuh aksi/kredensial dari kamu

### A. Gmail reminder (email pengingat deadline)
Repo sudah punya sistem reminder Telegram (`/api/cron/send-reminders`, `lib/reminders/telegram.ts`).
Rencana: tambah channel email lewat Gmail SMTP (nodemailer) memakai **App Password** (bukan password biasa).
Yang kubutuhkan darimu: `GMAIL_USER` + `GMAIL_APP_PASSWORD` (lihat `.env.ai.example`).
Kalau kamu kasih lampu hijau, aku kirim: `lib/reminders/email.ts` + integrasi ke cron + template email.

### B. Notifikasi HP (Web Push)
Rencana: Web Push (VAPID) + service worker, jadi pengingat muncul sebagai notifikasi HP walau web ditutup (PWA).
Yang kubutuhkan: generate VAPID keys (`npx web-push generate-vapid-keys`) → isi `.env`.
Kalau oke, aku kirim: tabel `push_subscriptions` (SQL), `/api/push/subscribe`, update service worker, dan pengait ke cron reminder.

> Kedua fitur ini saling melengkapi sistem reminder yang sudah ada. Karena butuh secret + deploy, lebih aman dikerjakan setelah Batch 1 ini kamu pasang & verifikasi.

---

## Urutan pemasangan yang disarankan
1. Timpa file dari folder `src/...` ke repo.
2. Set ENV AI (`AI_PROVIDER`, `AI_API_KEY`) di Vercel. Redeploy.
3. Jalankan `docs/MIGRATION_user_presence.sql` di Supabase (kalau tabel presence belum ada).
4. Terapkan patch kecil BUG-001/007/009.
5. Test: Tanya NEXA, AI Quick Add (teks + foto), ganti bahasa, buka dashboard (cek console bersih).
6. Kabari kalau mau lanjut Fase 2 (Gmail + Push).
