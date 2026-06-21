-- ============================================================
-- NEXA Assistant — ML: Risk Prediction + Bandit Nudge (Batch 14)
-- Jalankan di Supabase → SQL Editor. Idempotent.
-- ============================================================
-- Tidak ada perubahan ke tabel/fungsi yang sudah ada — murni 2 tabel baru.
-- Model risiko-telat (regresi logistik) DILATIH ON-THE-FLY tiap panggilan
-- API dari histori academic_deadlines + points_events yang sudah ada, jadi
-- TIDAK butuh tabel baru untuk itu. Yang butuh tabel baru cuma state bandit
-- (harus persisten antar request, itu intinya bandit "belajar" lama-lama)
-- dan log nudge (buat tahu nudge mana yang terkait deadline mana, supaya
-- reward bisa dicatat saat deadline itu selesai).
-- ============================================================

-- 1) State bandit per user per arm (parameter distribusi Beta).
create table if not exists public.nudge_bandit_arms (
  user_id uuid not null references public.profiles(id) on delete cascade,
  arm_id text not null check (arm_id in ('neutral', 'urgency', 'supportive', 'question')),
  alpha numeric not null default 1,
  beta numeric not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, arm_id)
);

alter table public.nudge_bandit_arms enable row level security;

drop policy if exists "nudge_bandit_arms_select_own" on public.nudge_bandit_arms;
create policy "nudge_bandit_arms_select_own"
  on public.nudge_bandit_arms for select to authenticated
  using (auth.uid() = user_id);

-- SENGAJA tidak ada policy insert/update untuk authenticated — state bandit
-- HANYA boleh berubah lewat endpoint /api/ml/nudge dan hook reward di
-- /api/deadlines/[id] (server-side, terverifikasi), bukan ditulis bebas dari
-- client. Kedua endpoint itu pakai service-role client (lihat README).

-- 2) Log tiap kali nudge ditampilkan ke user, untuk dipasangkan dengan
--    reward (hasil) begitu deadline terkait resolve.
create table if not exists public.nudge_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  deadline_id uuid not null references public.academic_deadlines(id) on delete cascade,
  arm_id text not null check (arm_id in ('neutral', 'urgency', 'supportive', 'question')),
  shown_at timestamptz not null default now(),
  resolved_at timestamptz,
  reward smallint check (reward in (0, 1)),
  -- 1 nudge aktif per deadline (kalau dipanggil ulang sebelum resolve, pakai yang sama).
  unique (deadline_id)
);

create index if not exists nudge_log_user_idx on public.nudge_log (user_id, resolved_at);

alter table public.nudge_log enable row level security;

drop policy if exists "nudge_log_select_own" on public.nudge_log;
create policy "nudge_log_select_own"
  on public.nudge_log for select to authenticated
  using (auth.uid() = user_id);

-- Sama seperti nudge_bandit_arms — insert/update HANYA lewat server (service
-- role), tidak ada policy untuk authenticated.
