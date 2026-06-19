# Testing Report — Smart Input Engine (Batch 7 Hardening)

Bagian 1 berisi **hasil aktual** dari pengujian otomatis yang sudah dijalankan
(bukan checklist kosong). Bagian 2 adalah checklist manual yang masih perlu
kamu jalankan sendiri karena butuh Supabase/AI provider/Vercel asli (tidak
bisa disimulasikan dari sandbox ini).

---

## 1. Hasil pengujian otomatis (sudah dijalankan, real execution)

Total **97 assertion**, lintas **7 skenario pengujian terpisah**, dijalankan
dengan `tsx` (eksekusi TypeScript langsung, bukan mock/dummy) terhadap kode
produksi yang sama dengan yang dikirim. Semua **PASS** setelah 3 bug ditemukan
& diperbaiki (lihat catatan di bawah tabel).

| # | Skenario | Assertion | Hasil |
|---|---|---|---|
| 1 | `localParseText` — NL parsing: "besok jam 9 quiz kalkulus", "Jumat jam 23.59", "minggu depan", teks ambigu tanpa tanggal, multi-baris forward chat | 30 | ✅ PASS |
| 2 | `normalizeCandidate(s)` — field kosong/invalid, data lengkap valid, tanggal mustahil (31 Feb), array multi-item | 30 | ✅ PASS |
| 3 | `extractTextFromFile` — PDF asli berteks, PDF kosong (simulasi scan), DOCX asli, `.doc` lama, format tak dikenal, end-to-end PDF→parser lokal | 15 | ✅ PASS |
| 4 | `safeParseArray` — respons AI bersih, code-fence markdown, wrapped object (`candidates`/`deadlines`), prose di sekitar JSON, array kosong, JSON rusak total, decoy bracket | 10 | ✅ PASS |
| 5 | `parseDeadlinePayload` (gatekeeper sebelum DB) — kandidat valid, course_name kosong, tanggal null, type invalid, campus/room kosong, format tanggal salah, partial-success 3 kandidat | 14 | ✅ PASS |
| 6 | `withTimeout` — promise cepat menang, promise lambat ditimeout, error asli tetap lolos, tidak ada timer yang nyangkut | 7 | ✅ PASS |
| 7 | `extractFromText`/`extractFromImage` jalur AI aktif (fetch di-mock meniru respons Groq) — sukses bersih, HTTP 401, respons kosong, array kosong, network throw, provider tanpa vision | 21 | ✅ PASS |

### Bug yang ditemukan & diperbaiki selama pengujian ini

1. **[KRITIKAL] `pdf-parse` diganti `pdfjs-dist`.** Diuji dengan PDF asli
   (bukan dummy): `pdf-parse` membundel pdf.js versi 2017 (v1.10.100) dengan
   module-level state. Saat PDF kosong diproses tepat setelah PDF berisi teks,
   hasilnya **mengembalikan teks dari PDF sebelumnya** (bukan error, bukan
   kosong — salah ambil data). Untuk app yang menyimpan tugas mahasiswa, ini
   risiko serius (potensi isi PDF user A "bocor" ke hasil ekstraksi user B di
   Vercel serverless yang warm/reused). Diganti ke `pdfjs-dist` (pdf.js resmi
   Mozilla, aktif di-maintain) — diuji ulang dengan pemanggilan
   berurutan & interleaved berkali-kali, hasilnya selalu benar & konsisten.
2. **[SEDANG] Limit ukuran upload gambar/file diturunkan dari 5MB/8MB → 3MB.**
   Vercel Serverless Functions punya hard limit 4.5MB untuk request body
   (tidak bisa dikonfigurasi naik). Base64 encoding menambah ~33% ukuran —
   limit lama (5MB/8MB) akan **gagal dengan HTTP 413 di production** walau
   lolos semua validasi kode. Sudah diturunkan ke batas yang aman (3MB raw ≈
   4MB base64, masih ada margin di bawah 4.5MB), plus pre-check di sisi client
   supaya user dapat feedback instan tanpa upload dulu.
3. **[KECIL] Kualitas pembersihan `course_name` di parser lokal.** Urutan
   regex yang salah membuat teks seperti `"jam 23.59"` ter-parse sebagian
   (angka "dimakan" duluan oleh regex tanggal d/m/y, menyisakan kata "jam"
   nyangkut). Sudah diperbaiki urutan regex-nya — diverifikasi lewat
   sebelum/sesudah pada teks nyata.
4. **[KECIL] Type error** di `confirm/route.ts` (`'error' in parsed` tidak
   bisa di-narrow TypeScript) — diperbaiki jadi `if (parsed.error)`, konsisten
   dengan pola yang sudah dipakai endpoint `/api/deadlines` asli.

### Validasi build (bukan cuma typecheck)

- **`tsc --noEmit` strict, full project** (seluruh source asli + overlay
  Batch 7): **0 error.**
- **`next build` produksi sungguhan** (Next.js 14.2.35, dengan seluruh route
  asli + route Smart Input baru): **sukses penuh, 73/73 halaman tergenerate,
  0 error.** ini mengonfirmasi `pdfjs-dist`, `mammoth`, dan `web-push`
  (Batch 6) semua ter-bundle webpack dengan aman — tidak ada masalah resolusi
  modul/native binding yang baru muncul saat bundling production.
  `/dashboard` naik ke 30.2 kB (mengonfirmasi `SmartInputBox` benar-benar
  ter-include, bukan cuma referensi mati).
  - Satu warning pra-eksisting (bukan dari Batch 7): `@supabase/supabase-js`
    memakai `process.version` yang disebut "tidak didukung di Edge Runtime" —
    ini dari `@supabase/ssr` yang sudah dipakai di codebase asli, tidak
    terkait perubahan Smart Input, dan tidak memengaruhi route Node.js biasa.

---

## 2. Checklist manual — masih perlu kamu jalankan sendiri

Bagian ini butuh Supabase project asli, AI provider asli (Groq/dst), dan
deploy Vercel asli — tidak bisa disimulasikan dari sandbox saya.

### Persiapan
- [ ] Jalankan `docs/MIGRATION_smart_input_logs.sql` di Supabase.
- [ ] `npm i pdfjs-dist mammoth` (BUKAN `pdf-parse` — lihat catatan di atas).
- [ ] Set ENV AI (`AI_PROVIDER`+`AI_API_KEY`) kalau belum ada.
- [ ] Deploy ke preview Vercel.

### Integrasi dashboard (sudah saya pasang langsung, tinggal verifikasi)
- [ ] Buka `/dashboard` → `SmartInputBox` muncul tepat di bawah header
      hero, sebelum widget lain.
- [ ] Login sebagai user **Radar** → tab Manual aktif, 3 tab lain
      terkunci dengan CTA upgrade.
- [ ] Login sebagai user **Pulse/Command** → semua 4 tab aktif.
- [ ] `defaultCampus` di form Manual terisi otomatis dari `campus_name` profil
      (bukan placeholder kosong).

### Manual → Preview → Confirm → Save
- [ ] Isi & submit → muncul deadline baru di daftar, tanpa reload manual
      (pakai `router.refresh()`).
- [ ] Cek baris baru di `smart_input_logs` (`input_type='manual'`,
      `status='confirmed'`).

### NLP → Preview → Confirm → Save
- [ ] Test kalimat dari brief asli: "besok jam 9 ada quiz kalkulus",
      "deadline laporan AI hari Jumat jam 23.59", "minggu depan presentasi
      PKN" — bandingkan hasil AI (kalau aktif) vs yang sudah saya verifikasi
      di parser lokal (lihat tabel di atas).
- [ ] Matikan `AI_API_KEY` sementara → kalimat yang sama tetap menghasilkan
      kandidat (fallback lokal sudah diverifikasi otomatis bekerja).
- [ ] Teks tanpa tanggal sama sekali → field tanggal di preview ditandai
      kuning, tombol Simpan menolak sampai diisi.

### Upload Gambar → Preview → Confirm → Save
- [ ] Screenshot tugas asli dari WA/VClass/Classroom → preview sesuai isi.
- [ ] Upload > 3MB → ditolak instan di sisi client (tanpa upload dulu).
- [ ] Test dengan provider AI yang tidak support vision (mis. Cerebras) →
      pesan jelas mengarahkan ke tab lain (sudah diverifikasi via mock,
      tinggal dikonfirmasi dengan provider asli).

### Upload File → Preview → Confirm → Save
- [ ] PDF asli (yang ada teksnya, bukan scan) → ekstraksi sukses, lanjut ke
      AI/fallback parsing (sudah diverifikasi end-to-end dengan PDF
      buatan; tinggal dicoba dengan PDF tugas asli kampusmu).
- [ ] PDF hasil scan/foto (tanpa teks) → pesan ramah mengarahkan ke tab
      Upload Gambar (sudah diverifikasi).
- [ ] DOCX asli → sukses (sudah diverifikasi dengan file buatan).

### Regresi — fitur lama
- [ ] Form tambah deadline lama (`/dashboard/deadlines/new`) tetap normal.
- [ ] AI Quick Add lama tetap normal.
- [ ] QuickDeadlineBar (Batch 3) tetap normal.
- [ ] Reminder Telegram & Web Push (Batch 6) tetap terkirim seperti biasa.
- [ ] Plan gating di halaman lain (Arena, NEXA Assistant) tidak ikut berubah.
- [ ] Poin leaderboard (`award_points`) tetap bertambah saat deadline baru
      dibuat lewat Smart Input — saya cek kodenya konsisten dengan
      `/api/deadlines` asli, tapi nilai akhirnya perlu dicek di DB asli.

### Mobile
- [ ] SmartInputBox tidak overflow di layar 360px.
- [ ] Tab bisa di-scroll horizontal.
- [ ] Upload gambar/file dari kamera HP (bukan cuma galeri) berfungsi.

---

## 3. Limitasi yang diketahui (jujur, bukan disembunyikan)

1. **Ukuran upload dibatasi 3MB** (gambar & file) — ini batas keras dari
   platform Vercel (4.5MB request body), bukan pilihan sembarangan. Kalau
   nanti perlu file lebih besar, solusinya adalah upload langsung ke Supabase
   Storage dari client (signed URL) lalu API hanya menerima path-nya — bukan
   kirim base64 lewat body JSON. Ini perubahan arsitektur yang lebih besar,
   belum dikerjakan di batch ini.
2. **Parser lokal (fallback non-AI) kualitasnya lebih rendah dari AI** untuk
   teks panjang/dokumen satu paragraf tanpa baris baru (PDF tanpa newline
   eksplisit jadi 1 "kalimat" panjang, course_name bisa kurang rapi). Field
   krusial (tanggal/jam/jenis) tetap terbaca benar; user tetap review &
   edit di preview sebelum simpan.
3. **Parser lokal belum membersihkan semua stopword** Indonesia (mis. "ada"
   bisa nyangkut di course_name). Kosmetik, tidak memengaruhi data inti.
4. **`next.config.js`/`tailwind.config.js` asli project tidak ikut diuji**
   karena tidak ada di file yang diupload — validasi `next build` di atas
   pakai config minimal pengganti (PWA dinonaktifkan, palet warna stub).
   Risiko: kalau config asli punya aturan webpack/eslint khusus yang
   konflik dengan `pdfjs-dist`/`mammoth`, itu tidak akan terdeteksi di sini.
   Sangat kecil kemungkinannya (sudah halaman lain dengan dependency besar
   seperti `web-push` ter-bundle normal), tapi tetap disebutkan untuk jujur.
5. **Vision AI & ekstraksi PDF/DOCX belum dites dengan API key & file ASLI**
   dari provider Groq/OpenRouter/Gemini sungguhan — yang sudah diverifikasi
   adalah: (a) seluruh logic di sekitarnya benar lewat mock yang meniru
   bentuk respons asli provider, dan (b) ekstraksi PDF/DOCX dengan file nyata
   (bukan dummy). Tetap sarankan tes 1-2 kali dengan kunci API asli sebelum
   anggap production-ready.
