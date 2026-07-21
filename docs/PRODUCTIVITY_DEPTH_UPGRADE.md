# NEXA Campus — Productivity Depth Upgrade v9

Update ini memperdalam fitur yang sudah ada, bukan menambah menu baru yang akhirnya cuma jadi pajangan sidebar.

## Fitur yang ditambahkan

### 1. Deadline checklist + progress
- Checklist/subtask per deadline.
- Progress otomatis berdasarkan checklist.
- Estimasi pengerjaan 5–600 menit.
- Tombol **Kerjain sekarang** menuju Focus Mode dengan deadline terpilih.

### 2. Focus Mode terhubung deadline
- Pilih deadline sebelum memulai sesi.
- Histori durasi disimpan ke `focus_sessions`.
- Progress berbasis waktu bertambah jika deadline belum punya checklist.
- Progress waktu dibatasi 95% agar tugas tidak otomatis dianggap selesai hanya karena timer habis.

### 3. Actionable notifications
- Deadline bisa langsung ditandai selesai.
- Bisa dibuka langsung di Focus Mode.
- Bisa ditunda 1 jam.
- Reminder baru menyimpan `related_deadline_id` agar action tidak bergantung pada URL saja.

### 4. Daily Pulse check-out
- Check-in pagi tetap ada.
- Check-out akhir hari: target tercapai/belum, mood akhir, dan catatan evaluasi.
- Ringkasan ritme tujuh hari.

## Migration wajib

Jalankan file berikut di Supabase SQL Editor sebelum deploy source code:

```text
supabase/migrations/20260721_productivity_depth.sql
```

Salinan idempotent juga tersedia di:

```text
supabase/fix_productivity_depth_v9.sql
```

## Urutan deploy

1. Backup database.
2. Jalankan migration SQL.
3. Deploy source code.
4. Tes alur: tambah deadline → checklist → Focus Mode → notification action → Daily Pulse checkout.

## Catatan validasi

Arsip sumber yang diberikan tidak menyertakan `package.json`, `tsconfig.json`, atau konfigurasi Next/Tailwind lengkap. Karena itu full `next build` tidak dapat dijalankan dari ZIP ini. Seluruh file TypeScript/TSX yang diubah sudah melewati pemeriksaan parser TypeScript tanpa syntax error.
