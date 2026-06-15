# NEXA Campus — Batch 5 (Fix Build + NEXA Assistant Command)

## 🔴 1. FIX BUILD ERROR (wajib — ini yang bikin deploy gagal)
- `src/components/study-room/StudyRoomCall.tsx` — **diperbaiki.**
  Baris `const apiRef = useRef<ReturnType<...['dispose']>...>` rusak (properti `dispose` ada di
  instance, bukan di constructor) **dan tidak terpakai**. Sudah dihapus; tipe `apiInstance`
  dibetulkan pakai interface `JitsiApi`. Timpa file lama dengan versi ini → build lolos.

> Warning `<img>` lain di log itu cuma peringatan ESLint (non-blocking), bukan penyebab gagal. Aman diabaikan; kalau mau bersih, ganti `<img>` jadi `next/image` bertahap.

## ✨ 2. Halaman NEXA Assistant — canggih, KHUSUS Command, muncul di nav mobile

**File baru/diubah:**
- `src/app/dashboard/nexa-assistant/page.tsx` **(BARU)** — route halaman, **gate ke NEXA Command**.
  Non-Command melihat layar upgrade; Command langsung masuk asisten. Deadline aktif user
  otomatis dibaca jadi konteks.
- `src/components/ai/NexaAssistantCommand.tsx` **(BARU)** — asisten canggih: chat multi-turn +
  **4 mode** (Rencana Belajar, Prioritaskan, Analisa Beban, Pecah Tugas) + panel konteks.
  (Nama sengaja beda dari `NexaCommandAssistantPage.tsx` yang sudah ada di repo-mu, supaya tidak menimpa.)
- `src/components/dashboard/nav-items.ts` — entri **NEXA Assistant** kini menunjuk ke
  `/dashboard/nexa-assistant` + flag `command: true`.
- `src/components/MobileNavMenu.tsx` — terima prop `isCommand`; item ber-flag `command`
  **disembunyikan untuk non-Command** + diberi badge "Command". Masuk grup "Fitur utama".
- `src/components/AppShell.tsx` — hitung `isCommand` via `getEffectivePlan(...)` lalu teruskan ke
  `MobileNavMenu`.

**Hasil:** Di hamburger mobile, pengguna **Command** melihat menu "NEXA Assistant" (badge Command)
di bagian Fitur utama; non-Command tidak melihatnya, dan kalaupun membuka URL-nya langsung, halaman
menampilkan layar upgrade.

### Catatan teknis
- Gate ganda: nav (disembunyikan) **dan** halaman (authoritative pakai `getEffectivePlan` dari DB).
  Jadi aman walau ada yang akses URL manual.
- Deteksi Command di nav memakai field yang diteruskan ke `AppShell` (email founder, `lifetime_command`,
  `plan`). Kalau ingin deteksi expiry-based di nav juga akurat, teruskan field expiry ke `ShellProfile`
  saat render `AppShell` (opsional; halaman tetap akurat tanpa ini).
- "Canggih"-nya: mode = preset instruksi yang disisipkan ke pesan, plus konteks deadline otomatis.
  Semua lewat endpoint `/api/ask-nexa` yang sudah ada (tidak perlu backend baru).

## Pemasangan
1. Timpa semua file sesuai struktur folder.
2. Build ulang / deploy. Build error StudyRoomCall hilang.
3. Login sebagai user Command (atau email founder) → cek menu "NEXA Assistant" muncul di hamburger mobile & halaman terbuka.
