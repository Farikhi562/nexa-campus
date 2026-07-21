-- NEXA Campus v1.6.51 — Retention intelligence
-- Smart reschedule metadata + spaced repetition schedule.

alter table public.academic_deadlines
  add column if not exists rescheduled_count integer not null default 0,
  add column if not exists last_rescheduled_at timestamptz;

alter table public.academic_deadlines drop constraint if exists academic_deadlines_rescheduled_count_check;
alter table public.academic_deadlines add constraint academic_deadlines_rescheduled_count_check
  check (rescheduled_count between 0 and 999);

alter table public.study_packs
  add column if not exists flashcard_schedule jsonb not null default '{}'::jsonb;

comment on column public.study_packs.flashcard_schedule is
  'Per-card spaced repetition schedule keyed by card index.';

notify pgrst, 'reload schema';
