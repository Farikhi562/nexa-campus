# NEXA — Patch Notes & Integration Guide

## Overview

File-file berikut adalah versi yang sudah diperbaiki dan ditingkatkan dari source code NEXA. Berikut penjelasan lengkap setiap perubahan beserta cara integrasinya.

---

## Daftar File yang Diubah / Ditambah

```
src/
├── lib/
│   └── indonesia-data.ts          ← BARU: data universitas, jurusan, provinsi Indonesia
├── app/
│   ├── auth/
│   │   ├── login/page.tsx         ← FIX: bug login user baru + responsive
│   │   └── callback/route.ts      ← FIX: buat profile otomatis untuk user baru
│   ├── api/
│   │   ├── process/route.ts       ← FIX: bug OCR retry + error handling
│   │   └── user/profile/route.ts  ← FIX: auto-create profile + support avatar
│   └── dashboard/
│       ├── layout.tsx             ← IMPROVE: responsive padding mobile/desktop
│       ├── profile/page.tsx       ← NEW: foto profil + university combobox
│       ├── setup-profile/page.tsx ← NEW: foto profil + university combobox
│       └── tools/page.tsx         ← REDESIGN: 12 tool AI yang semua berfungsi
```

---

## 1. Bug Fix: Login User Baru

**Masalah:** User baru yang daftar via email+password berhasil signup, tapi saat login tidak bisa karena profile belum dibuat di tabel `profiles`.

**Root cause:** Supabase DB trigger `on_auth_user_created` kadang tidak berjalan atau lambat.

**Fix di `auth/login/page.tsx`:**
- Ditambahkan fungsi `ensureProfile()` yang dipanggil setelah signup berhasil DAN setelah login
- Jika profile tidak ada, dibuat otomatis sebelum redirect

**Fix di `auth/callback/route.ts`:**
- Setelah OAuth exchange, dicek apakah profile sudah ada
- Jika tidak, dibuat langsung menggunakan `serviceClient` (bypass RLS)
- Mengambil `full_name` dan `avatar_url` dari OAuth metadata

**Fix di `api/user/profile/route.ts`:**
- GET endpoint sekarang auto-create profile jika tidak ada
- Handle race condition (dua request concurrent) dengan graceful fallback

---

## 2. Bug Fix: OCR

**Masalah:** OCR gagal tanpa retry, error message tidak informatif, dokumen stuck di status "processing".

**Fix di `api/process/route.ts`:**
- Dokumen langsung di-update ke status `processing` sebelum OCR dimulai
- OCR di-retry sekali jika gagal pertama kali (dengan fresh signed URL)
- Validasi panjang teks OCR (min 50 karakter) untuk deteksi PDF kosong/rusak
- `error_message` dibersihkan saat retry berhasil
- Existing questions dihapus dulu sebelum insert ulang (fix duplicate jika reprocess)
- Error message lebih deskriptif untuk user

---

## 3. Fitur Baru: Foto Profil

**Komponen:** Avatar upload ada di 2 halaman:
- `dashboard/profile/page.tsx` (edit profil)
- `dashboard/setup-profile/page.tsx` (setup awal)

**Cara kerja:**
1. User pilih foto → preview langsung tampil
2. Saat save, foto diupload ke Supabase Storage bucket `avatars`
3. Path: `{user_id}/avatar.{ext}`
4. URL publik disimpan ke kolom `avatar_url` di tabel `profiles`
5. Cache bust dengan `?t={timestamp}` agar foto baru langsung tampil

**Setup Supabase yang perlu dilakukan:**
```sql
-- Buat storage bucket untuk avatars (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Policy: user hanya bisa upload ke folder miliknya
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 4. Fitur Baru: Combobox Universitas Indonesia

**File:** `src/lib/indonesia-data.ts`

Data berisi:
- `MAJOR_UNIVERSITIES`: ~120 perguruan tinggi terkemuka Indonesia (PTN + swasta)
- `PROVINCES`: 37 provinsi Indonesia (termasuk 4 provinsi Papua baru)
- `MAJORS`: ~100+ program studi dari berbagai bidang

**Komponen UniversityCombobox:**
- User bisa mengetik untuk mencari (min 2 huruf)
- Menampilkan maks 8 hasil dropdown
- Jika tidak ada di list → user bisa "Gunakan [input]" sebagai manual input
- Nilai tersimpan apa adanya (bisa nama kampus apapun)

**Alasan tidak pakai dropdown penuh:**
- Ada 4.000+ PT di Indonesia → tidak praktis di-scroll
- Combobox + manual input = solusi terbaik untuk coverage penuh

---

## 5. Redesign Halaman Tools

**Masalah lama:**
- Tools ditampilkan tapi tidak berfungsi
- Layout terlalu padat (numpuk)
- Tidak ada interaksi nyata

**Solusi baru di `dashboard/tools/page.tsx`:**
- 12 tools dikategorikan: Akademik, Belajar, Menulis, Produktivitas, Karier
- Filter by category (horizontal scroll di mobile)
- Setiap tool membuka chat interface langsung di halaman
- Chat menggunakan Anthropic API (`claude-sonnet-4-20250514`)
- Setiap tool punya system prompt yang spesifik untuk fungsinya
- Chat support multi-turn (histori percakapan dijaga per sesi)
- Back button kembali ke list tools

**Tools yang tersedia:**
1. Kalkulator IPK
2. Generator Sitasi (APA, MLA, Harvard, Chicago)
3. Essay & Makalah Planner
4. Study Timer / Pomodoro
5. Ringkasan Teks
6. Generator Soal Latihan
7. Konselor Karier
8. Grammar & Parafrase
9. Rencana Belajar
10. Coach Presentasi
11. Habit & Refleksi Belajar
12. Research Helper

**Catatan:** Tools memanggil Anthropic API langsung dari client. Pastikan CORS di-allow untuk domain kamu, atau pindahkan API call ke Next.js API route jika perlu menyembunyikan API key.

---

## 6. Responsivitas

**Perubahan di `dashboard/layout.tsx`:**
- Padding disesuaikan: `px-4 sm:px-6 lg:px-8` dan `py-6 sm:py-8`
- `pt-16` untuk mobile (top navbar), `lg:pt-0` untuk desktop (sidebar)

**Perubahan di `auth/login/page.tsx`:**
- Padding input form responsif: `p-5 sm:p-6`
- Email/password input lebih compact di mobile
- Font size disesuaikan untuk layar kecil

**Perubahan di `dashboard/profile/page.tsx`:**
- Form layout stacked di mobile, side-by-side di desktop (foto + info)
- Tombol full-width di mobile, auto-width di desktop

---

## Cara Apply Patch

### Option A: Copy paste per file

Ganti file original dengan file dari folder ini, satu per satu:

```bash
cp nexa_improved/src/lib/indonesia-data.ts          your-project/src/lib/
cp nexa_improved/src/app/auth/login/page.tsx         your-project/src/app/auth/login/
cp nexa_improved/src/app/auth/callback/route.ts      your-project/src/app/auth/callback/
cp nexa_improved/src/app/api/process/route.ts        your-project/src/app/api/process/
cp nexa_improved/src/app/api/user/profile/route.ts   your-project/src/app/api/user/profile/
cp nexa_improved/src/app/dashboard/layout.tsx        your-project/src/app/dashboard/
cp nexa_improved/src/app/dashboard/profile/page.tsx  your-project/src/app/dashboard/profile/
cp nexa_improved/src/app/dashboard/setup-profile/page.tsx  your-project/src/app/dashboard/setup-profile/
cp nexa_improved/src/app/dashboard/tools/page.tsx    your-project/src/app/dashboard/tools/
```

### Option B: Gunakan diff/patch

Buat diff dari file lama vs baru, lalu apply ke project.

---

## Checklist Setelah Apply

- [ ] Setup Supabase Storage bucket `avatars` dengan policy RLS (lihat bagian #3)
- [ ] Pastikan kolom `avatar_url` ada di tabel `profiles` (tipe: `text`, nullable)
- [ ] Pastikan kolom `universitas` di tabel `profiles` menerima text bebas (bukan enum)
- [ ] Pastikan Anthropic API key tersedia di environment (untuk Tools page)
- [ ] Test signup user baru → harus langsung redirect ke setup-profile
- [ ] Test OCR dengan PDF valid → check retry logic di log server
- [ ] Test upload foto profil → pastikan bucket `avatars` sudah public
- [ ] Test combobox universitas → cari + manual input harus work

---

## Environment Variables yang Diperlukan

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # untuk serviceClient

# OpenAI (untuk ekstraksi soal)
OPENAI_API_KEY=...

# Anthropic (BARU — untuk Campus Tools)
# Jika Tools memanggil API langsung dari browser, tidak perlu var ini
# Tapi jika dipindah ke API route:
ANTHROPIC_API_KEY=...
```

---

*Patch dibuat untuk NEXA v1.x — Campus Ecosystem untuk Mahasiswa Indonesia*
