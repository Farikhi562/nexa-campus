-- ============================================================================
-- NEXA Campus — Notifications + reminder_type untuk dedup
-- ============================================================================

-- Tambah reminder_type ke reminder_logs supaya bisa dedup per H-7/H-3/H-1/day
ALTER TABLE public.reminder_logs
  ADD COLUMN IF NOT EXISTS reminder_type text;

-- Unique index: satu reminder_type per deadline per channel (cegah duplikat kirim)
CREATE UNIQUE INDEX IF NOT EXISTS reminder_logs_unique_send
  ON public.reminder_logs (deadline_id, channel, reminder_type)
  WHERE reminder_type IS NOT NULL AND status = 'sent';

-- Tabel notifikasi in-app (bell di header)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'deadline_reminder','deadline_approaching','friend_request',
    'friend_accepted','room_approved','achievement','system'
  )),
  title text NOT NULL,
  message text,
  link text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id, is_read) WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Enable realtime untuk notifikasi live
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

NOTIFY pgrst, 'reload schema';
