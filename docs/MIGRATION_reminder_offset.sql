-- ============================================================
-- Batch 22: Quick Add transparency
-- Kolom reminder_offset_minutes — berapa menit sebelum deadline
-- user mau diingatkan (dari NLP "ingatkan 2 jam sebelum" -> 120).
-- Idempotent. Jalankan di Supabase SQL Editor.
-- ============================================================

alter table public.academic_deadlines
  add column if not exists reminder_offset_minutes integer
    check (reminder_offset_minutes is null or reminder_offset_minutes between 1 and 40320);
-- 40320 menit = 28 hari, batas atas wajar untuk reminder.

comment on column public.academic_deadlines.reminder_offset_minutes is
  'Menit sebelum deadline untuk reminder custom. NULL = pakai reminder default (H-7/H-3/H-1 dst dari ReminderPreferences).';
