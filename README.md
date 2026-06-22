# NEXA Campus — Batch 17: Study v2 + NLP Smarter + Recurring Schedules

## Validasi
- **14 test assertion baru** (recurring detection end-to-end)
- **152 test assertion total** (seluruh sesi) re-run: semua lulus
- `tsc --noEmit` standar: 0 error
- `tsc --noEmit` target ES5 (strict): 0 error
- `next build` ESLint aktif: 0 error, 0 warning baru

## 1) Study v2 — 3 Fitur Baru

### Flashcard + Leitner 3-Box
- **Generate on demand** dari materi yang sudah ada (tombol di tab Flashcard)
- **Flip animation** via CSS 3D — tidak perlu library baru
- **Leitner system**: tiap kartu punya box 1/2/3 (Belum / Agak / Sudah tahu)
- **Progress tersimpan** ke DB (debounced 2 detik, otomatis sync)
- **Sesi cerdas**: prioritaskan box 1 → 2 → 3 setiap sesi

### Concept Deep-Dive (per Roadmap Step)
- Tombol "Pelajari lebih dalam" di tiap langkah roadmap
- AI menjelaskan konsep secara mendalam: definisi lengkap, kenapa penting, contoh nyata, hal yang sering bikin bingung
- Response di-cache di state — tidak re-call AI kalau di-toggle lagi

### Latihan Soal On-Demand
- Tab baru "Latihan" — generate 5 soal baru yang **berbeda** dari quiz awal
- Tidak tersimpan ke DB (fresh tiap klik "Generate Soal Baru")
- AI-aware soal yang sudah ada (tidak mengulang pertanyaan yang sama)

### Navigasi Tab Baru
`Roadmap | Rangkuman | Flashcard | Quiz | Latihan` — semua fitur study pack dalam satu halaman

## 2) NLP / File / Image Lebih Pintar
Semua deteksi bekerja di **3 jalur**: local-parser (fallback), AI prompt text, AI prompt image

### Deteksi baru
- **Nama dosen** dari forward chat ("Pak Budi: kerjakan tugas…" → `notes: "Dari Pak Budi"`)
- **Judul tugas via format "Tugas 3 – Nama Judul"** (selain pola "judul:" dan kutip yang sudah ada)
- **Recurring schedule** — lihat bagian 3

### File yang diubah
`local-parser.ts`, `extract.ts` (AI prompt), `normalize.ts`, `types.ts` (SmartInputCandidate)

## 3) Jadwal Berulang (Recurring Schedules)
Deteksi dari teks → simpan ke DB → generate 8 instance ke depan → badge di dashboard

### NLP Detection
| Teks | Hasil |
|---|---|
| "jadwal kalkulus setiap senin jam 09:00" | is_recurring=true, day=1 (Senin) |
| "kuliah tiap kamis jam 2 siang di ruang B204" | is_recurring=true, day=4 (Kamis), room="Ruang B204" |
| "jadwal mingguan matematika" | is_recurring=true, day=null |
| "tugas kalkulus deadline jumat" | is_recurring=false |

### Cara Kerja
1. NLP atau AI mendeteksi pola berulang → `is_recurring=true`, `recurrence_day_of_week=N`
2. API POST `/api/deadlines` insert parent → generate 8 instance (tanggal maju 1 minggu tiap kali)
3. Instance punya `recurrence_parent_id` → hapus parent = cascade hapus semua instance
4. Quick-add via `/api/deadlines/quick-nl` juga support (auto-detect dari teks, generate instances)

### UI
- Badge biru `RecurringBadge` ("Tiap Sen", "Tiap Kam", dll) muncul di kartu deadline di dashboard

## File yang diubah/baru
| File | Perubahan |
|---|---|
| `docs/MIGRATION_study_v2_recurring.sql` | Kolom `flashcards`, `flashcard_boxes` di study_packs + kolom `is_recurring`, `recurrence_day_of_week`, `recurrence_parent_id` di academic_deadlines |
| `src/lib/study/types.ts` | + `Flashcard`, `FlashcardBoxes` types |
| `src/lib/study/generate-flashcards.ts` | BARU: generate flashcard + practice problems via LLM |
| `src/app/api/study/packs/[id]/flashcards/route.ts` | BARU: generate, get, patch (Leitner progress) |
| `src/app/api/study/packs/[id]/explain/route.ts` | BARU: concept deep-dive per roadmap step |
| `src/app/api/study/packs/[id]/practice/route.ts` | BARU: generate soal latihan baru |
| `src/components/study/FlashcardView.tsx` | BARU: flip card + Leitner UI |
| `src/components/study/ConceptExplainer.tsx` | BARU: inline AI explanation per step |
| `src/components/study/PracticeView.tsx` | BARU: on-demand quiz session |
| `src/components/study/StudyRoadmapView.tsx` | + `packId` prop + ConceptExplainer per step |
| `src/components/study/StudyTabsClient.tsx` | BARU: tab navigation (Roadmap/Rangkuman/Flashcard/Quiz/Latihan) |
| `src/app/dashboard/study/[id]/page.tsx` | Pakai StudyTabsClient, import fitur baru |
| `src/lib/smart-input/types.ts` | + `is_recurring`, `recurrence_day_of_week` di RawCandidate + SmartInputCandidate |
| `src/lib/smart-input/local-parser.ts` | + `detectRecurring()`, `extractLecturerNote()`, extended title extraction |
| `src/lib/smart-input/normalize.ts` | Pass recurring fields through |
| `src/lib/smart-input/extract.ts` | AI prompt diperluas: recurring + dosen + improved title/location |
| `src/lib/deadline-validation.ts` | + `is_recurring`, `recurrence_day_of_week` di DeadlinePayload |
| `src/types/index.ts` | + recurring fields di AcademicDeadline |
| `src/app/api/deadlines/route.ts` | Generate 8 recurring instances setelah create parent |
| `src/app/api/deadlines/quick-nl/route.ts` | Detect recurring, generate instances, notice informatif |
| `src/components/deadlines/RecurringBadge.tsx` | BARU: badge ikon + label hari |
| `src/components/dashboard/DeadlineDashboardOverview.tsx` | Render RecurringBadge di deadline card |

## Cara Pasang
1. Jalankan `docs/MIGRATION_study_v2_recurring.sql`
2. Timpa 21 file di atas
3. `npm run build` → sudah divalidasi hijau
4. Test:
   - Quick Add: ketik "jadwal kalkulus setiap senin jam 09:00 ruang B204" → cek 8 instance terbuat, badge "Tiap Sen" muncul di dashboard
   - Study: buka materi → tab Flashcard → Generate → flip kartu → rate dengan Belum/Agak/Sudah
   - Study: klik "Pelajari lebih dalam" di salah satu roadmap step
   - Study: buka tab Latihan → Generate Soal Baru
