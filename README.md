# NEXA Campus — Batch 16: Quick Add & Smart Input Lebih Pintar

NLP, upload file, dan upload gambar sekarang menangkap **ruangan/lokasi** dan **judul tugas**
dengan lebih baik — sebelumnya field ini ada di skema tapi nyaris tidak pernah benar-benar
terisi dari teks/gambar. Plus 2 bug nyata ketemu & dibenerin di proses.

## Masalah yang diperbaiki
1. **Ruangan TIDAK PERNAH diekstrak dari teks/gambar** — field `room` cuma diisi binary
   "Online"/"Menyusul" dari deteksi kata "online/zoom/dll", walau user sebut ruangan eksplisit
   ("ruang B204", "lab komputer 2"). Berlaku di **3 jalur sekaligus**: prompt AI (NLP+File+Image),
   parser lokal fallback, DAN route Quick Add 1-baris (`quick-nl`) yang punya logic terpisah sendiri.
2. **Judul tugas (`title`) nyaris selalu null** dari parser lokal — sekarang ada pola deteksi
   konservatif ("judul: ...", teks dalam kutip) + prompt AI diperjelas instruksinya.

## Bug ditemukan & diperbaiki (di luar scope awal, tapi ketemu pas testing)
3. **[Pre-existing] "jam 2 siang" salah ke-parse jadi 02:00**, bukan 14:00 — kata "siang" tidak
   pernah masuk kondisi tambah-12-jam (cuma "sore"/"malam"). Ada di **2 tempat terpisah**
   (`local-parser.ts` dan `quick-nl/route.ts`, masing-masing salah dengan caranya sendiri — yang
   di quick-nl bahkan eksplisit `h += 0`, no-op). Sekalian ditambah kasus "jam 12 malam" → 00:00
   (tengah malam, sebelumnya tetap di 12).

## File yang diubah
| File | Perubahan |
|---|---|
| `src/lib/smart-input/location-extract.ts` **(BARU)** | Regex ekstraksi ruangan/platform, konservatif (return null kalau tidak yakin) |
| `src/lib/smart-input/types.ts` | + field `location` di `RawCandidate` |
| `src/lib/smart-input/normalize.ts` | Lokasi eksplisit dari teks **diutamakan** dari fallback online/offline binary |
| `src/lib/smart-input/local-parser.ts` | + ekstraksi lokasi & judul, + pembersihan ruangan dari `course_name` (tidak dobel), **fix bug waktu siang** |
| `src/lib/smart-input/extract.ts` | Prompt AI (teks & gambar) diperluas minta field `location` eksplisit + instruksi title vs course_name diperjelas |
| `src/app/api/deadlines/quick-nl/route.ts` | Sama seperti local-parser (parser terpisah, fix terpisah) + prompt AI-nya juga diperluas, **fix bug waktu siang** |

## Kenapa desainnya konservatif
`extractLocation()` & ekstraksi judul SENGAJA return `null` kalau pola tidak jelas — lebih baik
tidak mengisi daripada salah mengisi dengan teks yang dipotong asal. Prompt AI juga eksplisit
bilang "JANGAN MENEBAK" untuk location, sama seperti aturan yang sudah ada untuk tanggal.

## Validasi
- **49 test assertion baru** di batch ini (17 untuk `extractLocation` standalone, 16 untuk
  pipeline `local-parser` end-to-end termasuk regresi dari Batch 7, 8 untuk semua kombinasi
  jam Indonesia, 4 untuk jalur AI dengan mock fetch) — semua lulus.
- **Total 127 test assertion** dari seluruh sesi (termasuk batch-batch sebelumnya) di-re-run
  ulang sebagai pengecekan regresi penuh — semua tetap lulus.
- `tsc --noEmit` standar: 0 error.
- `tsc --noEmit` dengan **target ES5 tanpa downlevelIteration** (skenario paling ketat, sesuai
  pelajaran dari 2 build error sebelumnya): 0 error.
- `next build` dengan ESLint aktif: 0 error, 0 warning baru.

## Cara pasang
Timpa 6 file di atas. Tidak ada migration, tidak ada dependency baru, tidak ada ENV baru.

Test cepat setelah pasang:
- Smart Input (NLP) atau Quick Add: ketik "tugas kalkulus dikumpulkan di ruang B204 jumat jam 2
  siang" → cek ruangan jadi "Ruang B204" (bukan "Menyusul") dan jam jadi 14:00 (bukan 02:00).
- Upload screenshot jadwal kelas yang ada nomor ruangan tertulis jelas → cek ruangan ikut terbaca
  di hasil ekstraksi (butuh AI vision aktif).
