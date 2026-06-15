-- ============================================================
-- Web Push Notifications — schema
-- Jalankan di Supabase → SQL Editor. Idempotent.
-- ============================================================

-- 1) Tabel subscription push (1 user bisa punya beberapa device/browser)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists idx_push_subscriptions_user on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

drop policy if exists "Users manage own push subscriptions" on public.push_subscriptions;
create policy "Users manage own push subscriptions"
  on public.push_subscriptions for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.push_subscriptions to authenticated;

-- 2) reminder_preferences: izinkan channel 'push', dan izinkan 1 user punya
--    preference berbeda per channel (sebelumnya unique hanya per user_id,
--    sehingga user cuma bisa pilih 1 channel total).
alter table public.reminder_preferences
  drop constraint if exists reminder_preferences_channel_check;
alter table public.reminder_preferences
  add constraint reminder_preferences_channel_check
  check (channel in ('telegram', 'whatsapp', 'push'));

alter table public.reminder_preferences
  drop constraint if exists reminder_preferences_user_id_key;
alter table public.reminder_preferences
  add constraint reminder_preferences_user_id_channel_key unique (user_id, channel);

-- 3) reminder_logs: izinkan channel 'push' untuk pencatatan & dedup pengiriman.
alter table public.reminder_logs
  drop constraint if exists reminder_logs_channel_check;
alter table public.reminder_logs
  add constraint reminder_logs_channel_check
  check (channel in ('telegram', 'whatsapp', 'push'));
