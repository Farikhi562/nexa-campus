-- ============================================================
-- Batch 17: Study v2 (Flashcard) + Recurring Schedules
-- Jalankan di Supabase → SQL Editor. Idempotent.
-- ============================================================

-- ── STUDY V2: Flashcard ─────────────────────────────────────
-- Kolom baru di study_packs — flashcard dihasilkan terpisah
-- (on demand, bukan di saat generate study pack awal).
alter table public.study_packs
  add column if not exists flashcards jsonb not null default '[]'::jsonb,
  add column if not exists flashcard_boxes jsonb not null default '{}'::jsonb;
-- flashcards: [{front:string, back:string}]
-- flashcard_boxes: {[cardIndex]:1|2|3} — Leitner box per user
-- Box 1 = belum tahu, Box 2 = agak tahu, Box 3 = sudah tahu

-- ── RECURRING SCHEDULES ─────────────────────────────────────
-- Tambah kolom ke academic_deadlines. NULL = bukan jadwal
-- berulang; diisi = jadwal kuliah/kegiatan mingguan.
alter table public.academic_deadlines
  add column if not exists is_recurring boolean not null default false,
  add column if not exists recurrence_day_of_week smallint
    check (recurrence_day_of_week between 0 and 6), -- 0=Min,1=Sen,...,6=Sab
  add column if not exists recurrence_parent_id uuid
    references public.academic_deadlines(id) on delete cascade;
-- recurrence_parent_id: diisi di instance (bukan di parent).
-- Semua instance berbagi parent yang sama — hapus parent →
-- cascade hapus semua instance otomatis.

comment on column public.academic_deadlines.is_recurring is
  'true = ini adalah jadwal berulang (parent). Instance juga punya is_recurring=true tapi recurrence_parent_id terisi.';
comment on column public.academic_deadlines.recurrence_day_of_week is
  '0=Minggu, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu.';
comment on column public.academic_deadlines.recurrence_parent_id is
  'Untuk instance: UUID parent jadwal berulang. Null untuk parent atau jadwal biasa.';

-- Index untuk query "tampilkan semua instance jadwal X"
create index if not exists academic_deadlines_recurrence_parent_idx
  on public.academic_deadlines (recurrence_parent_id)
  where recurrence_parent_id is not null;
