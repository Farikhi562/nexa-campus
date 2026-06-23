-- =============================================================================
-- MIGRATION: study_v2 — Feynman mode, study plan, checklist, weakness diagnosis
-- Batch 23 — Bagian 2 (Belajar)
-- Jalankan SEKALI di Supabase SQL editor sebelum deploy.
-- =============================================================================

-- 1. Tabel sesi Feynman ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.study_feynman_sessions (
  id               uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_id          uuid    REFERENCES public.study_packs(id) ON DELETE SET NULL,
  concept          text    NOT NULL CHECK (char_length(concept) > 0 AND char_length(concept) <= 200),
  user_explanation text    NOT NULL,
  score            integer NOT NULL CHECK (score >= 0 AND score <= 100),
  feedback         jsonb   NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS study_feynman_sessions_user_id_idx
  ON public.study_feynman_sessions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS study_feynman_sessions_pack_id_idx
  ON public.study_feynman_sessions (pack_id)
  WHERE pack_id IS NOT NULL;

-- RLS
ALTER TABLE public.study_feynman_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own feynman sessions"
  ON public.study_feynman_sessions
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Extend study_packs --------------------------------------------------------

-- Checklist: array of { id, text, done, order }
ALTER TABLE public.study_packs
  ADD COLUMN IF NOT EXISTS checklist jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Study plan: { steps: [{id,title,description,type,duration_minutes}], total_minutes, created_at }
ALTER TABLE public.study_packs
  ADD COLUMN IF NOT EXISTS active_plan jsonb DEFAULT NULL;

-- Progres langkah yang sudah diselesaikan (array step id string)
ALTER TABLE public.study_packs
  ADD COLUMN IF NOT EXISTS plan_progress text[] NOT NULL DEFAULT '{}';

-- Indeks soal yang dijawab salah di attempt terakhir (integer array)
ALTER TABLE public.study_packs
  ADD COLUMN IF NOT EXISTS quiz_last_wrong integer[] NOT NULL DEFAULT '{}';

-- 3. (Opsional) Constraint validasi ringan -------------------------------------

-- Pastikan checklist adalah array JSON
ALTER TABLE public.study_packs
  DROP CONSTRAINT IF EXISTS study_packs_checklist_is_array,
  ADD  CONSTRAINT study_packs_checklist_is_array
    CHECK (jsonb_typeof(checklist) = 'array');

-- =============================================================================
-- ROLLBACK (simpan untuk darurat):
-- DROP TABLE IF EXISTS public.study_feynman_sessions;
-- ALTER TABLE public.study_packs
--   DROP COLUMN IF EXISTS checklist,
--   DROP COLUMN IF EXISTS active_plan,
--   DROP COLUMN IF EXISTS plan_progress,
--   DROP COLUMN IF EXISTS quiz_last_wrong;
-- =============================================================================
