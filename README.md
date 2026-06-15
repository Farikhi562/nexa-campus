# NEXA Campus — Batch 7: Smart Input Engine (NEXA Brain Input)

Satu pintu masuk untuk semua cara nambah tugas/deadline: **Manual, Bahasa Natural, Upload Gambar,
Upload File** — semua lewat flow yang sama: **input → ekstraksi → preview (bisa diedit) → konfirmasi → simpan**.

Tidak ada yang langsung `INSERT` ke DB tanpa preview. Semua **additive** — tidak menyentuh
reminder, push notification, Telegram, atau pricing plan yang sudah ada.

## 📁 File baru

| File | Fungsi |
|---|---|
| `docs/MIGRATION_smart_input_logs.sql` | Tabel `smart_input_logs` (audit semua input + hasil parsing), RLS per-user. |
| `src/lib/smart-input/types.ts` | Tipe `SmartInputCandidate`, `RawCandidate`, `ExtractResult`. |
| `src/lib/smart-input/normalize.ts` | Normalisasi hasil mentah → kandidat siap-preview, deteksi field yang "perlu dicek". |
| `src/lib/smart-input/local-parser.ts` | Parser lokal tanpa AI (fallback) — dukung multi-baris. |
| `src/lib/smart-input/extract.ts` | Layer ekstraksi AI (teks & gambar) di atas `lib/ai/llm.ts`, auto-fallback ke parser lokal. |
| `src/lib/smart-input/file-extract.ts` | Ekstrak teks dari PDF (`pdf-parse`) & DOCX (`mammoth`). |
| `src/app/api/ai/parse-text/route.ts` | `POST` — parse teks bebas → kandidat (tab Bahasa Natural). |
| `src/app/api/ai/parse-image/route.ts` | `POST` — parse gambar (vision AI) → kandidat (tab Upload Gambar). |
| `src/app/api/ai/parse-file/route.ts` | `POST` — parse PDF/DOCX (atau gambar) → kandidat (tab Upload File). |
| `src/app/api/smart-input/confirm/route.ts` | `POST` — validasi + simpan kandidat terkonfirmasi ke `academic_deadlines`. Dipakai SEMUA mode. |
| `src/components/smart-input/SmartInputBox.tsx` | Komponen utama — 4 tab mode input. |
| `src/components/smart-input/SmartInputPreview.tsx` | Preview/edit kandidat sebelum simpan. |
| `src/components/smart-input/SmartManualForm.tsx` | Form manual ringkas (tab "Ketik Manual"). |
| `.env.smart-input.example` | Catatan ENV (reuse AI dari Batch 1) + dependency baru. |
| `docs/TESTING_CHECKLIST_smart_input.md` | Checklist QA manual lengkap. |

## 📦 Dependency baru
```bash
npm i pdf-parse mammoth
```
- `pdf-parse` → ekstrak teks dari PDF (tab Upload File)
- `mammoth` → ekstrak teks dari `.docx` (tab Upload File)
- `.doc` lama belum didukung (pesan error mengarahkan convert ke `.docx`/PDF)

## 🗄️ Database
1. Jalankan `docs/MIGRATION_smart_input_logs.sql` di Supabase.
2. **Tidak ada tabel lain yang diubah** — semua tetap insert ke `academic_deadlines` lewat
   `parseDeadlinePayload` yang sama dengan endpoint `/api/deadlines` biasa, jadi konsisten dengan
   validasi & RLS yang sudah ada.

## 🔑 ENV
Reuse penuh dari Batch 1 (`AI_PROVIDER` + `AI_API_KEY` / key spesifik provider). Lihat
`.env.smart-input.example` — kalau AI sudah aktif di project-mu, **tidak perlu ENV baru sama sekali**.

## 🔒 Plan gating
- **Manual** → semua plan termasuk Radar (gratis, tanpa AI).
- **Bahasa Natural / Upload Gambar / Upload File** → AI-powered, di-gate ke **Pulse/Command**
  (sama seperti AI Quick Add yang sudah ada). Radar melihat CTA upgrade, tapi tab Manual tetap full akses.
- `/api/smart-input/confirm` **tidak** di-gate — karena dipakai juga oleh tab Manual.

## 🧩 Cara pasang UI
Tambahkan di halaman dashboard (server component), contoh `app/dashboard/page.tsx`:

```tsx
import SmartInputBox from '@/components/smart-input/SmartInputBox'
import { getEffectivePlan } from '@/lib/plans'

// di dalam komponen server, setelah ambil `profile`:
const plan = getEffectivePlan({ ...profile, email: user.email })

// render di bagian atas dashboard:
<SmartInputBox plan={plan} defaultCampus={profile?.campus_name || 'Kampus'} />
```

> Tidak mengganti/menghapus `AIQuickAddDeadline` atau `QuickDeadlineBar` yang sudah ada dari batch
> sebelumnya — keduanya tetap berfungsi normal. SmartInputBox adalah pintu masuk baru yang lebih
> lengkap; kalau nanti mau, `AIQuickAddDeadline`/`QuickDeadlineBar` bisa dipensiunkan secara terpisah.

## 🧠 Cara kerja ringkas
1. **Manual** → form ringkas → langsung `confirm` (tanpa AI, tanpa preview tambahan karena user
   sendiri yang mengisi → sudah "terverifikasi").
2. **Bahasa Natural** → `/api/ai/parse-text` → AI (kalau aktif) ekstrak **array kandidat** (bisa >1
   kalau user paste banyak baris) → kalau AI mati/gagal/kosong → fallback parser lokal
   (`local-parser.ts`, regex tanggal/jam/jenis Bahasa Indonesia) → kandidat dinormalisasi → **preview**.
3. **Upload Gambar** → `/api/ai/parse-image` → vision AI → kandidat → **preview**. Tidak ada
   fallback non-AI (OCR lokal tidak realistis) — kalau AI/vision tidak tersedia, pesan jelas
   mengarahkan ke tab lain.
4. **Upload File** → `/api/ai/parse-file` → ekstrak teks (PDF/DOCX) → masuk ke pipeline yang sama
   dengan Bahasa Natural (AI + fallback lokal) → **preview**. File gambar yang masuk lewat tab ini
   otomatis dialihkan ke pipeline vision.
5. **Preview** → field yang tidak yakin (tanggal kosong/ambigu, mata kuliah kosong) ditandai kuning
   "perlu dicek" — Simpan ditolak sampai diisi. User bisa edit semua field, uncheck kandidat yang
   tidak relevan, lalu **Simpan Semua** → `/api/smart-input/confirm` → insert ke
   `academic_deadlines` (+`award_points`, sama seperti endpoint lama) + update `smart_input_logs`.

## ✅ Checklist sebelum deploy
- [ ] Jalankan migration.
- [ ] `npm i pdf-parse mammoth`.
- [ ] `npm run build` hijau.
- [ ] Pasang `<SmartInputBox />` di dashboard.
- [ ] Jalankan `docs/TESTING_CHECKLIST_smart_input.md`.

Semua kode sudah dicek sintaks (esbuild), tapi **belum dites runtime** terhadap Supabase/AI
provider asli — test dulu di preview deploy sebelum production, terutama bagian AI vision & PDF
(tergantung provider & isi file asli).
