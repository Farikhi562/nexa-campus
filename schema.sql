-- ============================================================================
-- NEXA Campus — MASTER SCHEMA (idempotent / aman dijalankan berkali-kali)
-- ----------------------------------------------------------------------------
-- Cara pakai:
--   1. Buka Supabase Dashboard -> SQL Editor -> New query
--   2. Copy SELURUH isi file ini, paste, lalu klik "Run"
--   3. Tunggu sampai "Success". Tidak perlu jalankan file lain.
--
-- File ini sudah mencakup SEMUA migration (profile fields, referral system,
-- profile photo upload) sehingga error seperti
--   "Could not find the 'campus_name' column of 'profiles' in the schema cache"
-- akan hilang setelah file ini selesai dijalankan.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- TABLE: profiles
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  campus_name text,
  major text,
  semester integer,
  student_id text,
  phone_number text,
  telegram_chat_id text,
  whatsapp_number text,
  plan text not null default 'radar',
  profile_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Self-healing: pastikan SEMUA kolom yang dipakai aplikasi benar-benar ada,
-- walau tabel profiles dibuat dari versi schema yang lebih lama.
alter table public.profiles
  add column if not exists email text,
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
  add column if not exists profile_completed boolean not null default false,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists deadline_sources text[] not null default '{}',
  add column if not exists reminder_preference text not null default 'dashboard',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

-- Constraints (drop dulu biar idempotent)
alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('radar', 'pulse', 'command'));

alter table public.profiles drop constraint if exists profiles_semester_check;
alter table public.profiles
  add constraint profiles_semester_check check (semester is null or semester between 1 and 14);

alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles
  add constraint profiles_gender_check check (
    gender is null or gender in (
      'laki_laki', 'perempuan', 'lainnya', 'tidak_ingin_menyebutkan'
    )
  );

alter table public.profiles drop constraint if exists profiles_reminder_preference_check;
alter table public.profiles
  add constraint profiles_reminder_preference_check
  check (reminder_preference in ('telegram', 'dashboard'));

create unique index if not exists profiles_referral_code_key
  on public.profiles (referral_code)
  where referral_code is not null;

-- ----------------------------------------------------------------------------
-- TABLE: academic_deadlines
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- TABLE: reminder_preferences
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- TABLE: referrals
-- ----------------------------------------------------------------------------
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  rewarded boolean not null default false,
  constraint referrals_no_self_referral check (referrer_id <> referred_id),
  constraint referrals_referred_id_key unique (referred_id)
);

-- ----------------------------------------------------------------------------
-- TABLE: beta_signups
-- ----------------------------------------------------------------------------
create table if not exists public.beta_signups (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  full_name text,
  campus_name text,
  source text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- TABLE: subscription_intents
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- TABLE: reminder_logs
-- ----------------------------------------------------------------------------
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

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- updated_at auto-touch
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
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

-- Referral code generator
create or replace function public.generate_profile_referral_code()
returns text language plpgsql as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.profiles where referral_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.set_profile_referral_code()
returns trigger language plpgsql as $$
begin
  if new.referral_code is null or length(trim(new.referral_code)) = 0 then
    new.referral_code := public.generate_profile_referral_code();
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_set_referral_code on public.profiles;
create trigger profiles_set_referral_code
before insert on public.profiles
for each row execute function public.set_profile_referral_code();

-- Backfill referral code untuk profil yang sudah ada
update public.profiles
set referral_code = public.generate_profile_referral_code()
where referral_code is null;

-- Auto-create profile saat user baru sign up (Google OAuth, dsb.)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
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

-- Batasan tier Radar: maks 5 deadline aktif + reminder dikunci
create or replace function public.enforce_radar_deadline_limit()
returns trigger language plpgsql security definer set search_path = public as $$
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

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.academic_deadlines enable row level security;
alter table public.reminder_preferences enable row level security;
alter table public.referrals enable row level security;
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

drop policy if exists "Users can read own referral records" on public.referrals;
create policy "Users can read own referral records" on public.referrals
for select to authenticated
using (auth.uid() = referrer_id or auth.uid() = referred_id);

drop policy if exists "Users can create own referred referral record" on public.referrals;
create policy "Users can create own referred referral record" on public.referrals
for insert to authenticated
with check (auth.uid() = referred_id);

drop policy if exists "subscription_intents_select_own" on public.subscription_intents;
create policy "subscription_intents_select_own" on public.subscription_intents for select using (auth.uid() = user_id);

drop policy if exists "subscription_intents_insert_own" on public.subscription_intents;
create policy "subscription_intents_insert_own" on public.subscription_intents for insert with check (auth.uid() = user_id);

drop policy if exists "reminder_logs_select_own" on public.reminder_logs;
create policy "reminder_logs_select_own" on public.reminder_logs for select using (auth.uid() = user_id);

drop policy if exists "beta_signups_insert" on public.beta_signups;
create policy "beta_signups_insert" on public.beta_signups for insert with check (true);

-- ============================================================================
-- STORAGE: bucket untuk foto profil
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Profile photos are publicly readable" on storage.objects;
create policy "Profile photos are publicly readable" on storage.objects
for select using (bucket_id = 'profile-photos');

drop policy if exists "Users can upload own profile photos" on storage.objects;
create policy "Users can upload own profile photos" on storage.objects
for insert to authenticated
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update own profile photos" on storage.objects;
create policy "Users can update own profile photos" on storage.objects
for update to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete own profile photos" on storage.objects;
create policy "Users can delete own profile photos" on storage.objects
for delete to authenticated
using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- INDEXES
-- ============================================================================
create index if not exists academic_deadlines_user_due_idx
on public.academic_deadlines (user_id, deadline_date, deadline_time);

create index if not exists subscription_intents_user_created_idx
on public.subscription_intents (user_id, created_at desc);

create index if not exists referrals_referrer_idx
on public.referrals (referrer_id);

-- ============================================================================
-- PENTING: reload schema cache PostgREST
-- Ini yang menghilangkan error "... in the schema cache".
-- ============================================================================
notify pgrst, 'reload schema';
