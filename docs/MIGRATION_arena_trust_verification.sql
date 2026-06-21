-- ============================================================
-- NEXA Arena — Trust & Verification System (Batch 7.1)
-- Jalankan di Supabase → SQL Editor. Idempotent.
-- ============================================================
-- PENTING: ini BUKAN sistem dari nol. Skema Arena yang sudah ada
-- (nexa_arena_posts, nexa_arena_applications, nexa_arena_team_members) DIPAKAI
-- ULANG dan DIPERLUAS — bukan diduplikasi. nexa_arena_applications sudah punya
-- alur apply→review dasar (applicant_background, portfolio_url, review_note,
-- competency_confirmed). Migration ini menambahkan: role, evidence, competency
-- Q&A terstruktur, trust score, status 'shortlisted', dan sistem verifikasi
-- akun terpisah (user_verifications + user_skill_evidence) yang baru.
-- ============================================================


-- ============================================================
-- 1) Perluas nexa_arena_applications — role, evidence, trust score
-- ============================================================
alter table public.nexa_arena_applications
  add column if not exists role_applied text,
  add column if not exists competency_answers jsonb not null default '{}'::jsonb,
  add column if not exists evidence_links jsonb not null default '[]'::jsonb,
  add column if not exists mini_challenge_answer text,
  add column if not exists trust_score integer,
  add column if not exists trust_label text;

comment on column public.nexa_arena_applications.role_applied is
  'frontend|backend|fullstack|uiux|qa|data_analyst|ai_ml|devops|business_marketing|content_social';
comment on column public.nexa_arena_applications.evidence_links is
  'array of {type: github|portfolio|certificate|file|screenshot|document|other, url: text, label: text}';
comment on column public.nexa_arena_applications.trust_label is
  'low_trust|medium_trust|high_trust|verified_candidate — dihitung otomatis saat apply, lihat lib/verification/trust-score.ts';

-- Tambah 'shortlisted' ke status yang sudah ada (pending/accepted/rejected).
-- Constraint lama dihapus dulu (nama constraint auto-generated Postgres untuk
-- inline CHECK biasanya <table>_<column>_check).
alter table public.nexa_arena_applications drop constraint if exists nexa_arena_applications_status_check;
alter table public.nexa_arena_applications
  add constraint nexa_arena_applications_status_check
  check (status in ('pending', 'shortlisted', 'accepted', 'rejected'));


-- ============================================================
-- 2) user_verifications — status verifikasi akun ("centang biru")
-- ============================================================
-- Terpisah dari nexa_arena_applications (itu per-lamaran-tim; ini per-akun,
-- status verifikasi keseluruhan profil).
create table if not exists public.user_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null default 'unverified'
    check (status in ('unverified', 'pending_review', 'verified', 'rejected')),
  score integer not null default 0,
  reviewed_by uuid references public.profiles(id) on delete set null,
  review_notes text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_verifications_status_idx on public.user_verifications (status);

alter table public.user_verifications enable row level security;

-- User boleh lihat status verifikasinya sendiri.
drop policy if exists "user_verifications_select_own" on public.user_verifications;
create policy "user_verifications_select_own"
  on public.user_verifications for select to authenticated
  using (auth.uid() = user_id);

-- User boleh INSERT permintaan verifikasi untuk dirinya sendiri, tapi HANYA
-- dengan status 'pending_review' (tidak bisa langsung set 'verified' sendiri).
drop policy if exists "user_verifications_insert_own_pending" on public.user_verifications;
create policy "user_verifications_insert_own_pending"
  on public.user_verifications for insert to authenticated
  with check (auth.uid() = user_id and status = 'pending_review');

-- SENGAJA tidak ada policy UPDATE umum untuk authenticated — user tidak
-- boleh mengubah status verifikasinya sendiri secara bebas (termasuk set diri
-- sendiri jadi 'verified'). Perubahan status (approve/reject/verify) HANYA
-- lewat API admin yang pakai service-role client.
--
-- SATU pengecualian sempit: user BOLEH mengajukan ULANG verifikasi kalau
-- statusnya sebelumnya 'rejected' (balik jadi 'pending_review' untuk
-- direview lagi) — ini perlu policy UPDATE terbatas karena endpoint request
-- pakai upsert() (insert-if-new, update-if-exists by unique user_id).
-- TIDAK mengizinkan transisi dari status lain (termasuk dari 'pending_review'
-- atau 'verified') lewat jalur ini.
drop policy if exists "user_verifications_reapply_after_rejection" on public.user_verifications;
create policy "user_verifications_reapply_after_rejection"
  on public.user_verifications for update to authenticated
  using (auth.uid() = user_id and status = 'rejected')
  with check (auth.uid() = user_id and status = 'pending_review');


-- ============================================================
-- 3) user_skill_evidence — bukti skill (link/sertifikat/file/screenshot)
-- ============================================================
create table if not exists public.user_skill_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_name text not null,
  evidence_type text not null
    check (evidence_type in ('github', 'portfolio', 'certificate', 'file', 'screenshot', 'document', 'other')),
  evidence_url text,
  file_url text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists user_skill_evidence_user_idx on public.user_skill_evidence (user_id, created_at desc);

alter table public.user_skill_evidence enable row level security;

-- User kelola penuh evidence miliknya sendiri.
drop policy if exists "user_skill_evidence_owner" on public.user_skill_evidence;
create policy "user_skill_evidence_owner"
  on public.user_skill_evidence for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Publik (user lain yang login) boleh BACA evidence orang lain — ditampilkan
-- ringkas di public profile (lihat spec F: "tampilkan skill + evidence
-- ringkas"). Data yang disimpan di sini memang dimaksudkan untuk ditunjukkan
-- ke owner lomba/orang lain, bukan data privat.
drop policy if exists "user_skill_evidence_public_read" on public.user_skill_evidence;
create policy "user_skill_evidence_public_read"
  on public.user_skill_evidence for select to authenticated
  using (true);


-- ============================================================
-- 4) profiles.is_nexa_verified — flag denormalisasi untuk badge
-- ============================================================
-- Pola yang sama dengan founder_verified yang sudah ada (boolean langsung di
-- profiles, bukan join ke user_verifications setiap kali render badge — lebih
-- cepat dibaca di ~10 tempat yang sudah menampilkan FounderVerifiedBadge).
-- Disinkronkan oleh API admin verify (lihat /api/admin/verifications/[id]).
alter table public.profiles
  add column if not exists is_nexa_verified boolean not null default false;


-- ============================================================
-- 5) Fix bug: poin "arena_approved" gagal diberikan (bonus, ditemukan saat
--    membangun batch ini — lihat README untuk detail)
-- ============================================================
-- Tidak ada perubahan skema untuk ini — fix-nya di kode (route.ts pakai
-- service-role client untuk insert points_events, bukan direct insert lewat
-- client biasa yang selalu gagal kena RLS). Disebut di sini sebagai catatan
-- supaya migration & kode tetap selaras.
