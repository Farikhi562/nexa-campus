# NEXA Campus — Focus Mode: Visual Polish

Validasi: `tsc --noEmit` 0 error, `next build` produksi sukses (`/dashboard/focus` naik dari
3.06 kB → 4.73 kB, mengonfirmasi kode baru ter-bundle). Logic timer inti (preset, pause/resume,
reset, POST ke `/api/focus/complete`) **tidak diubah** — murni tambahan visual + nicety.

## File
| File | Perubahan |
|---|---|
| `src/components/dashboard/FocusMode.tsx` | Lihat di bawah |
| `src/app/dashboard/focus/page.tsx` | Fetch 7 hari terakhir riwayat fokus (dari `points_events`, data asli — bukan dummy) untuk strip streak |

## Yang ditambah
1. **Strip 7 hari di hero** — kotak kecil per hari (Sen-Min), menyala teal kalau hari itu ada
   sesi fokus selesai. Diambil dari `points_events` (`kind='focus_session'`) milik user sendiri,
   dibaca server-side via RLS yang sudah ada — tidak butuh tabel/migration baru.
2. **Badge "X/7 hari aktif"** di hero kalau streak > 0, plus badge "Poin hari ini sudah didapat"
   kalau hari ini sudah submit sesi.
3. **Judul tab browser ikut hitung mundur** (`MM:SS · Fokus — NEXA`) saat timer jalan — kebaca
   tanpa harus buka tab.
4. **Bunyi chime singkat** (2 nada, Web Audio API — tanpa file audio eksternal) saat sesi
   fokus/istirahat selesai. Bisa dimatikan (ikon speaker).
5. **Notifikasi browser** (opsional, minta izin saat diaktifkan) saat sesi selesai DAN tab
   sedang tidak aktif — supaya tau progress meski lagi buka tab lain.
6. **Visual lebih hidup saat berjalan**: ring progress dapat glow sesuai mode (teal=fokus,
   amber=istirahat), efek pulse halus di background hero, angka timer sedikit membesar.
   Warna ring & background ikut transisi mulus saat ganti mode fokus↔istirahat.
7. Tombol Mulai/Jeda ganti warna (teal saat siap mulai, amber saat sedang jeda) + efek
   `active:scale-95` di semua tombol biar terasa lebih responsif disentuh.

## Cara pasang
Timpa 2 file di atas. Tidak ada migration, tidak ada dependency baru, tidak ada ENV baru.
