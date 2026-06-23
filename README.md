# Batch 23 — Fitur Belajar: Feynman, Diagnose, Plan Timer, Checklist

Melanjutkan batch 22 (Quick Add transparency). Batch ini mengimplementasikan
4 fitur utama di area **Belajar** yang sebelumnya belum ada.

---

## ⚠️ Wajib: Jalankan migration sebelum deploy

```sql
-- Salin isi docs/MIGRATION_study_v2.sql ke Supabase SQL Editor → Run
```

Migration menambahkan:
- Tabel baru `study_feynman_sessions`
- 4 kolom baru di `study_packs`: `checklist`, `active_plan`, `plan_progress`, `quiz_last_wrong`

**Rollback** tersedia di bagian bawah file migration.

---

## 4 Fitur Baru

### 1. Mode Feynman (`FeynmanBox.tsx`)

User memilih konsep dari roadmap (atau ketik bebas), lalu menjelaskannya
dengan kata-kata sendiri. AI mengevaluasi dan mengembalikan:

| Field    | Isi |
|----------|-----|
| `score`  | 0–100 (comprehension score) |
| `right`  | Hal yang sudah dipahami benar |
| `gaps`   | Poin penting yang terlewat |
| `wrong`  | Miskonsepsi / pernyataan salah |
| `tip`    | Satu saran spesifik berikutnya |

Setiap sesi disimpan ke `study_feynman_sessions`. User bisa lihat riwayat
evaluasi per pack. Score ring visual berubah warna: hijau ≥75, kuning ≥50, merah <50.

**Plan gate**: Command only.

**Rate limit**: 15 request/jam.

### 2. Diagnose Weakness (`WeaknessReport.tsx`)

Menganalisis semua study pack user secara deterministik berdasarkan:

| Kondisi | Label |
|---------|-------|
| Belum pernah kuis | `no_attempts` |
| Skor terbaik < 60% dari total soal | `low_score` |
| Skor belum 100% & tidak disentuh >14 hari | `stale` |

Hasil ditampilkan: kartu per topik lemah (dengan progress bar + nomor soal salah terakhir),
summary tiga angka (total / perlu diulang / dikuasai), serta saran AI personal (Command only).

**Plan gate**: Radar tidak bisa akses. Pulse & Command bisa. AI advice hanya Command.

### 3. Study Plan Bertimer (`StudyPlanWithTimer.tsx`)

AI membuat rencana 4–6 langkah belajar (50–120 menit total) berdasarkan
topik + ringkasan materi. Setiap langkah memiliki:
- Ikon tipe (`read`, `practice`, `quiz`, `review`, dll.)
- Countdown timer yang bisa di-start / pause / reset
- Tombol "Tandai Selesai" → progress disimpan ke DB
- Auto-advance ke langkah berikutnya setelah satu selesai

Progress bar di atas menunjukkan X/N langkah selesai.
"Buat ulang rencana" → generate baru + reset progress.

**Plan gate**: Radar tidak bisa akses.

**Rate limit generate**: 5 request/jam.

### 4. Checklist Belajar (`StudyChecklist.tsx`)

Checklist per study pack. Auto-generate dari roadmap saat pertama dibuka
(tiap roadmap step → "Kuasai: [judul]" + satu item quiz di akhir).

User bisa:
- Centang / uncentang item (disimpan debounce 800ms)
- Hapus item (hover → ikon trash muncul)
- Tambah item baru (input + Enter / tombol +)

Tidak butuh AI. Semua item disimpan di kolom `checklist` (JSONB) di `study_packs`.

---

## File Baru

### Lib (`src/lib/study/`)
| File | Deskripsi |
|------|-----------|
| `types.ts` | Semua shared types untuk fitur Belajar |
| `feynman.ts` | AI evaluation + safe-parse feedback |
| `diagnose.ts` | Rule-based weakness analysis + optional AI advice |
| `plan.ts` | AI study plan generation + checklist from roadmap |

### API Routes
| Route | Method | Deskripsi |
|-------|--------|-----------|
| `/api/study/feynman` | GET | Riwayat sesi Feynman (opsional filter `?pack_id=`) |
| `/api/study/feynman` | POST | Submit penjelasan → evaluasi AI → simpan sesi |
| `/api/study/diagnose` | GET | Analisis semua pack → weak/strong areas + AI advice |
| `/api/study/packs/[id]/plan` | GET | Ambil plan aktif + progress |
| `/api/study/packs/[id]/plan` | POST | Generate plan baru (AI) |
| `/api/study/packs/[id]/plan` | PATCH | Update completed step IDs |
| `/api/study/packs/[id]/checklist` | GET | Ambil checklist (auto-generate dari roadmap kalau kosong) |
| `/api/study/packs/[id]/checklist` | PATCH | Simpan seluruh array checklist |
| `/api/study/packs/[id]/wrong-questions` | POST | Simpan indeks soal salah terakhir |

### Components (`src/components/study/`)
| Component | Deskripsi |
|-----------|-----------|
| `FeynmanBox.tsx` | UI lengkap mode Feynman (picker, textarea, score ring, history) |
| `WeaknessReport.tsx` | Dashboard analisis kelemahan + saran AI |
| `StudyPlanWithTimer.tsx` | Step-by-step plan dengan countdown timer per langkah |
| `StudyChecklist.tsx` | Checklist bisa toggle/add/delete dengan autosave |

### Tests (`src/__tests__/study/`)
| File | Assertions |
|------|-----------|
| `diagnose.test.ts` | 14 assertions |
| `plan.test.ts` | 18 assertions |
| `feynman-parse.test.ts` | 13 assertions |
| `plan-steps.test.ts` | 12 assertions |

**Total batch 23: 57 assertions baru** (semuanya verified ✅ via inline smoke test).

---

## Cara Pasang di Halaman Study

```tsx
// Contoh penggunaan di /dashboard/study/[id]/page.tsx (tab baru)
import { FeynmanBox }          from '@/components/study/FeynmanBox'
import { StudyPlanWithTimer }  from '@/components/study/StudyPlanWithTimer'
import { StudyChecklist }      from '@/components/study/StudyChecklist'

// Di halaman dashboard (top-level)
import { WeaknessReport }      from '@/components/study/WeaknessReport'

// Per-pack tabs:
<FeynmanBox packId={id} topic={pack.topic} roadmapTopics={roadmapTitles} />
<StudyPlanWithTimer packId={id} topic={pack.topic} />
<StudyChecklist packId={id} />

// Di dashboard study overview:
<WeaknessReport onStudyPack={(id) => router.push(`/dashboard/study/${id}`)} />
```

---

## Catatan Implementasi

- **Score -1** dari Feynman = AI tidak aktif di server. Disimpan sebagai 0 di DB.
- **Checklist GET** tidak auto-save; default items baru tersimpan saat pertama kali user toggle/add.
- **Plan PATCH** hanya menerima step IDs yang benar-benar ada di plan aktif (cross-check).
- **wrong-questions POST** cross-check indeks tidak melebihi panjang quiz array.
- Semua komponen client menggunakan debounce / request dedupe sehingga tidak spam API.
