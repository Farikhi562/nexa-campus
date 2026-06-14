-- NEXA Campus v1.6.31
-- Plan scope + feature gates + usage limit harian.
-- Radar: free basic, Pulse: productivity, Command: power user.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists plan text not null default 'radar',
  add column if not exists plan_status text not null default 'active',
  add column if not exists plan_started_at timestamptz,
  add column if not exists plan_expires_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_plan_check'
  ) then
    alter table public.profiles
      add constraint profiles_plan_check
      check (plan in ('radar', 'pulse', 'command')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_plan_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_plan_status_check
      check (plan_status in ('active', 'expired', 'cancelled')) not valid;
  end if;
end $$;

create table if not exists public.feature_usage_daily (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature_key text not null,
  usage_date date not null default current_date,
  usage_count integer not null default 0 check (usage_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, feature_key, usage_date)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'feature_usage_daily_feature_key_check'
  ) then
    alter table public.feature_usage_daily
      add constraint feature_usage_daily_feature_key_check
      check (
        feature_key in (
          'dashboard_basic',
          'deadline_basic',
          'deadline_unlimited',
          'quick_add_manual',
          'ai_quick_add',
          'ai_quick_add_save',
          'nexa_assistant_chat',
          'nexa_assistant_actions',
          'in_app_notifications',
          'telegram_notifications',
          'email_notifications',
          'custom_reminders',
          'weekly_summary',
          'study_room_join',
          'study_room_create',
          'study_room_voice_video',
          'friends_search',
          'friends_qr',
          'private_chat',
          'arena_view',
          'arena_join',
          'arena_create_team',
          'arena_team_leaderboard',
          'arena_competition_badges',
          'priority_support'
        )
      ) not valid;
  end if;
end $$;

create index if not exists feature_usage_daily_user_date_idx
  on public.feature_usage_daily(user_id, usage_date desc);

create index if not exists feature_usage_daily_feature_key_idx
  on public.feature_usage_daily(feature_key);

alter table public.feature_usage_daily enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'feature_usage_daily'
      and policyname = 'Users can view own feature usage'
  ) then
    create policy "Users can view own feature usage"
      on public.feature_usage_daily
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

create or replace function public.consume_feature_usage(
  p_user_id uuid,
  p_feature_key text,
  p_limit_count integer default null
)
returns table (
  allowed boolean,
  usage_count integer,
  limit_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  if p_feature_key is null or length(trim(p_feature_key)) = 0 then
    raise exception 'p_feature_key is required';
  end if;

  insert into public.feature_usage_daily (user_id, feature_key, usage_date, usage_count)
  values (p_user_id, p_feature_key, current_date, 0)
  on conflict (user_id, feature_key, usage_date) do nothing;

  select fud.usage_count
    into current_count
  from public.feature_usage_daily fud
  where fud.user_id = p_user_id
    and fud.feature_key = p_feature_key
    and fud.usage_date = current_date
  for update;

  current_count := coalesce(current_count, 0);

  if p_limit_count is not null and current_count >= p_limit_count then
    return query select false, current_count, p_limit_count;
    return;
  end if;

  update public.feature_usage_daily fud
    set usage_count = fud.usage_count + 1,
        updated_at = now()
  where fud.user_id = p_user_id
    and fud.feature_key = p_feature_key
    and fud.usage_date = current_date
  returning fud.usage_count into current_count;

  return query select true, current_count, p_limit_count;
end;
$$;

grant execute on function public.consume_feature_usage(uuid, text, integer) to authenticated;
grant execute on function public.consume_feature_usage(uuid, text, integer) to service_role;

comment on table public.feature_usage_daily is 'Usage limit harian fitur premium: NEXA Assistant, AI Quick Add, dan fitur lain yang perlu dibatasi.';
comment on function public.consume_feature_usage(uuid, text, integer) is 'Atomic increment usage harian. Kalau limit habis, return allowed=false tanpa increment.';
