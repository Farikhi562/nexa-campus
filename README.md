# NEXA Campus — Batch 7.1: NEXA Arena Trust & Verification System

Status: dibangun di atas skema Arena yang **sudah ada** (tidak duplikat), diuji 41 assertion
runtime + `tsc --noEmit` 0 error + `next build` produksi sukses penuh (semua route baru
ter-generate). 1 bug build (route conflict) dan 1 bug fungsional lama ditemukan & diperbaiki.

## Yang sudah ada sebelumnya (TIDAK diduplikasi)
`nexa_arena_applications` (apply→review dasar), `nexa_arena_posts`, `nexa_arena_team_members`,
`profiles.featured_badge` sudah ada. Migration ini **memperluas**, bukan membuat ulang.

## 1) Baru
| File | Fungsi |
|---|---|
| `docs/MIGRATION_arena_trust_verification.sql` | Extend `nexa_arena_applications` (role/evidence/competency/trust_score/status shortlisted) + tabel baru `user_verifications` + `user_skill_evidence` + `profiles.is_nexa_verified` |
| `src/lib/verification/role-config.ts` | 10 role + pertanyaan kompetensi + mini challenge per role |
| `src/lib/verification/trust-score.ts` | Hitung skor 0-100 → low/medium/high_trust/verified_candidate |
| `src/lib/verification/eligibility.ts` | Cek syarat verifikasi akun (7 syarat dari spec) |
| `src/lib/verification/url-validation.ts` | Validasi URL evidence (tolak `javascript:`/`data:`) |
| `src/app/api/skill-evidence/route.ts` | CRUD bukti skill |
| `src/app/api/verification/request/route.ts` | User ajukan verifikasi (cek eligibility server-side) |
| `src/app/api/admin/verifications/route.ts` + `[id]/route.ts` | Admin list + approve/reject, sync `is_nexa_verified` |
| `src/components/verification/VerificationProgressCard.tsx` | Checklist syarat + tombol ajukan (settings) |
| `src/components/verification/SkillEvidenceForm.tsx` | Kelola evidence (settings) |
| `src/components/admin/VerificationReviewPanel.tsx` + `app/dashboard/admin/verifications/page.tsx` | Dashboard admin review |

## 2) Diperluas (bukan ditulis ulang dari nol)
- **`FounderVerifiedBadge.tsx`** — tambah prop `verified`, render centang biru (CSS baru
  `.nexa-verified-check` di `globals.css`, lihat snippet di bawah). Founder tetap prioritas.
- **`ArenaView.tsx`** — Apply Modal: + role select, evidence links (multi), pertanyaan
  kompetensi per role, mini challenge opsional. Review Panel: + filter role/verified, badge
  trust score, tombol Shortlist, tampilan evidence/jawaban kompetensi.
- **`apply/route.ts`** — validasi role+evidence (URL check)+competency, hitung trust score
  server-side (profil+evidence+skill cocok+aktivitas sebelumnya), insert lengkap.
- **`applications/[applicationId]/route.ts`** — + action `shortlist`. **Fix bug:** poin
  `arena_approved` sebelumnya selalu gagal diam-diam (insert via client biasa untuk user LAIN,
  selalu kena RLS + field `metadata` yang sebenarnya tidak ada di skema) — sekarang pakai
  service-role client + field yang benar + idempotent via `ref`.
- **`applications/route.ts`, `arena/route.ts`** — tambah `is_nexa_verified` ke select profil.
- **Public profile** (`page.tsx` + `PublicUserProfileView.tsx`) — badge verified di nama, card
  "Bukti Skill" ringkas (skill+evidence, sesuai spec F — tidak menampilkan data sensitif).

### Snippet CSS (tambah manual ke `globals.css`, dekat style founder yang sudah ada)
```css
.nexa-verified-check {
  filter: drop-shadow(0 0 2px rgba(37, 99, 235, 0.35));
}
```

## 3) Bug ditemukan & diperbaiki selama proses ini
1. **[BUILD-BREAKING]** Folder duplikat nyangkut `arena/[id]/[id]/...` dari sisa `cp -r` di sesi
   sebelumnya — bikin `next build` gagal total ("same slug name id repeat"). Dihapus.
2. **[FUNGSIONAL, pre-existing]** Poin `arena_approved` (20 poin) gagal diberikan ke pelamar yang
   diterima — insert lewat client biasa untuk user lain selalu kena RLS, plus field `metadata`
   yang tidak ada di skema. Diperbaiki pakai service-role client.
3. **[RLS, ditemukan saat desain]** Endpoint re-request verifikasi (`rejected` → `pending_review`)
   pakai `upsert()`, butuh policy UPDATE terbatas yang awalnya lupa ditambahkan — sudah di-fix di
   migration (transisi HANYA dari `rejected`, tidak bisa dari status lain).

### Dicatat, TIDAK diperbaiki (di luar scope batch ini)
Trigger `update_arena_team_size()` (pre-existing) dan kode `applications/[applicationId]/route.ts`
(pre-existing) **sama-sama** meng-update `current_team_size` saat accept — redundan, berisiko
race condition kalau owner accept 2 pelamar nyaris bersamaan (lost update). Bukan bug yang
diperkenalkan batch ini; perlu sesi terpisah untuk fix yang hati-hati (perlu live DB test).

## 4) Cara pasang
1. Jalankan `docs/MIGRATION_arena_trust_verification.sql`.
2. Timpa semua file di atas + tambah snippet CSS.
3. `npm run build` (sudah hijau di sandbox).
4. Test: lamar Arena dengan role+evidence → cek trust score muncul di review panel → shortlist
   → accept → cek poin masuk → lengkapi profil+evidence → ajukan verifikasi di settings →
   approve di `/dashboard/admin/verifications` → cek centang biru muncul di profil publik.
