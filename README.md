# NEXA Campus — Batch 21: Deadline UX + Dashboard Stats + Error Sanitization

## Validasi
- `tsc --noEmit` standar: 0 error
- `tsc --noEmit` ES5 strict probe: 0 error
- `next build` ESLint aktif: 0 error, 0 warning
- 152 test assertion sesi ini: semua lulus, zero regresi

---

## 1) Deadline UX — Search + Filter + Bulk Actions (`DeadlineList.tsx`)

Halaman `/dashboard/deadlines` sekarang punya:

### Search
- Input real-time — filter berdasarkan nama matkul + judul tugas
- Clear button (×) muncul saat ada isi

### Filter Pills (2 baris)
- Baris 1: **Semua** | Tugas | Praktikum | Kuis | Ujian | Presentasi | Administrasi | Pembayaran | Organisasi | Lainnya
- Baris 2: **Status** (Semua / Belum selesai / Selesai) · **Prioritas** (Urgent / High / Normal / Low)
- Tombol "Reset" muncul kalau ada filter aktif
- Counter "X dari Y deadline"

### Bulk Select & Actions
- Checkbox kecil di kiri tiap kartu deadline
- Tombol "Pilih semua" / "Batal pilih semua" (berdasarkan yang sedang di-filter, bukan semua)
- **Sticky action bar** di atas saat ada yang dipilih — hitam, floating, show jumlah terpilih
- Bulk **Selesaikan** — mark semua terpilih sebagai completed
- Bulk **Hapus** — delete semua terpilih (ada confirm dialog)
- RecurringBadge ikut tampil di kartu

Semua filter + bulk berjalan client-side (tidak ada request tambahan ke server selama filtering).

---

## 2) Dashboard Stats Strip (`DashboardStatsStrip.tsx` + `app/dashboard/page.tsx`)

4 kartu angka di atas dashboard utama (di atas DeadlineDashboardOverview):

| Kartu | Isi |
|---|---|
| **Aktif** | Jumlah deadline yang belum selesai |
| **≤ 3 hari** | Pending deadlines yang jatuh tempo dalam 3 hari ke depan — merah kalau ada |
| **Minggu ini** | Deadline yang diselesaikan dalam 7 hari terakhir |
| **Streak / Rate** | Completion rate (%) + jumlah hari berturut user menyelesaikan minimal 1 deadline (🔥 kalau ≥ 3 hari) |

Streak dihitung dari `updated_at` deadlines completed — seberapa banyak hari berturut-turut user menyelesaikan sesuatu. Server component, tidak ada JS ekstra di client.

---

## 3) Error Sanitization — 61 Routes → 40 Files Fixed

**Sebelum:** 61 route mengembalikan `error.message` mentah ke client — ini bisa bocorkan:
- Nama table/kolom database (PostgreSQL error messages)
- Internal function names
- Stack trace fragments
- Kode SQL internal

**Sesudah:**
- Semua `{ error: error.message }` di-replace dengan `{ error: 'Terjadi kesalahan server.' }`
- `console.error('[route]', error.message)` ditambahkan di server-side untuk debugging tetap jalan
- 4 kasus lebih parah (`{ error: error.message, code: error.code, details: error.details, hint: error.hint }`) juga diperbaiki — ini expose bahkan lebih banyak info DB internal

**1 file dikecualikan sengaja:** `smart-input/confirm/route.ts` — di sini `error.message` masuk ke payload per-candidate (bukan top-level server error), untuk feedback validasi lokal.

---

## Cara Pasang
1. Timpa 43 file (DeadlineList, DashboardStatsStrip, dashboard/page.tsx, + 40 API routes)
2. `npm run build` — sudah divalidasi hijau
3. Test cepat:
   - `/dashboard` → cek 4 kartu stats muncul di atas
   - `/dashboard/deadlines` → coba search, filter tipe, filter status, pilih beberapa deadline → bulk selesaikan
   - Buka DevTools Network → cek response API yang error tidak lagi punya `error.message` yang expose internal info
