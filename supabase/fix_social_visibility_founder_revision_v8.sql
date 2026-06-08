-- NEXA Campus v1.5.23 revision patch
-- Tujuan:
-- 1) Toggle "Tampil di leaderboard" hanya mengatur leaderboard, bukan menyembunyikan user dari Cari Teman / Study Room.
-- 2) Founder verified gold untuk fauzanalfa36@gmail.com.
-- 3) Pastikan default sosial tidak terlalu private: nama/NEXA ID tetap bisa tampil, privacy hanya untuk online status dan DM.

alter table public.profiles
  add column if not exists founder_verified boolean not null default false,
  add column if not exists is_public_profile boolean not null default true,
  add column if not exists online_status_visibility text not null default 'friends',
  add column if not exists study_room_presence_visibility text not null default 'members',
  add column if not exists dm_privacy text not null default 'friends';

update public.profiles
set founder_verified = true,
    is_public_profile = true,
    updated_at = now()
where lower(coalesce(email, '')) = 'fauzanalfa36@gmail.com';

update public.profiles
set online_status_visibility = coalesce(nullif(online_status_visibility, ''), 'friends'),
    study_room_presence_visibility = coalesce(nullif(study_room_presence_visibility, ''), 'members'),
    dm_privacy = coalesce(nullif(dm_privacy, ''), 'friends')
where online_status_visibility is null
   or study_room_presence_visibility is null
   or dm_privacy is null
   or online_status_visibility = ''
   or study_room_presence_visibility = ''
   or dm_privacy = '';

alter table public.profiles drop constraint if exists profiles_online_status_visibility_check;
alter table public.profiles add constraint profiles_online_status_visibility_check
  check (online_status_visibility in ('public','friends','private'));

alter table public.profiles drop constraint if exists profiles_study_room_presence_visibility_check;
alter table public.profiles add constraint profiles_study_room_presence_visibility_check
  check (study_room_presence_visibility in ('members','private'));

alter table public.profiles drop constraint if exists profiles_dm_privacy_check;
alter table public.profiles add constraint profiles_dm_privacy_check
  check (dm_privacy in ('friends','none'));

-- Catatan: API route sekarang memakai service role untuk membaca basic identity user
-- lalu tetap menyembunyikan email di response. Jadi jangan lupa env Vercel:
-- SUPABASE_SERVICE_ROLE_KEY

notify pgrst, 'reload schema';
