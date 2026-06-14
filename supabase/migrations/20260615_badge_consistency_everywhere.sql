-- NEXA Campus v1.6.40
-- Badge consistency everywhere: public profile showcase, owner unlock, and default pinned badges.

create extension if not exists pgcrypto;

create table if not exists public.nexa_user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null,
  source text not null default 'manual',
  is_pinned boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  unlocked_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, badge_key)
);

alter table public.nexa_user_badges
  add column if not exists source text not null default 'manual',
  add column if not exists is_pinned boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists unlocked_at timestamptz not null default now(),
  add column if not exists created_at timestamptz not null default now();

create index if not exists nexa_user_badges_user_idx on public.nexa_user_badges(user_id);
create index if not exists nexa_user_badges_pinned_idx on public.nexa_user_badges(user_id, is_pinned);
create index if not exists nexa_user_badges_key_idx on public.nexa_user_badges(badge_key);

alter table public.nexa_user_badges enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nexa_user_badges'
      and policyname = 'Users can view public badge rows'
  ) then
    create policy "Users can view public badge rows"
      on public.nexa_user_badges
      for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nexa_user_badges'
      and policyname = 'Users can update own pinned badges'
  ) then
    create policy "Users can update own pinned badges"
      on public.nexa_user_badges
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Owner account: unlock all known badges and pin the top showcase ones.
do $$
declare
  owner_id uuid;
  badge_keys text[] := array[
    'first_ping','deadline_newbie','campus_walker','deadline_guard','study_ally','telegram_ready','friend_magnet','focus_keeper','arena_scout','pulse_spark','command_spark',
    'quick_add_beast','ai_scheduler','risk_hunter','reminder_builder','voice_note_caster','video_call_initiator','deadline_streaker','study_room_host','battle_plan_maker','night_owl','anti_telat','arena_contender','team_synergy','summary_reader','focus_grinder','pulse_hexaflame','leaderboard_six_month_king',
    'command_elite','arena_captain','deadline_commander','risk_oracle','campus_titan','command_hexacrown','pulse_year_guardian','command_year_overlord','leaderboard_year_titan','deadline_500_commander',
    'mythos_architect','referral_mythos_100'
  ];
  badge text;
begin
  select id into owner_id from auth.users where lower(email) = lower('fauzanalfa36@gmail.com') limit 1;
  if owner_id is not null then
    foreach badge in array badge_keys loop
      insert into public.nexa_user_badges (user_id, badge_key, source, is_pinned, metadata)
      values (
        owner_id,
        badge,
        'owner_v1_6_40_consistency',
        badge in ('mythos_architect','referral_mythos_100','command_year_overlord','command_hexacrown','deadline_500_commander','leaderboard_year_titan'),
        jsonb_build_object('owner_unlock', true, 'migration', 'v1.6.40')
      )
      on conflict (user_id, badge_key) do update
      set is_pinned = public.nexa_user_badges.is_pinned or excluded.is_pinned,
          metadata = public.nexa_user_badges.metadata || excluded.metadata;
    end loop;
  end if;
end $$;
