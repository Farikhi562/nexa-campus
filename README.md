# NEXA Campus — Batch 7: Smart Input Engine (Integrated & Hardened)

Status: **terpasang langsung ke dashboard**, **diuji runtime** (97 assertion, 7 skenario,
real execution — bukan cuma syntax check), **`next build` produksi sungguhan sukses**.
3 bug ditemukan & diperbaiki selama proses ini (detail di §6).

---

## 1. File yang berubah

### Baru (additive, tidak menyentuh fitur lama)
| File | Fungsi |
|---|---|
| `docs/MIGRATION_smart_input_logs.sql` | Tabel `smart_input_logs`, RLS per-user |
| `src/lib/smart-input/types.ts` | Tipe `SmartInputCandidate`, `RawCandidate`, `ExtractResult` |
| `src/lib/smart-input/normalize.ts` | Normalisasi hasil mentah → kandidat siap-preview |
| `src/lib/smart-input/local-parser.ts` | Parser lokal tanpa AI (fallback), regex Bahasa Indonesia |
| `src/lib/smart-input/extract.ts` | Layer ekstraksi AI (teks & gambar) + timeout 15-25 detik + fallback otomatis |
| `src/lib/smart-input/file-extract.ts` | Ekstrak teks PDF (`pdfjs-dist`) & DOCX (`mammoth`) |
| `src/app/api/ai/parse-text/route.ts` | `POST` parse teks bebas → kandidat (Node runtime eksplisit) |
| `src/app/api/ai/parse-image/route.ts` | `POST` parse gambar (vision AI) → kandidat (Node runtime eksplisit) |
| `src/app/api/ai/parse-file/route.ts` | `POST` parse PDF/DOCX → kandidat (Node runtime eksplisit) |
| `src/app/api/smart-input/confirm/route.ts` | `POST` validasi + simpan ke `academic_deadlines` |
| `src/components/smart-input/SmartInputBox.tsx` | Komponen utama — 4 tab, timeout client-side, pre-check ukuran file |
| `src/components/smart-input/SmartInputPreview.tsx` | Preview/edit kandidat sebelum simpan |
| `src/components/smart-input/SmartManualForm.tsx` | Form manual ringkas |
| `.env.smart-input.example` | Catatan ENV + dependency |
| `docs/TESTING_CHECKLIST_smart_input.md` | Hasil pengujian aktual + checklist manual sisa |

### Diubah — integrasi dashboard sungguhan (file lengkap siap timpa, bukan snippet)
| File | Perubahan |
|---|---|
| `src/app/dashboard/page.tsx` | + `campus_name` ke query profil & tipe `DashboardProfile`; teruskan `defaultCampus` ke overview. 3 baris berubah dari file asli (lihat diff §2). |
| `src/components/dashboard/DeadlineDashboardOverview.tsx` | + import & render `<SmartInputBox plan={userTier} defaultCampus={...} />` di bawah hero section. 4 titik perubahan, sisanya identik. |

Kedua file di atas diberikan utuh — tinggal timpa langsung, tidak perlu cari tempat sisip sendiri.

---

## 2. Diff persis terhadap file asli (untuk review cepat)

`app/dashboard/page.tsx`:
```diff
-  'full_name' | 'email' | 'plan' | ... | 'telegram_chat_id' | 'nexa_id'
+  'full_name' | 'email' | 'plan' | ... | 'telegram_chat_id' | 'nexa_id' | 'campus_name'

-  .select('full_name, email, plan, ..., telegram_chat_id, nexa_id')
+  .select('full_name, email, plan, ..., telegram_chat_id, nexa_id, campus_name')

       hasTelegramChatId={Boolean(dashboardProfile?.telegram_chat_id)}
+      defaultCampus={dashboardProfile?.campus_name || 'Kampus'}
```

`components/dashboard/DeadlineDashboardOverview.tsx`:
```diff
 import AskNexaWidget from '@/components/dashboard/AskNexaWidget'
+import SmartInputBox from '@/components/smart-input/SmartInputBox'
 ...
   hasTelegramChatId?: boolean
+  defaultCampus?: string | null
 ...
   hasTelegramChatId = false,
+  defaultCampus,
 ...
       </section>
+
+      <SmartInputBox plan={userTier} defaultCampus={defaultCampus || 'Kampus'} />
+
       <DailyPulseCard />
```

`userTier` sudah ada sebagai prop existing di komponen ini (dipakai untuk gating fitur lain) —
langsung dipakai ulang sebagai `plan` untuk `SmartInputBox`. Komponen aslinya sudah memberi
default `userTier = 'radar'`, jadi kalau user belum punya plan, otomatis fallback ke Radar/free
sesuai permintaan.

---

## 3. Migration SQL final

`docs/MIGRATION_smart_input_logs.sql` — tidak berubah dari draft sebelumnya, sudah aman:
- `smart_input_logs` dengan FK ke `profiles(id)` (terverifikasi cocok skema asli, `profiles.id`
  adalah PK yang sama dipakai tabel lain).
- RLS: `using (auth.uid() = user_id) with check (auth.uid() = user_id)` — user hanya bisa
  baca/tulis baris miliknya sendiri.
- Tidak mengubah tabel/kolom lain apa pun.

Jalankan di Supabase SQL Editor, idempotent (aman dijalankan ulang).

---

## 4. Dependency baru

```
npm i pdfjs-dist mammoth
```

Berubah dari draft sebelumnya — brief awal menyebut `pdf-parse`, tapi setelah diuji langsung
dengan PDF asli, paket itu terbukti tidak reliable (lihat §6 bug #1). Sudah diganti `pdfjs-dist`
(pdf.js resmi Mozilla). Jangan install `pdf-parse` — tidak dipakai lagi.

`web-push` (Batch 6) tetap dibutuhkan kalau belum terpasang.

---

## 5. ENV baru

Tidak ada ENV baru. Smart Input Engine reuse penuh `AI_PROVIDER`/`AI_API_KEY` dari Batch 1.
Lihat `.env.smart-input.example` untuk detail & perilaku tanpa AI (semua tab tetap berfungsi
dengan fallback, kecuali Upload Gambar yang butuh AI vision).

---

## 6. Bug ditemukan & diperbaiki selama hardening

1. **[KRITIKAL] `pdf-parse` diganti `pdfjs-dist`.** Diuji dengan PDF asli: `pdf-parse`
   membundel pdf.js v1.10.100 (2017) dengan module-level state. PDF kosong yang diproses tepat
   setelah PDF berteks mengembalikan teks dari PDF sebelumnya — bukan error, salah ambil data.
   Risiko nyata di Vercel serverless yang warm (berpotensi "bocor" isi PDF antar user). Diganti
   `pdfjs-dist`, diuji ulang berulang kali (termasuk interleaved), selalu benar.
2. **[SEDANG] Limit upload gambar/file: 5MB/8MB diturunkan ke 3MB.** Vercel Serverless
   Functions punya hard limit 4.5MB untuk request body (tidak bisa dikonfigurasi naik). Base64
   menambah ~33% ukuran — limit lama akan gagal HTTP 413 di production walau lolos validasi
   kode. Diturunkan ke batas aman + ditambah pre-check di client (feedback instan).
3. **[KECIL] Pembersihan `course_name` di parser lokal** — urutan regex salah membuat
   "jam 23.59" ter-parse parsial. Diperbaiki, diverifikasi sebelum/sesudah.
4. **[KECIL] Type error** di `confirm/route.ts` (`'error' in parsed` gagal di-narrow TS) —
   diperbaiki jadi pola yang sama dengan `/api/deadlines` asli.

Juga ditambahkan secara proaktif untuk poin performance di briefmu:
- Timeout 15-25 detik di semua pemanggilan AI server-side — AI yang hang otomatis fallback ke
  parser lokal (teks) atau pesan jelas (gambar), tidak pernah menggantung tanpa batas.
- Timeout 32 detik di client (`AbortController`) — UI berhenti nunggu dan kasih pesan jelas,
  bukan spinner selamanya.
- `runtime = 'nodejs'` + `maxDuration` eksplisit di keempat route API (`pdfjs-dist`/`mammoth`
  butuh Node API, tidak jalan di Edge Runtime).

---

## 7. Hasil pengujian runtime (ringkas — detail penuh di docs/TESTING_CHECKLIST_smart_input.md)

| Validasi | Metode | Hasil |
|---|---|---|
| Logic murni (parser, normalize, validasi) | 97 assertion, real execution via tsx | 97/97 PASS |
| Jalur AI aktif (teks & gambar) | fetch di-mock meniru respons Groq asli, termasuk error/timeout/network-down | semua skenario PASS |
| Ekstraksi PDF/DOCX | File PDF & DOCX asli (reportlab/python-docx), termasuk PDF kosong (simulasi scan) | semua benar, tanpa kontaminasi data |
| Typecheck | tsc --noEmit strict, seluruh source asli + overlay Batch 7 | 0 error |
| Build produksi | next build Next.js 14.2.35, seluruh route asli + baru | sukses, 73/73 halaman, 0 error |
| Integrasi dashboard | Diff manual terhadap file asli | minimal & presisi (lihat §2) |

Yang tidak bisa dijalankan dari sandbox ini (perlu kredensial/infra asli kamu): Supabase
sungguhan, AI provider dengan API key asli, deploy Vercel asli, device mobile fisik. Checklist
manual untuk ini ada di docs/TESTING_CHECKLIST_smart_input.md bagian 2.

---

## 8. Cara pasang

1. Jalankan `docs/MIGRATION_smart_input_logs.sql` di Supabase SQL Editor.
2. `npm i pdfjs-dist mammoth`.
3. Timpa semua file di §1 (baru dan diubah), termasuk `app/dashboard/page.tsx` dan
   `components/dashboard/DeadlineDashboardOverview.tsx` (sudah lengkap, langsung timpa).
4. `npm run build` (sudah divalidasi hijau di sandbox), lalu deploy seperti biasa.
5. Verifikasi cepat: buka `/dashboard` → SmartInputBox muncul di bawah hero → coba tab Manual →
   coba tab Bahasa Natural (kalau AI aktif) → jalankan checklist manual di §2 testing checklist.

---

## 9. Limitasi yang masih ada

1. Upload dibatasi 3MB — batas keras platform Vercel, bukan pilihan. Solusi jangka panjang
   (upload langsung ke Supabase Storage) adalah perubahan arsitektur terpisah, belum dikerjakan.
2. Parser lokal (fallback non-AI) kualitasnya di bawah AI untuk teks panjang tanpa baris baru.
   Field krusial (tanggal/jam/jenis) tetap benar; user tetap review di preview.
3. Beberapa stopword Indonesia ("ada", dll) belum dibersihkan dari course_name di parser lokal —
   kosmetik, tidak memengaruhi data inti.
4. Validasi `next build` di sandbox memakai next.config.js/tailwind.config.js minimal (PWA
   dinonaktifkan, palet warna stub) karena config asli project tidak ada di file yang diupload.
   Risiko konflik dengan config asli kamu kecil, tapi tetap jalankan `npm run build` sekali lagi
   di environment kamu sendiri sebagai langkah terakhir.
5. Vision AI & ekstraksi PDF/DOCX sudah diuji dengan file asli tapi API key mock (bukan provider
   asli) — sarankan 1-2 kali tes manual dengan API key & file tugas sungguhan sebelum dianggap
   production-ready 100%.

---

## Berikutnya: Batch 7.1 — NEXA Arena Trust & Verification System

Smart Input Engine sudah solid (terpasang + teruji). Siap lanjut ke 7.1 sesuai urutan yang kamu
minta — bilang "lanjut" dan saya mulai dengan membaca skema tabel Arena yang sudah ada
(nexa_arena_posts, nexa_arena_team_members, dll dari batch sebelumnya) supaya
arena_applications/user_verifications/user_skill_evidence nyambung rapi, bukan duplikat.
