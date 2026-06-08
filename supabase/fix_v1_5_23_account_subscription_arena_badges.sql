-- =========================================================
-- NEXA Campus v1.5.23 patch
-- Account delete support, lifetime founder Command, expiring subscriptions,
-- friend count support via query, Arena approved team members, champion badges.
-- Jalankan sekali di Supabase SQL Editor.
-- =========================================================

-- 0) Notification type jangan terlalu kaku. Kalau constraint lama sempit, chat/arena notif bisa gagal.
update public.notifications
set type = 'system'
where type is null or btrim(type) = '';

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (type is not null and btrim(type) <> '');

-- 1) Subscription columns. Plan raw boleh command/pulse, tapi app akan menganggap aktif hanya kalau belum expired.
alter table public.profiles
  add column if not exists plan_expires_at timestamptz,
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists command_expires_at timestamptz,
  add column if not exists subscription_status text not null default 'inactive',
  add column if not exists lifetime_command boolean not null default false,
  add column if not exists founder_verified boolean not null default false,
  add column if not exists badges jsonb not null default '[]'::jsonb;

-- Jangan biarkan status kosong.
update public.profiles
set subscription_status = case
  when lower(coalesce(plan, 'radar')) in ('pulse', 'command')
    and coalesce(plan_expires_at, subscription_expires_at, command_expires_at, pulse_trial_until) > now()
    then 'active'
  when lower(coalesce(plan, 'radar')) in ('pulse', 'command')
    and coalesce(plan_expires_at, subscription_expires_at, command_expires_at, pulse_trial_until) <= now()
    then 'expired'
  else 'inactive'
end
where lifetime_command = false;

-- 2) Founder: Command selamanya + semua badge.
update public.profiles
set
  plan = 'command',
  lifetime_command = true,
  founder_verified = true,
  subscription_status = 'lifetime',
  plan_expires_at = null,
  subscription_expires_at = null,
  command_expires_at = null,
  featured_badge = coalesce(featured_badge, 'nexa_origin'),
  badges = '["rookie","finisher_5","finisher_10","planner_5","planner_20","punctual_3","streak_3","streak_7","daily_1","daily_7","centurion","connector","arena_applicant","arena_creator","weekly_champion","monthly_champion","badge_radar","badge_pulse","premium","finisher_50","punctual_25","streak_30","elite","daily_30","squad","referral_10","badge_command","nexa_origin"]'::jsonb,
  updated_at = now()
where lower(email) = 'fauzanalfa36@gmail.com';

-- 3) Arena team members. Saat applicant diterima, dia masuk daftar tim approved.
create table if not exists public.nexa_arena_team_members (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.nexa_arena_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('creator', 'member')),
  source_application_id uuid references public.nexa_arena_applications(id) on delete set null,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

alter table public.nexa_arena_team_members enable row level security;

drop policy if exists "Arena team members are readable by authenticated" on public.nexa_arena_team_members;
create policy "Arena team members are readable by authenticated"
on public.nexa_arena_team_members
for select
to authenticated
using (true);

drop policy if exists "Arena creator can manage team members" on public.nexa_arena_team_members;
create policy "Arena creator can manage team members"
on public.nexa_arena_team_members
for all
to authenticated
using (
  exists (
    select 1 from public.nexa_arena_posts p
    where p.id = nexa_arena_team_members.post_id
      and p.creator_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.nexa_arena_posts p
    where p.id = nexa_arena_team_members.post_id
      and p.creator_id = auth.uid()
  )
);

-- Backfill creator sebagai anggota tim.
insert into public.nexa_arena_team_members (post_id, user_id, role, joined_at)
select p.id, p.creator_id, 'creator', coalesce(p.created_at, now())
from public.nexa_arena_posts p
on conflict (post_id, user_id) do update set role = 'creator';

-- Backfill applicant yang sudah accepted.
insert into public.nexa_arena_team_members (post_id, user_id, role, source_application_id, joined_at)
select a.post_id, a.applicant_id, 'member', a.id, coalesce(a.reviewed_at, a.updated_at, a.created_at, now())
from public.nexa_arena_applications a
where a.status = 'accepted'
on conflict (post_id, user_id) do nothing;

-- Sinkron current_team_size dari tabel member biar tidak bohong.
update public.nexa_arena_posts p
set
  current_team_size = greatest(1, coalesce(m.member_count, 1)),
  status = case
    when coalesce(m.member_count, 1) >= p.team_size_max then 'full'
    else p.status
  end,
  updated_at = now()
from (
  select post_id, count(*)::int as member_count
  from public.nexa_arena_team_members
  group by post_id
) m
where m.post_id = p.id;

-- 4) Tambah badge Arena/Champion ke user yang sudah memenuhi.
update public.profiles p
set badges = case
  when jsonb_typeof(coalesce(p.badges, '[]'::jsonb)) = 'array'
    then coalesce(p.badges, '[]'::jsonb) || '["arena_creator"]'::jsonb
  else '["arena_creator"]'::jsonb
end
where exists (select 1 from public.nexa_arena_posts ap where ap.creator_id = p.id)
  and not (coalesce(p.badges, '[]'::jsonb) ? 'arena_creator');

update public.profiles p
set badges = case
  when jsonb_typeof(coalesce(p.badges, '[]'::jsonb)) = 'array'
    then coalesce(p.badges, '[]'::jsonb) || '["arena_applicant"]'::jsonb
  else '["arena_applicant"]'::jsonb
end
where exists (select 1 from public.nexa_arena_applications aa where aa.applicant_id = p.id and aa.status = 'accepted')
  and not (coalesce(p.badges, '[]'::jsonb) ? 'arena_applicant');

-- 5) Badge juara mingguan/bulanan untuk rank #1 saat query ini dijalankan.
with weekly_top as (
  select user_id
  from public.get_leaderboard('weekly', 1)
  limit 1
)
update public.profiles p
set badges = case
  when jsonb_typeof(coalesce(p.badges, '[]'::jsonb)) = 'array'
    then coalesce(p.badges, '[]'::jsonb) || '["weekly_champion"]'::jsonb
  else '["weekly_champion"]'::jsonb
end
where p.id in (select user_id from weekly_top)
  and not (coalesce(p.badges, '[]'::jsonb) ? 'weekly_champion');

with monthly_top as (
  select user_id
  from public.get_leaderboard('monthly', 1)
  limit 1
)
update public.profiles p
set badges = case
  when jsonb_typeof(coalesce(p.badges, '[]'::jsonb)) = 'array'
    then coalesce(p.badges, '[]'::jsonb) || '["monthly_champion"]'::jsonb
  else '["monthly_champion"]'::jsonb
end
where p.id in (select user_id from monthly_top)
  and not (coalesce(p.badges, '[]'::jsonb) ? 'monthly_champion');

-- 6) Index ringan.
create index if not exists idx_profiles_subscription_expires_at on public.profiles(subscription_expires_at);
create index if not exists idx_arena_team_members_post on public.nexa_arena_team_members(post_id);
create index if not exists idx_arena_team_members_user on public.nexa_arena_team_members(user_id);

notify pgrst, 'reload schema';
