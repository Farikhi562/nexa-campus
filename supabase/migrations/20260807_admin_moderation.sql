-- NEXA Campus — Admin moderation: ban user, report akun, hapus study room.
-- Jalankan manual di Supabase SQL editor sebelum fitur admin moderation dipakai.

-- ── Ban user ──────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_banned boolean not null default false,
  add column if not exists banned_reason text,
  add column if not exists banned_at timestamptz,
  add column if not exists banned_by uuid references auth.users(id) on delete set null;

comment on column public.profiles.is_banned is
  'Kalau true, user diblokir dari dashboard (dicek di app/dashboard/layout.tsx). Diset lewat panel admin.';

-- ── Report akun ───────────────────────────────────────────────────────────
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (reason in ('spam', 'pelecehan', 'penipuan', 'konten_tidak_pantas', 'akun_palsu', 'lainnya')),
  detail text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  constraint user_reports_detail_length check (detail is null or char_length(detail) <= 1000),
  constraint user_reports_not_self check (reporter_id <> reported_user_id)
);

create index if not exists user_reports_reported_user_idx on public.user_reports (reported_user_id);
create index if not exists user_reports_status_idx on public.user_reports (status, created_at desc);

alter table public.user_reports enable row level security;

-- User biasa cuma boleh BUAT laporan (punya sendiri sebagai reporter). Baca/update
-- laporan hanya lewat service role di endpoint admin — sengaja TIDAK ada policy
-- select/update untuk role authenticated di sini.
drop policy if exists "user_reports_insert_own" on public.user_reports;
create policy "user_reports_insert_own"
  on public.user_reports for insert
  with check (auth.uid() = reporter_id);

-- Rate limit sederhana: user cuma boleh 1 laporan pending per target (dicek juga
-- di application layer, ini jaga-jaga di level DB).
create unique index if not exists user_reports_one_pending_per_target
  on public.user_reports (reporter_id, reported_user_id)
  where status = 'pending';

notify pgrst, 'reload schema';
