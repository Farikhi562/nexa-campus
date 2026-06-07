-- ============================================================================
-- NEXA ID + enable realtime study room messages
-- ============================================================================

-- 1) Nexa ID: 6-digit unik untuk cari teman
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nexa_id text;

-- Generate untuk user yang sudah ada
DO $$
DECLARE
  r RECORD;
  code text;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE nexa_id IS NULL LOOP
    LOOP
      code := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE nexa_id = code);
    END LOOP;
    UPDATE public.profiles SET nexa_id = code WHERE id = r.id;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_nexa_id_key
  ON public.profiles (nexa_id) WHERE nexa_id IS NOT NULL;

-- Trigger: auto-assign nexa_id saat user baru
CREATE OR REPLACE FUNCTION public.set_nexa_id()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE code text;
BEGIN
  IF new.nexa_id IS NULL THEN
    LOOP
      code := lpad(floor(random() * 900000 + 100000)::text, 6, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE nexa_id = code);
    END LOOP;
    new.nexa_id := code;
  END IF;
  RETURN new;
END; $$;

DROP TRIGGER IF EXISTS profiles_set_nexa_id ON public.profiles;
CREATE TRIGGER profiles_set_nexa_id
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_nexa_id();

-- 2) Enable Supabase Realtime untuk study_room_messages
-- Jalankan di SQL Editor: ALTER PUBLICATION supabase_realtime ADD TABLE public.study_room_messages;
-- (Tidak bisa via migration biasa, harus di SQL editor langsung)

NOTIFY pgrst, 'reload schema';
