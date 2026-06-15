# NEXA Campus — Fitur Baru (Batch 3)

## ✅ Sudah dibangun (siap pasang)

### 1. Input deadline cepat — 1 baris natural language
- `src/app/api/deadlines/quick-nl/route.ts` **(BARU)** — terima teks bebas, parse pakai AI (kalau aktif) atau parser lokal, lengkapi field wajib otomatis (kampus dari profil, jam default 23:59, ruang "Online"/"Menyusul"), validasi pakai validator yang sama dengan form, lalu simpan ke `academic_deadlines`.
- `src/components/deadlines/QuickDeadlineBar.tsx` **(BARU)** — input 1 baris + Enter untuk submit.

**Cara pasang:** taruh `<QuickDeadlineBar />` di atas dashboard / halaman Semua Deadline.
Contoh input: `tugas kalkulus bab 3 jumat jam 5 sore vclass`, `bayar ukt 20 juni`, `kuis fisika besok jam 9 pagi`.

### 2. Study Room — Voice / Video Call
- `src/components/study-room/StudyRoomCall.tsx` **(BARU)** — panggilan grup audio/video via **Jitsi** (gratis, tanpa server sendiri, tanpa API key). Tiap room punya ruang unik `nexa-campus-study-{roomId}`.

**Cara pasang** di `components/study-room/StudyRoomDetail.tsx`:
```tsx
import StudyRoomCall from '@/components/study-room/StudyRoomCall'
// di dalam render, mis. di kolom kanan room:
<StudyRoomCall roomId={roomId} displayName={/* nama user */ 'Mahasiswa'} />
```
> Default pakai `meet.jit.si` (publik). Kalau mau privat/branding, bisa self-host Jitsi atau pakai 8x8 JaaS lalu ganti `JITSI_DOMAIN` di komponen. Tidak ada biaya untuk meet.jit.si.

---

## 🔜 Dua fitur sisanya — perlu langkah tambahan (kukerjakan batch berikutnya)

### 3. Tambah Teman — Cari by NEXA ID / QR
Kabar baik: **cari by NEXA ID sudah JALAN** di backend (`/api/friends/search` sudah mendeteksi input 6 digit → cari `nexa_id`). Yang perlu ditambah cuma sisi **QR**:
- Kartu "NEXA ID + QR kamu" (untuk dibagikan).
- Scanner kamera untuk baca QR teman → langsung cari.
- Butuh 2 dependency kecil: `qrcode.react` (bikin QR) + `html5-qrcode` (scan). Karena nambah dependency & perlu `npm install`, kupisah ke batch berikutnya biar kamu setujui dulu.

### 4. NEXA Arena — Leaderboard tim & badge kompetisi
Ini butuh aku **lihat skema tabel arena/tim kamu dulu** (nama tabel tim, anggota, skor) supaya query-nya akurat. Kalau kamu kasih lampu hijau, aku intip skema arena lalu kirim: SQL (view leaderboard tim + tabel badge), API, dan UI leaderboard + badge.

> Mau lanjut #3 dan #4 sekarang? Bilang aja, nanti kukerjakan. Untuk #4 aku perlu konfirmasi nama tabel arena kamu (atau aku tebak dari kode `app/dashboard/arena`).
```
