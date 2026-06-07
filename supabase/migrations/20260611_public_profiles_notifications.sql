-- ============================================================================
-- NEXA Campus v7 — public user profile, profile skills/privacy, friend notifications
-- Jalankan di Supabase SQL Editor setelah deploy file v7.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1) Public profile fields
alter table public.profiles
  add column if not exists public_profile_headline text,
  add column if not exists profile_bio text,
  add column if not exists profile_bio_visibility text not null default 'public',
  add column if not exists profile_skills text[] not null default '{}',
  add column if not exists profile_skills_visibility text not null default 'public',
  add column if not exists profile_interests text[] not null default '{}',
  add column if not exists profile_interests_visibility text not null default 'public',
  add column if not exists portfolio_url text,
  add column if not exists github_url text,
  add column if not exists linkedin_url text,
  add column if not exists featured_badge text;

update public.profiles
set
  profile_bio_visibility = coalesce(nullif(profile_bio_visibility, ''), 'public'),
  profile_skills_visibility = coalesce(nullif(profile_skills_visibility, ''), 'public'),
  profile_interests_visibility = coalesce(nullif(profile_interests_visibility, ''), 'public'),
  profile_skills = coalesce(profile_skills, '{}'),
  profile_interests = coalesce(profile_interests, '{}')
where true;

alter table public.profiles drop constraint if exists profiles_profile_bio_visibility_check;
alter table public.profiles add constraint profiles_profile_bio_visibility_check
  check (profile_bio_visibility in ('public', 'private'));

alter table public.profiles drop constraint if exists profiles_profile_skills_visibility_check;
alter table public.profiles add constraint profiles_profile_skills_visibility_check
  check (profile_skills_visibility in ('public', 'private'));

alter table public.profiles drop constraint if exists profiles_profile_interests_visibility_check;
alter table public.profiles add constraint profiles_profile_interests_visibility_check
  check (profile_interests_visibility in ('public', 'private'));

create index if not exists profiles_profile_skills_gin_idx on public.profiles using gin (profile_skills);
create index if not exists profiles_profile_interests_gin_idx on public.profiles using gin (profile_interests);

-- 2) Profile RLS: owner can edit/read own, authenticated users can read public profiles.
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own_or_public on public.profiles;
create policy profiles_select_own_or_public on public.profiles
  for select to authenticated
  using (auth.uid() = id or coalesce(is_public_profile, true) = true);

drop policy if exists profiles_update_own_profile on public.profiles;
create policy profiles_update_own_profile on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists profiles_insert_own_profile on public.profiles;
create policy profiles_insert_own_profile on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

-- 3) Notifications table + friend request notification support.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (type in (
    'deadline_reminder',
    'deadline_approaching',
    'friend_request',
    'friend_accepted',
    'room_approved',
    'achievement',
    'arena_application',
    'arena_application_accepted',
    'arena_application_rejected',
    'system'
  ));

create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists notifications_user_unread_idx on public.notifications (user_id, is_read) where is_read = false;

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete to authenticated using (auth.uid() = user_id);

-- MVP server route masih memakai session user, jadi perlu insert policy.
-- Kalau nanti sudah full service-role route, policy ini bisa diperketat.
drop policy if exists notifications_insert_authenticated on public.notifications;
create policy notifications_insert_authenticated on public.notifications
  for insert to authenticated with check (auth.uid() is not null);

-- 4) Enable realtime for notification bell if belum masuk publication.
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
exception when undefined_object then
  -- Realtime publication belum ada di environment ini. Aman diabaikan.
  null;
end $$;

notify pgrst, 'reload schema';
