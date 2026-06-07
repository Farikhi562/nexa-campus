-- Fix leaderboard RPC ambiguity in Supabase/PostgreSQL.
-- Run this in Supabase SQL Editor after deploying the app.
-- Root cause: RETURNS TABLE creates output variables named `points` and `rank`.
-- Any unqualified `points` inside PL/pgSQL or ORDER BY can collide with table columns/aliases.

begin;

-- Remove old overloaded functions so Supabase RPC/PostgREST cannot call a stale version.
drop function if exists public.get_leaderboard();
drop function if exists public.get_leaderboard(text);
drop function if exists public.get_leaderboard(integer);
drop function if exists public.get_leaderboard(text, integer);
drop function if exists public.get_my_rank();
drop function if exists public.get_my_rank(text);

create or replace function public.leaderboard_period_start(p_scope text)
returns timestamptz
language sql
stable
set search_path = public
as $$
  select case lower(coalesce(p_scope, 'all_time'))
    when 'weekly' then (date_trunc('week', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta')::timestamptz
    when 'monthly' then (date_trunc('month', now() at time zone 'Asia/Jakarta') at time zone 'Asia/Jakarta')::timestamptz
    else '-infinity'::timestamptz
  end;
$$;

create or replace function public.get_leaderboard(
  p_scope text default 'all_time',
  p_limit integer default 100
)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  campus_name text,
  plan text,
  points bigint,
  rank bigint
)
language sql
security definer
set search_path = public
as $$
  with period as (
    select public.leaderboard_period_start(p_scope) as start_at
  ),
  agg as (
    select
      pe.user_id,
      coalesce(sum(pe.points), 0)::bigint as total_points
    from public.points_events pe
    cross join period pr
    where pe.created_at >= pr.start_at
    group by pe.user_id
  ),
  ranked as (
    select
      p.id as user_id,
      coalesce(nullif(trim(p.full_name), ''), 'Mahasiswa NEXA')::text as display_name,
      p.avatar_url::text as avatar_url,
      p.campus_name::text as campus_name,
      coalesce(p.plan, 'radar')::text as plan,
      a.total_points as total_points,
      row_number() over (
        order by a.total_points desc, p.created_at asc
      )::bigint as rank_number
    from public.profiles p
    join agg a on a.user_id = p.id
    where coalesce(p.is_public_profile, true) = true
      and a.total_points > 0
  )
  select
    r.user_id,
    r.display_name,
    r.avatar_url,
    r.campus_name,
    r.plan,
    r.total_points as points,
    r.rank_number as rank
  from ranked r
  order by r.total_points desc, r.rank_number asc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

create or replace function public.get_my_rank(p_scope text default 'all_time')
returns table (
  points bigint,
  rank bigint,
  total_players bigint,
  current_streak integer,
  is_public boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_start timestamptz := public.leaderboard_period_start(p_scope);
  v_points bigint := 0;
  v_rank bigint := null;
  v_total_players bigint := 0;
  v_current_streak integer := 0;
  v_is_public boolean := true;
begin
  if v_user_id is null then
    return;
  end if;

  select coalesce(p.is_public_profile, true)
  into v_is_public
  from public.profiles p
  where p.id = v_user_id;

  select coalesce(sum(pe.points), 0)::bigint
  into v_points
  from public.points_events pe
  where pe.user_id = v_user_id
    and pe.created_at >= v_start;

  with agg as (
    select
      pe.user_id,
      coalesce(sum(pe.points), 0)::bigint as total_points
    from public.points_events pe
    where pe.created_at >= v_start
    group by pe.user_id
  ),
  public_agg as (
    select
      a.user_id,
      a.total_points
    from agg a
    join public.profiles p on p.id = a.user_id
    where coalesce(p.is_public_profile, true) = true
      and a.total_points > 0
  )
  select
    count(*) filter (where pa.total_points > v_points) + 1,
    count(*)
  into v_rank, v_total_players
  from public_agg pa;

  with days as (
    select distinct (pe.created_at at time zone 'Asia/Jakarta')::date as activity_date
    from public.points_events pe
    where pe.user_id = v_user_id
      and pe.kind = 'complete_deadline'
  ),
  grouped as (
    select
      d.activity_date,
      d.activity_date - (row_number() over (order by d.activity_date))::int as streak_group
    from days d
  ),
  runs as (
    select
      count(*)::int as run_length,
      max(g.activity_date) as last_day
    from grouped g
    group by g.streak_group
  )
  select coalesce(
    max(
      case
        when r.last_day >= (now() at time zone 'Asia/Jakarta')::date - 1
          then r.run_length
        else 0
      end
    ),
    0
  )
  into v_current_streak
  from runs r;

  points := v_points;
  rank := case when v_is_public and v_points > 0 then v_rank else null end;
  total_players := v_total_players;
  current_streak := v_current_streak;
  is_public := v_is_public;

  return next;
end;
$$;

grant execute on function public.get_leaderboard(text, integer) to anon;
grant execute on function public.get_leaderboard(text, integer) to authenticated;
grant execute on function public.get_my_rank(text) to authenticated;

commit;

notify pgrst, 'reload schema';

-- Smoke test:
-- select * from public.get_leaderboard('all_time', 100);
-- select * from public.get_my_rank('all_time');
