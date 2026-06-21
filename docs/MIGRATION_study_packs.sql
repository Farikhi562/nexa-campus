-- ============================================================
-- NEXA Assistant — Belajar dari Materi (Batch 15)
-- Jalankan di Supabase → SQL Editor. Idempotent.
-- ============================================================
-- User upload file/teks materi kuliah (mis. transkrip ucapan dosen, catatan,
-- slide) -> NEXA Assistant bikin roadmap belajar + rangkuman + quiz
-- interaktif, disimpan supaya bisa dibuka/diulang lagi nanti.
-- ============================================================

create table if not exists public.study_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_filename text,
  source_type text not null default 'text' check (source_type in ('file', 'text')),
  topic text not null,
  roadmap jsonb not null default '[]'::jsonb,
  summary text not null default '',
  quiz jsonb not null default '[]'::jsonb,
  quiz_best_score integer,
  quiz_attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_packs_user_idx on public.study_packs (user_id, created_at desc);

alter table public.study_packs enable row level security;

drop policy if exists "study_packs_owner" on public.study_packs;
create policy "study_packs_owner"
  on public.study_packs for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
