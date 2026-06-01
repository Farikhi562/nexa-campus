-- NEXA Campus MVP schema
-- Run in Supabase SQL Editor.

create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  campus_name text,
  major text,
  semester integer check (semester between 1 and 14),
  student_id text,
  phone_number text,
  telegram_chat_id text,
  whatsapp_number text,
  plan text not null default 'radar' check (plan in ('radar', 'pulse', 'command')),
  profile_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.academic_deadlines (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  course_name text not null,
  type text not null check (type in ('tugas', 'praktikum', 'kuis', 'ujian', 'presentasi', 'administrasi', 'pembayaran', 'organisasi', 'lainnya')),
  source text not null check (source in ('vclass', 'ilab', 'dosen_langsung', 'grup_wa', 'praktikum', 'studentsite', 'baak', 'lepkom', 'lainnya')),
  deadline_date date not null,
  deadline_time time not null,
  campus text not null,
  room text not null,
  location_note text,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'overdue')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  reminder_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminder_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  channel text not null default 'telegram' check (channel in ('telegram', 'whatsapp')),
  h7_enabled boolean not null default false,
  h3_enabled boolean not null default false,
  h1_enabled boolean not null default true,
  day_enabled boolean not null default true,
  reminder_time time not null default '08:00',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.beta_signups (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  full_name text,
  campus_name text,
  source text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscription_intents (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  requested_plan text not null check (requested_plan in ('pulse', 'command')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected', 'cancelled')),
  payment_method text not null default 'qris' check (payment_method in ('manual_transfer', 'qris')),
  contact_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminder_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  deadline_id uuid references public.academic_deadlines(id) on delete cascade not null,
  channel text not null check (channel in ('telegram', 'whatsapp')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  provider_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists academic_deadlines_set_updated_at on public.academic_deadlines;
create trigger academic_deadlines_set_updated_at before update on public.academic_deadlines
for each row execute procedure public.set_updated_at();

drop trigger if exists reminder_preferences_set_updated_at on public.reminder_preferences;
create trigger reminder_preferences_set_updated_at before update on public.reminder_preferences
for each row execute procedure public.set_updated_at();

drop trigger if exists subscription_intents_set_updated_at on public.subscription_intents;
create trigger subscription_intents_set_updated_at before update on public.subscription_intents
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, plan, profile_completed)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    'radar',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.enforce_radar_deadline_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_plan text;
  active_count integer;
begin
  select plan into user_plan from public.profiles where id = new.user_id;

  if user_plan = 'radar' and new.status in ('pending', 'in_progress', 'overdue') then
    select count(*) into active_count
    from public.academic_deadlines
    where user_id = new.user_id
      and status in ('pending', 'in_progress', 'overdue')
      and id <> coalesce(new.id, uuid_nil());

    if active_count >= 5 then
      raise exception 'NEXA Radar maksimal 5 active deadlines';
    end if;
  end if;

  if user_plan = 'radar' and new.reminder_enabled then
    raise exception 'Reminder tersedia mulai NEXA Pulse';
  end if;

  return new;
end;
$$;

drop trigger if exists academic_deadlines_radar_limit on public.academic_deadlines;
create trigger academic_deadlines_radar_limit
before insert or update on public.academic_deadlines
for each row execute procedure public.enforce_radar_deadline_limit();

alter table public.profiles enable row level security;
alter table public.academic_deadlines enable row level security;
alter table public.reminder_preferences enable row level security;
alter table public.beta_signups enable row level security;
alter table public.subscription_intents enable row level security;
alter table public.reminder_logs enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "deadlines_select_own" on public.academic_deadlines;
create policy "deadlines_select_own" on public.academic_deadlines for select using (auth.uid() = user_id);

drop policy if exists "deadlines_insert_own" on public.academic_deadlines;
create policy "deadlines_insert_own" on public.academic_deadlines for insert with check (auth.uid() = user_id);

drop policy if exists "deadlines_update_own" on public.academic_deadlines;
create policy "deadlines_update_own" on public.academic_deadlines for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "deadlines_delete_own" on public.academic_deadlines;
create policy "deadlines_delete_own" on public.academic_deadlines for delete using (auth.uid() = user_id);

drop policy if exists "reminder_preferences_all_own" on public.reminder_preferences;
create policy "reminder_preferences_all_own" on public.reminder_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "subscription_intents_select_own" on public.subscription_intents;
create policy "subscription_intents_select_own" on public.subscription_intents for select using (auth.uid() = user_id);

drop policy if exists "subscription_intents_insert_own" on public.subscription_intents;
create policy "subscription_intents_insert_own" on public.subscription_intents for insert with check (auth.uid() = user_id);

drop policy if exists "reminder_logs_select_own" on public.reminder_logs;
create policy "reminder_logs_select_own" on public.reminder_logs for select using (auth.uid() = user_id);

drop policy if exists "beta_signups_insert" on public.beta_signups;
create policy "beta_signups_insert" on public.beta_signups for insert with check (true);

create index if not exists academic_deadlines_user_due_idx
on public.academic_deadlines (user_id, deadline_date, deadline_time);

create index if not exists subscription_intents_user_created_idx
on public.subscription_intents (user_id, created_at desc);
