# NEXA Campus — PDF Fix: pdfjs-dist → unpdf

## Error yang dilaporkan
"Gagal membaca file PDF ini. Pastikan file tidak corrupt/terkunci."

## Root cause (terverifikasi dari riset + dokumentasi resmi unpdf)
`pdfjs-dist` (library PDF yang dipakai sejak Batch 7) bergantung pada modul
`canvas` untuk environment Node.js. Modul `canvas` **tidak bekerja di dalam
worker threads** — dan inilah persis bagaimana Vercel serverless functions
dijalankan. Bahkan build `legacy/build/pdf.mjs` yang didesain untuk Node tetap
punya dependency ini. Di sandbox testing gue (Node.js biasa, bukan worker
thread), pdfjs-dist bekerja normal — itu sebabnya bug ini tidak ketangkap di
sandbox, tapi langsung error di production.

## Fix
Ganti `pdfjs-dist` → `unpdf`. `unpdf` ships with a **serverless build** of
PDF.js yang mock modul `canvas` — didesain eksplisit untuk Cloudflare Workers,
Vercel Edge, dan Vercel Serverless Functions. Zero konfigurasi tambahan untuk
deployment Vercel standar.

## File yang diubah
| File | Perubahan |
|---|---|
| `src/lib/smart-input/file-extract.ts` | Ganti `pdfjs-dist` → `unpdf`. API jauh lebih simpel: `getDocumentProxy(buffer)` + `extractText(pdf, { mergePages: true })`. Semua behavior lain (DOCX via mammoth, error messages, MAX_EXTRACTED_CHARS) tidak berubah. |

## Dependency
Tambah ke `package.json`: `npm install unpdf`

## Validasi
- **11 test assertion** pakai file PDF asli (bukan mock):
  - PDF berteks → ekstrak berhasil dengan teks yang benar
  - PDF kosong/scan → error ramah (bukan crash)
  - Interleaved: PDF A → PDF kosong → PDF A lagi → hasilnya identik, zero cross-contamination
  - DOCX → tetap bekerja (tidak ada perubahan ke jalur DOCX)
  - Format tidak didukung → error yang jelas
- `tsc --noEmit` standar: 0 error
- `tsc --noEmit` dengan `target: ES5` (strict probe): 0 error
- `next build` dengan ESLint aktif: 0 error, 0 warning baru
- 138 test assertion total (11 baru + 127 dari sesi sebelumnya) re-run: semua lulus

## Cara pasang
1. `npm install unpdf` di repo
2. Timpa `src/lib/smart-input/file-extract.ts`
3. Deploy — PDF seharusnya langsung bekerja di production

pdfjs-dist bisa dihapus dari package.json kalau sudah tidak dipakai di tempat lain.
