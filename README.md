# NEXA Campus — Batch 15: NEXA Assistant Bantu Belajar dari Materi

## 🔴 HOTFIX duluan (dari build error sebelumnya)
`src/lib/ml/late-risk-model.ts` di sini sudah **diperbaiki** — error
`Map<...> can only be iterated through when using the '--downlevelIteration' flag`
itu karena `tsconfig.json` project kamu pakai `target` di bawah ES2015 tanpa
`downlevelIteration`. Diganti dari `for (const [k,v] of map)` jadi
`map.forEach((v, k) => {...})` — kerja sama persis, tapi tidak butuh syarat
target ES2015+. **Sudah divalidasi ekstra ketat:** kali ini saya jalankan
`tsc` dengan `target: ES5` + TANPA `downlevelIteration` (skenario paling
ketat yang mungkin) ke **seluruh kode**, bukan cuma file yang error — 0 error.
Juga di-grep manual semua pola `for...of` di kode yang saya tulis sepanjang
sesi ini untuk pastikan tidak ada pola sama yang kelewat (semua sisanya
ternyata iterasi di atas Array biasa, yang aman di target manapun).

## Fitur baru: Belajar dari Materi
User upload file (PDF/DOCX) atau tempel teks (transkrip ucapan dosen,
catatan, dll) → NEXA Assistant susun **roadmap belajar**, **rangkuman**, dan
**quiz interaktif** — murni LLM (beda dari batch ML sebelumnya yang murni
statistik), reuse ekstraksi file dari Smart Input (Batch 7), reuse layer AI
multi-provider dari Batch 1.

## File baru
| File | Fungsi |
|---|---|
| `docs/MIGRATION_study_packs.sql` | Tabel `study_packs` (roadmap/summary/quiz tersimpan per user) |
| `src/lib/study/types.ts` | Tipe `StudyRoadmapStep`, `StudyQuizQuestion`, `StudyPack` |
| `src/lib/study/generate-study-pack.ts` | Prompt LLM + parsing JSON robust + validasi (soal dengan format rusak dibuang, bukan bikin crash) |
| `src/app/api/study/generate/route.ts` | `POST` — terima file/teks → ekstrak (reuse Smart Input) → generate → simpan |
| `src/app/api/study/packs/route.ts` | `GET` — daftar materi tersimpan |
| `src/app/api/study/packs/[id]/route.ts` | `GET`/`DELETE` — detail & hapus |
| `src/app/api/study/packs/[id]/score/route.ts` | `POST` — catat skor quiz (divalidasi terhadap jumlah soal asli, tidak bisa dipalsukan dari client) |
| `src/components/study/StudyUploadForm.tsx` | Form upload/tempel teks |
| `src/components/study/StudyRoadmapView.tsx` | Checklist roadmap (progress visual lokal) |
| `src/components/study/SimpleMarkdown.tsx` | Renderer ringan `**bold**` + paragraf (tanpa dependency baru) |
| `src/components/study/StudyQuizView.tsx` | Quiz interaktif — pilih jawaban, submit, lihat penjelasan, skor tersimpan |
| `src/app/dashboard/study/page.tsx` | Daftar materi (Command-gated) |
| `src/app/dashboard/study/new/page.tsx` | Halaman buat materi baru |
| `src/app/dashboard/study/[id]/page.tsx` | Halaman detail (roadmap + rangkuman + quiz) |
| `src/app/dashboard/nexa-assistant/page.tsx` | + link ke fitur ini |

## Desain penting
- **Tidak ada fallback non-AI** (beda dari Smart Input NL parser) — menyusun roadmap & quiz
  butuh pemahaman bahasa asli, bukan sesuatu yang bisa didekati regex. Kalau AI tidak aktif,
  pesan errornya jujur bilang begitu.
- Soal quiz yang formatnya rusak dari AI (opsi bukan 4, `correctIndex` di luar 0-3) **dibuang
  satu-satu**, bukan bikin seluruh hasil gagal — minimal 3 soal valid baru dianggap berhasil.
- Skor quiz divalidasi server-side terhadap panjang quiz asli (anti-curang skor ngarang dari client).
- Rate limit 10/jam (pola sama dengan Batch 9) — generate materi itu panggilan AI yang berat.
- Gated NEXA Command, konsisten dengan fitur AI lain.

## Validasi
- **14 test assertion** untuk `generate-study-pack.ts` (mock AI, termasuk: respons dibungkus
  markdown code fence, soal dengan format rusak dibuang otomatis, materi kependekan ditolak,
  network gagal tidak crash).
- `tsc --noEmit` standar: 0 error.
- `tsc --noEmit` dengan **target ES5 tanpa downlevelIteration** (skenario paling ketat): 0 error.
- `next build` dengan ESLint aktif: 0 error, 0 warning baru dari file manapun di batch ini.
- Semua 82 test assertion dari batch-batch sebelumnya (trust score, file signature, regresi
  logistik, bandit, risk model) di-re-run ulang, semua tetap lulus — tidak ada regresi.

## Cara pasang
1. Jalankan `docs/MIGRATION_study_packs.sql`.
2. Timpa semua file di atas (termasuk `late-risk-model.ts` yang sudah di-hotfix).
3. `npm run build` — sudah divalidasi hijau dengan kondisi paling ketat.
4. Test: buka NEXA Assistant → klik "Belajar dari Materi" → tempel beberapa paragraf catatan
   kuliah → tunggu 10-30 detik → cek roadmap/rangkuman/quiz tersusun masuk akal dari materi yang
   ditempel → coba kerjain quiz → submit → cek skor tersimpan saat dibuka lagi nanti.
