# NEXA Campus — Batch 14: NEXA Assistant Beneran Pakai Machine Learning

Bukan LLM doang. Ini 2 algoritma ML asli — ditulis dari nol (gradient descent, distribusi
Beta-Bernoulli), dilatih dari data histori user sungguhan, diuji 32 test assertion statistik.

## 1) Regresi Logistik — Prediksi Risiko Telat
**`src/lib/ml/logistic-regression.ts`** — implementasi generik: sigmoid, gradient descent,
L2 regularization, normalisasi fitur. Bobot **dipelajari** dari data (bukan ditentukan manual).

**`src/lib/ml/late-risk-model.ts`** — ekstraksi 6 fitur dari tiap deadline (lead time, prioritas,
tingkat keterlambatan historis per jenis tugas, weekend, jam, reminder), label dari
`points_events.kind='ontime_bonus'` (data yang SUDAH ada, tidak perlu kolom baru). Dilatih
**per-user, on-the-fly** tiap panggilan API (dataset kecil, <100ms) — tidak perlu cron retrain.

Minimal 8 deadline selesai buat training; di bawah itu fallback transparan ke rata-rata
sederhana (dilabeli jelas "belum cukup data", bukan pura-pura ML).

## 2) Bandit — Gaya Pengingat yang Paling Efektif (Thompson Sampling)
**`src/lib/ml/bandit.ts`** — Bernoulli bandit asli: tiap "arm" (gaya pesan) punya distribusi
Beta(alpha, beta), dipilih dengan SAMPLING (bukan rata-rata/round-robin), update otomatis dari
reward (1 = deadline selesai tepat waktu, 0 = telat). Makin sering arm tertentu berhasil buat
SATU USER SPESIFIK, makin sering dipilih untuk user itu — preferensi belajar per individu.

**`src/lib/ml/nudge-arms.ts`** — 4 gaya pesan tetap (neutral/urgency/supportive/question) —
sengaja template statis (bukan LLM) supaya ada "arm" yang konsisten buat dipelajari bandit.

## Integrasi
| File | Peran |
|---|---|
| `docs/MIGRATION_ml_risk_bandit_nudge.sql` **(BARU)** | Tabel `nudge_bandit_arms` (state per user per arm) + `nudge_log` (riwayat nudge + reward) |
| `src/app/api/ml/risk/route.ts` **(BARU)** | `GET` — latih & prediksi risiko deadline aktif user |
| `src/app/api/ml/nudge/route.ts` **(BARU)** | `POST` — bandit pilih gaya nudge untuk 1 deadline berisiko |
| `src/app/api/deadlines/[id]/route.ts` | + hook reward bandit di titik yang SAMA dengan cek `ontime_bonus` yang sudah ada |
| `src/components/ai/MLRiskPanel.tsx` **(BARU)** | UI — sengaja dipisah visual (ungu) dari chat LLM (teal), label "Machine Learning" jelas |
| `src/app/dashboard/nexa-assistant/page.tsx` | + render panel ML di bawah chat |

Gated ke **NEXA Command** (konsisten dengan fitur AI lain).

## Kenapa desainnya begini
- **Training on-the-fly, bukan model tersimpan**: dataset per-user kecil (puluhan-ratusan baris),
  gradient descent 400 epoch selesai puluhan ms — kompleksitas cron/storage model tidak sepadan.
- **Bandit state PERLU persisten** (beda dari model risiko) — itu inti "belajar lama-lama", jadi
  2 tabel baru dengan RLS select-only untuk user; insert/update HANYA lewat server (service role),
  tidak ada policy tulis untuk client.
- Privasi sudah digerbang di level pemanggil (cek plan Command, `auth.uid()=user_id` di tiap query).

## Validasi
- **32 test assertion runtime**, semua lulus:
  - 11 untuk regresi logistik (termasuk simulasi realistis deadline mepet vs longgar — model
    secara konsisten memprediksi risiko lebih tinggi untuk yang mepet)
  - 9 untuk bandit (simulasi 300 ronde: bandit belajar prefer arm dengan true success rate 0.75
    dibanding 0.30, estimasi akhir konvergen ke 0.759 vs 0.300 — sangat dekat nilai asli)
  - 12 untuk integrasi risk-model (termasuk 1 bug nyata ketemu & dibenerin DI TEST-NYA SENDIRI
    saat proses — bukti proses testing ini beneran jalan, bukan asal centang)
- `tsc --noEmit`: 0 error. `next build` dengan ESLint aktif: 0 error, 0 warning baru.
- Migration belum dieksekusi ke Postgres live — fitur bandit (nudge) butuh migration dijalankan
  dulu; fitur prediksi risiko (`/api/ml/risk`) JALAN TANPA migration (tidak butuh tabel baru).

## Limitasi yang jujur
1. Training accuracy ditampilkan, BUKAN test accuracy — dataset per-user terlalu kecil untuk
   train/test split yang bermakna. Dilabeli jelas di UI sebagai "akurasi training".
2. Bandit butuh waktu (banyak deadline) untuk benar-benar belajar preferensi — di awal pemakaian,
   pilihan arm akan terasa cukup acak (cold start, ini memang sifat algoritma bandit, bukan bug).
3. Model risiko TIDAK retrain otomatis kalau histori bertambah — itu memang desainnya (selalu
   dilatih ulang dari nol tiap dipanggil, jadi otomatis "up to date" tanpa perlu trigger apa pun).

## Cara pasang
1. Jalankan `docs/MIGRATION_ml_risk_bandit_nudge.sql`.
2. Timpa semua file di atas.
3. Buka NEXA Assistant (Command) → scroll ke bawah chat → panel ungu "Prediksi Risiko Telat".
4. Test: selesaikan beberapa deadline (campur tepat waktu & telat) → cek prediksi makin masuk akal
   seiring histori bertambah. Klik "Tampilkan pengingat" di deadline berisiko → bandit pilih 1
   dari 4 gaya pesan → selesaikan deadline itu → cek `nudge_bandit_arms` di Supabase, alpha/beta
   arm yang dipilih harus berubah sesuai hasil (on-time/telat).
