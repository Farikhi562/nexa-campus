-- ============================================================================
-- NEXA Arena + Language preference + Email notification
-- ============================================================================

-- 1) Language preference di profil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'id'
    CHECK (language IN ('id', 'en'));

-- 2) Email notifikasi (opsional, user yang mau isi)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_email text;

-- 3) Email channel di reminder_preferences
ALTER TABLE public.reminder_preferences
  DROP CONSTRAINT IF EXISTS reminder_preferences_channel_check;
ALTER TABLE public.reminder_preferences
  ADD CONSTRAINT reminder_preferences_channel_check
    CHECK (channel IN ('telegram','whatsapp','email'));

-- ============================================================================
-- NEXA ARENA — cari tim lomba
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.nexa_arena_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  competition_name text,
  competition_type text NOT NULL DEFAULT 'lainnya'
    CHECK (competition_type IN ('hackathon','bisnis','saintek','desain','akademik','seni','esport','olahraga','lainnya')),
  description text,
  skills_needed text[] NOT NULL DEFAULT '{}',
  team_size_max integer NOT NULL DEFAULT 4 CHECK (team_size_max BETWEEN 2 AND 20),
  current_team_size integer NOT NULL DEFAULT 1,
  deadline_registration date,
  event_date date,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','full','closed')),
  campus_open boolean NOT NULL DEFAULT true, -- true = semua kampus, false = kampus sama
  campus_name text,
  prize text, -- hadiah/benefit
  link_info text, -- link pendaftaran/info
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS arena_posts_type_idx ON public.nexa_arena_posts (competition_type, status);
CREATE INDEX IF NOT EXISTS arena_posts_creator_idx ON public.nexa_arena_posts (creator_id);

CREATE TABLE IF NOT EXISTS public.nexa_arena_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.nexa_arena_posts(id) ON DELETE CASCADE,
  applicant_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text,
  skills_offered text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, applicant_id)
);
CREATE INDEX IF NOT EXISTS arena_apps_post_idx ON public.nexa_arena_applications (post_id, status);
CREATE INDEX IF NOT EXISTS arena_apps_applicant_idx ON public.nexa_arena_applications (applicant_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS arena_posts_updated_at ON public.nexa_arena_posts;
CREATE TRIGGER arena_posts_updated_at BEFORE UPDATE ON public.nexa_arena_posts
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
DROP TRIGGER IF EXISTS arena_apps_updated_at ON public.nexa_arena_applications;
CREATE TRIGGER arena_apps_updated_at BEFORE UPDATE ON public.nexa_arena_applications
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- Auto-update team_size saat application di-accept
CREATE OR REPLACE FUNCTION public.update_arena_team_size()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new.status = 'accepted' AND (old.status IS NULL OR old.status <> 'accepted') THEN
    UPDATE public.nexa_arena_posts
    SET current_team_size = current_team_size + 1,
        status = CASE WHEN current_team_size + 1 >= team_size_max THEN 'full' ELSE 'open' END
    WHERE id = new.post_id;
  END IF;
  IF new.status <> 'accepted' AND old.status = 'accepted' THEN
    UPDATE public.nexa_arena_posts
    SET current_team_size = greatest(1, current_team_size - 1),
        status = CASE WHEN status = 'full' THEN 'open' ELSE status END
    WHERE id = new.post_id;
  END IF;
  RETURN new;
END; $$;
DROP TRIGGER IF EXISTS arena_team_size_trigger ON public.nexa_arena_applications;
CREATE TRIGGER arena_team_size_trigger
  AFTER INSERT OR UPDATE OF status ON public.nexa_arena_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_arena_team_size();

-- RLS
ALTER TABLE public.nexa_arena_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nexa_arena_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "arena_posts_select" ON public.nexa_arena_posts;
CREATE POLICY "arena_posts_select" ON public.nexa_arena_posts
  FOR SELECT TO authenticated USING (true); -- semua bisa lihat

DROP POLICY IF EXISTS "arena_posts_insert" ON public.nexa_arena_posts;
CREATE POLICY "arena_posts_insert" ON public.nexa_arena_posts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "arena_posts_update" ON public.nexa_arena_posts;
CREATE POLICY "arena_posts_update" ON public.nexa_arena_posts
  FOR UPDATE TO authenticated USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "arena_posts_delete" ON public.nexa_arena_posts;
CREATE POLICY "arena_posts_delete" ON public.nexa_arena_posts
  FOR DELETE TO authenticated USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "arena_apps_select" ON public.nexa_arena_applications;
CREATE POLICY "arena_apps_select" ON public.nexa_arena_applications
  FOR SELECT TO authenticated
  USING (
    auth.uid() = applicant_id OR
    EXISTS (SELECT 1 FROM public.nexa_arena_posts p WHERE p.id = post_id AND p.creator_id = auth.uid())
  );

DROP POLICY IF EXISTS "arena_apps_insert" ON public.nexa_arena_applications;
CREATE POLICY "arena_apps_insert" ON public.nexa_arena_applications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = applicant_id);

DROP POLICY IF EXISTS "arena_apps_update" ON public.nexa_arena_applications;
CREATE POLICY "arena_apps_update" ON public.nexa_arena_applications
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = applicant_id OR
    EXISTS (SELECT 1 FROM public.nexa_arena_posts p WHERE p.id = post_id AND p.creator_id = auth.uid())
  );

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- Featured badge (badge pilihan user untuk ditampilkan di profil)
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS featured_badge text;

-- Pastikan realtime aktif untuk study_room_messages
-- (Jika query ini gagal, jalankan manual: ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_messages;)
DO $rt$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'study_room_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_messages;
  END IF;
EXCEPTION WHEN others THEN NULL;
END $rt$;

NOTIFY pgrst, 'reload schema';
