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

alter table public.profiles drop constraint if exists profiles_semester_check;
alter table public.profiles
  add constraint profiles_semester_check check (semester is null or semester between 1 and 14);

alter table public.profiles drop constraint if exists profiles_gender_check;
alter table public.profiles
  add constraint profiles_gender_check check (
    gender is null or gender in ('laki_laki', 'perempuan', 'lainnya', 'tidak_ingin_menyebutkan')
  );

alter table public.profiles drop constraint if exists profiles_reminder_preference_check;
alter table public.profiles
  add constraint profiles_reminder_preference_check
  check (reminder_preference in ('telegram', 'dashboard'));

-- Pastikan semua profil punya referral_code (supaya fitur referral aktif).
update public.profiles
set referral_code = public.generate_profile_referral_code()
where referral_code is null;

-- Reload schema cache PostgREST -> menghilangkan error schema cache.
notify pgrst, 'reload schema';
