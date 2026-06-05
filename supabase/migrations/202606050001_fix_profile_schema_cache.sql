-- ============================================================================
-- FIX: "Could not find the 'campus_name' column of 'profiles' in the schema cache"
-- ----------------------------------------------------------------------------
-- Migration ini memastikan SEMUA kolom profiles yang dipakai aplikasi benar-benar
-- ada di database production, lalu me-reload schema cache PostgREST.
-- Aman dijalankan berkali-kali (idempotent).
-- ============================================================================

alter table public.profiles
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
  add column if not exists referral_code text,
  add column if not exists pulse_trial_until timestamptz,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists deadline_sources text[] not null default '{}',
  add column if not exists reminder_preference text not null default 'dashboard';

-- Rapikan data lama dulu supaya penambahan constraint tidak gagal
-- ("check constraint ... is violated by some row").
update public.profiles
set plan = 'radar'
where plan is null or plan not in ('radar', 'pulse', 'command');

alter table public.profiles alter column plan set default 'radar';
alter table public.profiles alter column plan set not null;

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('radar', 'pulse', 'command'));

update public.profiles
set semester = null
where semester is not null and (semester < 1 or semester > 14);

alter table public.profiles drop constraint if exists profiles_semester_check;
alter table public.profiles
  add constraint profiles_semester_check check (semester is null or semester between 1 and 14);

update public.profiles
set gender = null
where gender is not null
  and gender not in ('laki_laki', 'perempuan', 'lainnya', 'tidak_ingin_menyebutkan');

alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles
  add constraint profiles_gender_check check (
    gender is null or gender in ('laki_laki', 'perempuan', 'lainnya', 'tidak_ingin_menyebutkan')
  );

update public.profiles
set reminder_preference = 'dashboard'
where reminder_preference is null or reminder_preference not in ('telegram', 'dashboard');

alter table public.profiles drop constraint if exists profiles_reminder_preference_check;
alter table public.profiles
  add constraint profiles_reminder_preference_check
  check (reminder_preference in ('telegram', 'dashboard'));

-- Pastikan semua profil punya referral_code (supaya fitur referral aktif).
-- Dijalankan hanya kalau fungsi generator-nya sudah ada (mis. dari schema.sql
-- atau migration referral), supaya migration ini aman dijalankan sendiri.
do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'generate_profile_referral_code'
  ) then
    update public.profiles
    set referral_code = public.generate_profile_referral_code()
    where referral_code is null;
  end if;
end $$;

-- Reload schema cache PostgREST -> menghilangkan error schema cache.
notify pgrst, 'reload schema';
