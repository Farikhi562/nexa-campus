-- ============================================================================
-- NEXA Campus — 2026-08-08
-- 1) Tabel push_subscriptions (Web Push) — sebelumnya dipakai di
--    src/app/api/push/{subscribe,unsubscribe,test}/route.ts tapi TIDAK PERNAH
--    ada di migration manapun. Tanpa tabel ini, subscribe/test push selalu
--    gagal di database yang baru di-setup dari migrations/schema.sql.
-- 2) Fix reminder_preferences: constraint unique lama cuma di kolom user_id
--    (satu user cuma boleh 1 baris reminder_preferences TOTAL), padahal kode
--    (src/app/api/push/subscribe/route.ts) upsert pakai onConflict
--    'user_id,channel' dengan asumsi 1 baris per kombinasi user+channel.
--    Akibatnya channel 'push' gagal disimpan berdampingan dengan channel
--    'telegram' punya user yang sama. Diganti ke unique (user_id, channel).
--    Sekalian tambah 'push' ke daftar channel yang diperbolehkan.
-- 3) Fix reminder_logs: constraint channel lama cuma ('telegram','whatsapp'),
--    padahal reminder_type/dedup log dipakai juga untuk push. Tambah 'push'.
-- 4) Setting baru: auto-hapus deadline yang tanggalnya sudah lewat, bisa
--    diatur user sendiri di Settings (default OFF, supaya nggak ada yang
--    kehilangan data tanpa sadar).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1) push_subscriptions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx
  ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_subscriptions_all_own" ON public.push_subscriptions;
CREATE POLICY "push_subscriptions_all_own" ON public.push_subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 2) reminder_preferences — unique per (user_id, channel), izinkan channel 'push'
-- ----------------------------------------------------------------------------
ALTER TABLE public.reminder_preferences
  DROP CONSTRAINT IF EXISTS reminder_preferences_user_id_key;

ALTER TABLE public.reminder_preferences
  DROP CONSTRAINT IF EXISTS reminder_preferences_user_id_channel_key;
ALTER TABLE public.reminder_preferences
  ADD CONSTRAINT reminder_preferences_user_id_channel_key UNIQUE (user_id, channel);

ALTER TABLE public.reminder_preferences
  DROP CONSTRAINT IF EXISTS reminder_preferences_channel_check;
ALTER TABLE public.reminder_preferences
  ADD CONSTRAINT reminder_preferences_channel_check
    CHECK (channel IN ('telegram', 'whatsapp', 'email', 'push'));

-- ----------------------------------------------------------------------------
-- 3) reminder_logs — izinkan channel 'push' juga (dipakai untuk dedup kirim)
-- ----------------------------------------------------------------------------
ALTER TABLE public.reminder_logs
  DROP CONSTRAINT IF EXISTS reminder_logs_channel_check;
ALTER TABLE public.reminder_logs
  ADD CONSTRAINT reminder_logs_channel_check
    CHECK (channel IN ('telegram', 'whatsapp', 'push'));

-- ----------------------------------------------------------------------------
-- 4) Auto-hapus deadline yang sudah lewat tanggal (opsional, diatur user)
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auto_delete_expired_deadlines boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS auto_delete_expired_after_days smallint NOT NULL DEFAULT 7;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_auto_delete_expired_after_days_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_auto_delete_expired_after_days_check
    CHECK (auto_delete_expired_after_days BETWEEN 0 AND 60);

NOTIFY pgrst, 'reload schema';
