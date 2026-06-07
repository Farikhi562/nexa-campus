-- NEXA Campus v1.5.23 — Daily Pulse retention layer
-- Tujuan: bikin user punya alasan balik tiap hari tanpa langsung bikin fitur berat.

create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_date date not null,
  mood text check (mood in ('semangat', 'normal', 'capek', 'tertekan')),
  focus_goal text,
  checkin_note text,
  points_awarded integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, activity_date)
);

create index if not exists daily_checkins_user_date_idx
  on public.daily_checkins (user_id, activity_date desc);

alter table public.daily_checkins enable row level security;

drop policy if exists "daily_checkins_select_own" on public.daily_checkins;
create policy "daily_checkins_select_own"
  on public.daily_checkins
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "daily_checkins_insert_own" on public.daily_checkins;
create policy "daily_checkins_insert_own"
  on public.daily_checkins
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "daily_checkins_update_own" on public.daily_checkins;
create policy "daily_checkins_update_own"
  on public.daily_checkins
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists daily_checkins_set_updated_at on public.daily_checkins;
create trigger daily_checkins_set_updated_at
  before update on public.daily_checkins
  for each row execute procedure public.set_updated_at();

-- Pastikan points_events punya unique ref untuk daily_checkin biar refresh tidak farming poin.
create unique index if not exists points_events_unique_ref
  on public.points_events (user_id, kind, ref) where ref is not null;

-- Badge pendukung buat milestone check-in. Disimpan sebagai text supaya tidak bentrok dengan implementasi badge lama.
update public.profiles p
set badges = array(
  select distinct badge
  from unnest(coalesce(p.badges, array[]::text[]) || array['early_builder']) as badge
)
where p.created_at >= now() - interval '30 days'
  and not ('early_builder' = any(coalesce(p.badges, array[]::text[])));

notify pgrst, 'reload schema';
