-- ============================================================================
-- NEXA Campus — SETUP ALL (master, idempotent). Jalankan SEKALI.
-- Supabase Dashboard -> SQL Editor -> paste seluruh file -> Run.
-- Aman dijalankan berkali-kali. Memperbaiki: leaderboard 500, profiles 400,
-- profiles_plan_check, kolom hilang, fungsi leaderboard hilang.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- PROFILES (+ pastikan SEMUA kolom yang dipakai app ada)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists email text not null default '',
  add column if not exists full_name text,
  add column if not exists campus_name text,
  add column if not exists province text,
  add column if not exists major text,
  add column if not exists semester integer,
  add column if not exists gender text,
  add column if not exists avatar_icon text,
  add column if not exists avatar_url text,
  add column if not exists student_id text,
  add column if not exists phone_number text,
  add column if not exists telegram_chat_id text,
  add column if not exists telegram_username text,
  add column if not exists whatsapp_number text,
  add column if not exists plan text not null default 'radar',
  add column if not exists referral_code text,
  add column if not exists pulse_trial_until timestamptz,
  add column if not exists is_public_profile boolean not null default true,
  add column if not exists badges jsonb not null default '[]'::jsonb,
  add column if not exists profile_completed boolean not null default false,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists deadline_sources text[] not null default '{}',
  add column if not exists reminder_preference text not null default 'dashboard',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Rapikan data lama sebelum pasang constraint
update public.profiles set plan = 'radar'
where plan is null or plan not in ('radar', 'pulse', 'command');
update public.profiles set semester = null
where semester is not null and (semester < 1 or semester > 14);
update public.profiles set gender = null
where gender is not null and gender not in ('laki_laki','perempuan','lainnya','tidak_ingin_menyebutkan');
update public.profiles set reminder_preference = 'dashboard'
where reminder_preference is null or reminder_preference not in ('telegram','dashboard');

alter table public.profiles alter column plan set default 'radar';
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('radar','pulse','command'));
alter table public.profiles drop constraint if exists profiles_semester_check;
alter table public.profiles add constraint profiles_semester_check check (semester is null or semester between 1 and 14);
alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles add constraint profiles_gender_check check (gender is null or gender in ('laki_laki','perempuan','lainnya','tidak_ingin_menyebutkan'));
alter table public.profiles drop constraint if exists profiles_reminder_preference_check;
alter table public.profiles add constraint profiles_reminder_preference_check check (reminder_preference in ('telegram','dashboard'));
create unique index if not exists profiles_referral_code_key on public.profiles (referral_code) where referral_code is not null;

-- ----------------------------------------------------------------------------
-- ACADEMIC DEADLINES
-- ----------------------------------------------------------------------------
create table if not exists public.academic_deadlines (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  course_name text not null,
  type text not null check (type in ('tugas','praktikum','kuis','ujian','presentasi','administrasi','pembayaran','organisasi','lainnya')),
  source text not null check (source in ('vclass','ilab','dosen_langsung','grup_wa','praktikum','studentsite','baak','lepkom','lainnya')),
  deadline_date date not null,
  deadline_time time not null,
  campus text not null,
  room text not null,
  location_note text,
  notes text,
  status text not null default 'pending' check (status in ('pending','in_progress','completed','overdue')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  reminder_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists academic_deadlines_user_due_idx on public.academic_deadlines (user_id, deadline_date, deadline_time);

-- ----------------------------------------------------------------------------
-- REMINDER PREFERENCES / REFERRALS / INTENTS / LOGS / BETA
-- ----------------------------------------------------------------------------
create table if not exists public.reminder_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  channel text not null default 'telegram' check (channel in ('telegram','whatsapp')),
  h7_enabled boolean not null default false,
  h3_enabled boolean not null default false,
  h1_enabled boolean not null default true,
  day_enabled boolean not null default true,
  reminder_time time not null default '08:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  rewarded boolean not null default false,
  constraint referrals_no_self_referral check (referrer_id <> referred_id),
  constraint referrals_referred_id_key unique (referred_id)
);

create table if not exists public.subscription_intents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  requested_plan text not null check (requested_plan in ('pulse','command')),
  status text not null default 'pending' check (status in ('pending','confirmed','rejected','cancelled')),
  payment_method text not null default 'qris' check (payment_method in ('manual_transfer','qris')),
  contact_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminder_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  deadline_id uuid references public.academic_deadlines(id) on delete cascade not null,
  channel text not null check (channel in ('telegram','whatsapp')),
  status text not null default 'pending' check (status in ('pending','sent','failed','skipped')),
  provider_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.beta_signups (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  full_name text,
  campus_name text,
  source text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- POINTS EVENTS + PAYMENT ORDERS (leaderboard & Midtrans)
-- ----------------------------------------------------------------------------
create table if not exists public.points_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  points integer not null default 0,
  ref text,
  created_at timestamptz not null default now()
);
create index if not exists points_events_user_idx on public.points_events (user_id);
create index if not exists points_events_created_idx on public.points_events (created_at);
create unique index if not exists points_events_unique_ref on public.points_events (user_id, kind, ref) where ref is not null;

create table if not exists public.payment_orders (
  order_id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('pulse','command')),
  amount integer not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','expired','cancelled')),
  provider text not null default 'midtrans',
  raw_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payment_orders_user_idx on public.payment_orders (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- FUNCTIONS & TRIGGERS
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists academic_deadlines_set_updated_at on public.academic_deadlines;
create trigger academic_deadlines_set_updated_at before update on public.academic_deadlines for each row execute procedure public.set_updated_at();
drop trigger if exists reminder_preferences_set_updated_at on public.reminder_preferences;
create trigger reminder_preferences_set_updated_at before update on public.reminder_preferences for each row execute procedure public.set_updated_at();
drop trigger if exists subscription_intents_set_updated_at on public.subscription_intents;
create trigger subscription_intents_set_updated_at before update on public.subscription_intents for each row execute procedure public.set_updated_at();
drop trigger if exists payment_orders_set_updated_at on public.payment_orders;
create trigger payment_orders_set_updated_at before update on public.payment_orders for each row execute procedure public.set_updated_at();

create or replace function public.generate_profile_referral_code()
returns text language plpgsql as $$
declare candidate text;
begin
  loop
    candidate := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.profiles where referral_code = candidate);
  end loop;
  return candidate;
end; $$;

create or replace function public.set_profile_referral_code()
returns trigger language plpgsql as $$
begin
  if new.referral_code is null or length(trim(new.referral_code)) = 0 then
    new.referral_code := public.generate_profile_referral_code();
  end if;
  return new;
end; $$;
drop trigger if exists profiles_set_referral_code on public.profiles;
create trigger profiles_set_referral_code before insert on public.profiles for each row execute function public.set_profile_referral_code();
update public.profiles set referral_code = public.generate_profile_referral_code() where referral_code is null;

-- User baru -> selalu plan 'radar' (fix profiles_plan_check)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, plan, profile_completed)
  values (new.id, coalesce(new.email,''),
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
          'radar', false)
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Batas tier Radar
create or replace function public.enforce_radar_deadline_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare user_plan text; active_count integer;
begin
  select plan into user_plan from public.profiles where id = new.user_id;
  if user_plan = 'radar' and new.status in ('pending','in_progress','overdue') then
    select count(*) into active_count from public.academic_deadlines
    where user_id = new.user_id and status in ('pending','in_progress','overdue') and id <> coalesce(new.id, uuid_nil());
    if active_count >= 5 then raise exception 'NEXA Radar maksimal 5 active deadlines'; end if;
  end if;
  if user_plan = 'radar' and new.reminder_enabled then raise exception 'Reminder tersedia mulai NEXA Pulse'; end if;
  return new;
end; $$;
drop trigger if exists academic_deadlines_radar_limit on public.academic_deadlines;
create trigger academic_deadlines_radar_limit before insert or update on public.academic_deadlines for each row execute procedure public.enforce_radar_deadline_limit();

-- Poin
create or replace function public.award_points(p_kind text, p_points integer, p_ref text default null)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  insert into public.points_events (user_id, kind, points, ref)
  values (uid, p_kind, greatest(0, coalesce(p_points,0)), p_ref)
  on conflict (user_id, kind, ref) where ref is not null do nothing;
end; $$;
grant execute on function public.award_points(text, integer, text) to authenticated;

create or replace function public.leaderboard_period_start(p_scope text)
returns timestamptz language sql stable as $$
  select case lower(coalesce(p_scope,'all_time'))
    when 'weekly' then date_trunc('week', (now() at time zone 'Asia/Jakarta'))
    when 'monthly' then date_trunc('month', (now() at time zone 'Asia/Jakarta'))
    else '-infinity'::timestamptz end;
$$;

create or replace function public.get_leaderboard(p_scope text default 'all_time', p_limit integer default 100)
returns table (user_id uuid, display_name text, avatar_url text, campus_name text, plan text, points bigint, rank bigint)
language sql security definer set search_path = public as $$
  with period as (select public.leaderboard_period_start(p_scope) as start_at),
  agg as (
    select pe.user_id, sum(pe.points)::bigint as points
    from public.points_events pe, period
    where pe.created_at >= period.start_at
    group by pe.user_id
  )
  select p.id, coalesce(nullif(trim(p.full_name),''),'Mahasiswa NEXA'), p.avatar_url, p.campus_name,
         coalesce(p.plan,'radar'), coalesce(a.points,0),
         row_number() over (order by coalesce(a.points,0) desc, p.created_at asc)
  from public.profiles p
  join agg a on a.user_id = p.id
  where coalesce(p.is_public_profile,true) = true and coalesce(a.points,0) > 0
  order by points desc, p.created_at asc
  limit greatest(1, least(coalesce(p_limit,100), 200));
$$;
grant execute on function public.get_leaderboard(text, integer) to authenticated;

create or replace function public.get_my_rank(p_scope text default 'all_time')
returns table (points bigint, rank bigint, total_players bigint, current_streak integer, is_public boolean)
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_start timestamptz := public.leaderboard_period_start(p_scope);
  v_points bigint := 0; v_rank bigint; v_total bigint := 0; v_streak integer := 0; v_public boolean := true;
begin
  if uid is null then return; end if;
  select coalesce(is_public_profile,true) into v_public from public.profiles where id = uid;
  select coalesce(sum(points),0) into v_points from public.points_events where user_id = uid and created_at >= v_start;
  with agg as (
    select pe.user_id, sum(pe.points)::bigint as pts from public.points_events pe
    where pe.created_at >= v_start group by pe.user_id
  ),
  public_agg as (
    select a.user_id, a.pts from agg a join public.profiles p on p.id = a.user_id
    where coalesce(p.is_public_profile,true) = true and a.pts > 0
  )
  select count(*) + 1, (select count(*) from public_agg) into v_rank, v_total
  from public_agg where pts > v_points;
  with days as (
    select distinct (created_at at time zone 'Asia/Jakarta')::date as d
    from public.points_events where user_id = uid and kind = 'complete_deadline'
  ),
  grouped as (select d, (d - (row_number() over (order by d))::int) as grp from days),
  runs as (select count(*)::int as len, max(d) as last_day from grouped group by grp)
  select coalesce(max(case when last_day >= (now() at time zone 'Asia/Jakarta')::date - 1 then len else 0 end),0)
  into v_streak from runs;
  points := v_points;
  rank := case when v_public and v_points > 0 then v_rank else null end;
  total_players := v_total; current_streak := v_streak; is_public := v_public;
  return next;
end; $$;
grant execute on function public.get_my_rank(text) to authenticated;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.academic_deadlines enable row level security;
alter table public.reminder_preferences enable row level security;
alter table public.referrals enable row level security;
alter table public.subscription_intents enable row level security;
alter table public.reminder_logs enable row level security;
alter table public.beta_signups enable row level security;
alter table public.points_events enable row level security;
alter table public.payment_orders enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "deadlines_all_own" on public.academic_deadlines;
create policy "deadlines_all_own" on public.academic_deadlines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "reminder_preferences_all_own" on public.reminder_preferences;
create policy "reminder_preferences_all_own" on public.reminder_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can read own referral records" on public.referrals;
create policy "Users can read own referral records" on public.referrals for select to authenticated using (auth.uid() = referrer_id or auth.uid() = referred_id);
drop policy if exists "Users can create own referred referral record" on public.referrals;
create policy "Users can create own referred referral record" on public.referrals for insert to authenticated with check (auth.uid() = referred_id);

drop policy if exists "subscription_intents_select_own" on public.subscription_intents;
create policy "subscription_intents_select_own" on public.subscription_intents for select using (auth.uid() = user_id);
drop policy if exists "subscription_intents_insert_own" on public.subscription_intents;
create policy "subscription_intents_insert_own" on public.subscription_intents for insert with check (auth.uid() = user_id);

drop policy if exists "reminder_logs_select_own" on public.reminder_logs;
create policy "reminder_logs_select_own" on public.reminder_logs for select using (auth.uid() = user_id);
drop policy if exists "beta_signups_insert" on public.beta_signups;
create policy "beta_signups_insert" on public.beta_signups for insert with check (true);

drop policy if exists "points_events_select_own" on public.points_events;
create policy "points_events_select_own" on public.points_events for select to authenticated using (auth.uid() = user_id);
drop policy if exists "payment_orders_select_own" on public.payment_orders;
create policy "payment_orders_select_own" on public.payment_orders for select to authenticated using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- STORAGE: bucket foto profil
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('profile-photos','profile-photos',true)
on conflict (id) do update set public = true;
drop policy if exists "Profile photos are publicly readable" on storage.objects;
create policy "Profile photos are publicly readable" on storage.objects for select using (bucket_id = 'profile-photos');
drop policy if exists "Users can upload own profile photos" on storage.objects;
create policy "Users can upload own profile photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can update own profile photos" on storage.objects;
create policy "Users can update own profile photos" on storage.objects for update to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "Users can delete own profile photos" on storage.objects;
create policy "Users can delete own profile photos" on storage.objects for delete to authenticated
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ----------------------------------------------------------------------------
-- BACKFILL poin dari deadline yang sudah selesai
-- ----------------------------------------------------------------------------
insert into public.points_events (user_id, kind, points, ref, created_at)
select user_id, 'complete_deadline', 10, id::text, coalesce(updated_at, now())
from public.academic_deadlines where status = 'completed'
on conflict (user_id, kind, ref) where ref is not null do nothing;
insert into public.points_events (user_id, kind, points, ref, created_at)
select user_id, 'ontime_bonus', 5, id::text, coalesce(updated_at, now())
from public.academic_deadlines
where status = 'completed' and (updated_at at time zone 'Asia/Jakarta')::date <= deadline_date
on conflict (user_id, kind, ref) where ref is not null do nothing;

notify pgrst, 'reload schema';
