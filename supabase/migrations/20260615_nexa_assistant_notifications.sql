-- NEXA Campus v1.6.24 Batch 3
-- Fokus: NEXA Assistant natural-language deadline, notification center, Telegram engagement.
-- Aman dijalankan berulang untuk bagian ADD COLUMN IF NOT EXISTS.

alter table public.profiles
  add column if not exists nexa_id text,
  add column if not exists telegram_chat_id text;

create unique index if not exists profiles_nexa_id_unique_idx
  on public.profiles (lower(nexa_id))
  where nexa_id is not null;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'general',
  title text not null,
  body text not null,
  url text default '/dashboard',
  channels text[] not null default array['in_app']::text[],
  dedupe_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications (user_id, read_at)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
  on public.notifications
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
  on public.notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Service role tetap bisa insert via API cron/admin. Client biasa jangan insert notif sendiri,
-- nanti semua user mendadak jadi spammer, karena tentu saja manusia begitu.

-- Kalau academic_deadlines belum punya kolom ini, buka komentar sesuai kebutuhan schema kamu.
-- alter table public.academic_deadlines add column if not exists source text default 'manual';
-- alter table public.academic_deadlines add column if not exists reminder_enabled boolean default true;
-- alter table public.academic_deadlines add column if not exists priority text default 'medium';
-- alter table public.academic_deadlines add column if not exists status text default 'pending';
