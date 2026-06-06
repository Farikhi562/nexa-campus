-- ============================================================================
-- NEXA Campus — Study Room v2: kode unik, join requests, chat, attachments
-- Jalankan di SQL Editor. Idempotent (aman diulang).
-- ============================================================================

-- 1) Generator kode room unik (6 karakter, uppercase)
CREATE OR REPLACE FUNCTION public.generate_room_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE code text;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.study_rooms WHERE room_code = code);
  END LOOP;
  RETURN code;
END; $$;

-- 2) Tambah kolom baru ke study_rooms (aman jika sudah ada)
ALTER TABLE public.study_rooms
  ADD COLUMN IF NOT EXISTS room_code text,
  ADD COLUMN IF NOT EXISTS cover_url text;

-- Isi room_code untuk room yang belum punya
UPDATE public.study_rooms SET room_code = public.generate_room_code() WHERE room_code IS NULL;

-- Baru pasang constraint unique + NOT NULL
ALTER TABLE public.study_rooms ALTER COLUMN room_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS study_rooms_room_code_key ON public.study_rooms (room_code);

-- 3) Trigger: auto-set room_code saat INSERT
CREATE OR REPLACE FUNCTION public.set_room_code_on_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF new.room_code IS NULL OR trim(new.room_code) = '' THEN
    new.room_code := public.generate_room_code();
  END IF;
  RETURN new;
END; $$;
DROP TRIGGER IF EXISTS study_rooms_set_room_code ON public.study_rooms;
CREATE TRIGGER study_rooms_set_room_code BEFORE INSERT ON public.study_rooms
  FOR EACH ROW EXECUTE FUNCTION public.set_room_code_on_insert();

-- 4) Perluas role member: tambah 'admin' dan 'moderator'
ALTER TABLE public.study_room_members
  DROP CONSTRAINT IF EXISTS study_room_members_role_check;
ALTER TABLE public.study_room_members
  ADD CONSTRAINT study_room_members_role_check
    CHECK (role IN ('owner','admin','moderator','member'));

-- 5) JOIN REQUESTS untuk room private
CREATE TABLE IF NOT EXISTS public.study_room_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);
CREATE INDEX IF NOT EXISTS study_room_join_requests_room_idx ON public.study_room_join_requests (room_id, status);
DROP TRIGGER IF EXISTS study_room_join_requests_updated_at ON public.study_room_join_requests;
CREATE TRIGGER study_room_join_requests_updated_at BEFORE UPDATE ON public.study_room_join_requests
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 6) MESSAGES (chat)
CREATE TABLE IF NOT EXISTS public.study_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.study_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','file')),
  attachment_path text,
  attachment_name text,
  attachment_size integer,
  attachment_mime text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS study_room_messages_room_created_idx
  ON public.study_room_messages (room_id, created_at);
-- Enable realtime untuk chat
ALTER TABLE public.study_room_messages REPLICA IDENTITY FULL;

-- 7) RLS -----------------------------------------------------------------------
ALTER TABLE public.study_room_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_room_messages ENABLE ROW LEVEL SECURITY;

-- Join requests: user lihat miliknya / owner+admin room lihat semua
DROP POLICY IF EXISTS "join_requests_select" ON public.study_room_join_requests;
CREATE POLICY "join_requests_select" ON public.study_room_join_requests FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.study_room_members srm
      WHERE srm.room_id = study_room_join_requests.room_id
        AND srm.user_id = auth.uid()
        AND srm.role IN ('owner','admin')
    )
  );
DROP POLICY IF EXISTS "join_requests_insert" ON public.study_room_join_requests;
CREATE POLICY "join_requests_insert" ON public.study_room_join_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "join_requests_update_owner_admin" ON public.study_room_join_requests;
CREATE POLICY "join_requests_update_owner_admin" ON public.study_room_join_requests FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_room_members srm
      WHERE srm.room_id = study_room_join_requests.room_id
        AND srm.user_id = auth.uid()
        AND srm.role IN ('owner','admin')
    )
  );

-- Messages: hanya member room yang bisa baca & kirim
DROP POLICY IF EXISTS "messages_select_members" ON public.study_room_messages;
CREATE POLICY "messages_select_members" ON public.study_room_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.study_room_members srm
      WHERE srm.room_id = study_room_messages.room_id
        AND srm.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "messages_insert_members" ON public.study_room_messages;
CREATE POLICY "messages_insert_members" ON public.study_room_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.study_room_members srm
      WHERE srm.room_id = study_room_messages.room_id
        AND srm.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "messages_delete_sender_or_admin" ON public.study_room_messages;
CREATE POLICY "messages_delete_sender_or_admin" ON public.study_room_messages FOR DELETE TO authenticated
  USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM public.study_room_members srm
      WHERE srm.room_id = study_room_messages.room_id
        AND srm.user_id = auth.uid()
        AND srm.role IN ('owner','admin')
    )
  );

-- 8) Storage bucket untuk room attachments (dengan exception guard)
DO $storage$
BEGIN
  BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('room-attachments', 'room-attachments', false)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN others THEN NULL; END;

  BEGIN
    EXECUTE $p$DROP POLICY IF EXISTS "room_attachments_member_upload" ON storage.objects$p$;
    EXECUTE $p$CREATE POLICY "room_attachments_member_upload" ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'room-attachments')$p$;
  EXCEPTION WHEN others THEN NULL; END;

  BEGIN
    EXECUTE $p$DROP POLICY IF EXISTS "room_attachments_member_read" ON storage.objects$p$;
    EXECUTE $p$CREATE POLICY "room_attachments_member_read" ON storage.objects FOR SELECT TO authenticated
      USING (bucket_id = 'room-attachments')$p$;
  EXCEPTION WHEN others THEN NULL; END;
END $storage$;

NOTIFY pgrst, 'reload schema';
