-- ============================================================================
-- NEXA Campus — FIX NOW (minimal & anti-gagal). Jalankan SEKALI di SQL Editor.
-- Khusus memperbaiki: profiles_plan_check (user baru) + leaderboard belum aktif.
-- Sengaja TANPA bagian storage/policy yang berisiko bikin script di-rollback.
-- Idempotent (aman diulang).
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1) Kolom yang dipakai app (aman kalau sudah ada)
alter table public.profiles
  add column if not exists is_public_profile boolean not null default true,
  add column if not exists avatar_url text;

-- 2) FIX plan: rapikan nilai invalid (mis. 'user') -> 'radar', set default, pasang constraint
alter table public.profiles drop constraint if exists profiles_plan_check;
update public.profiles set plan = 'radar'
where plan is null or plan not in ('radar','pulse','command');
alter table public.profiles alter column plan set default 'radar';
alter table public.profiles add constraint profiles_plan_check check (plan in ('radar','pulse','command'));

-- 3) Trigger user baru -> selalu plan 'radar'
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, plan, profile_completed)
  values (new.id, coalesce(new.email,''),
          coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
          'radar', false)
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4) Leaderboard: tabel poin + fungsi
create table if not exists public.points_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  points integer not null default 0,
  ref text,
  created_at timestamptz not null default now()
);
create index if not exists points_events_user_idx on public.points_events (user_id);
create index if not exists points_events_created_idx on public.points_events (created_at);
create unique index if not exists points_events_unique_ref on public.points_events (user_id, kind, ref) where ref is not null;

alter table public.points_events enable row level security;
drop policy if exists "points_events_select_own" on public.points_events;
create policy "points_events_select_own" on public.points_events
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.award_points(p_kind text, p_points integer, p_ref text default null)
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  insert into public.points_events (user_id, kind, points, ref)
  values (uid, p_kind, greatest(0, coalesce(p_points,0)), p_ref)
  on conflict (user_id, kind, ref) where ref is not null do nothing;
end; $$;
grant execute on function public.award_points(text, integer, text) to authenticated;

create or replace function public.leaderboard_period_start(p_scope text)
returns timestamptz language sql stable as $$
  select case lower(coalesce(p_scope,'all_time'))
    when 'weekly' then date_trunc('week', (now() at time zone 'Asia/Jakarta'))
    when 'monthly' then date_trunc('month', (now() at time zone 'Asia/Jakarta'))
    else '-infinity'::timestamptz end;
$$;

create or replace function public.get_leaderboard(p_scope text default 'all_time', p_limit integer default 100)
returns table (user_id uuid, display_name text, avatar_url text, campus_name text, plan text, points bigint, rank bigint)
language sql security definer set search_path = public as $$
  with period as (select public.leaderboard_period_start(p_scope) as start_at),
  agg as (
    select pe.user_id, sum(pe.points)::bigint as points
    from public.points_events pe, period
    where pe.created_at >= period.start_at group by pe.user_id
  )
  select p.id, coalesce(nullif(trim(p.full_name),''),'Mahasiswa NEXA'), p.avatar_url, p.campus_name,
         coalesce(p.plan,'radar'), coalesce(a.points,0),
         row_number() over (order by coalesce(a.points,0) desc, p.created_at asc)
  from public.profiles p join agg a on a.user_id = p.id
  where coalesce(p.is_public_profile,true) = true and coalesce(a.points,0) > 0
  order by points desc, p.created_at asc
  limit greatest(1, least(coalesce(p_limit,100), 200));
$$;
grant execute on function public.get_leaderboard(text, integer) to authenticated;

create or replace function public.get_my_rank(p_scope text default 'all_time')
returns table (points bigint, rank bigint, total_players bigint, current_streak integer, is_public boolean)
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_start timestamptz := public.leaderboard_period_start(p_scope);
  v_points bigint := 0; v_rank bigint; v_total bigint := 0; v_streak integer := 0; v_public boolean := true;
begin
  if uid is null then return; end if;
  select coalesce(is_public_profile,true) into v_public from public.profiles where id = uid;
  select coalesce(sum(points),0) into v_points from public.points_events where user_id = uid and created_at >= v_start;
  with agg as (select pe.user_id, sum(pe.points)::bigint as pts from public.points_events pe where pe.created_at >= v_start group by pe.user_id),
  public_agg as (select a.user_id, a.pts from agg a join public.profiles p on p.id = a.user_id where coalesce(p.is_public_profile,true)=true and a.pts>0)
  select count(*)+1, (select count(*) from public_agg) into v_rank, v_total from public_agg where pts > v_points;
  with days as (select distinct (created_at at time zone 'Asia/Jakarta')::date as d from public.points_events where user_id=uid and kind='complete_deadline'),
  grouped as (select d, (d - (row_number() over (order by d))::int) as grp from days),
  runs as (select count(*)::int as len, max(d) as last_day from grouped group by grp)
  select coalesce(max(case when last_day >= (now() at time zone 'Asia/Jakarta')::date - 1 then len else 0 end),0) into v_streak from runs;
  points := v_points; rank := case when v_public and v_points>0 then v_rank else null end;
  total_players := v_total; current_streak := v_streak; is_public := v_public; return next;
end; $$;
grant execute on function public.get_my_rank(text) to authenticated;

-- 5) Backfill poin dari deadline yang sudah selesai
insert into public.points_events (user_id, kind, points, ref, created_at)
select user_id, 'complete_deadline', 10, id::text, coalesce(updated_at, now())
from public.academic_deadlines where status = 'completed'
on conflict (user_id, kind, ref) where ref is not null do nothing;

notify pgrst, 'reload schema';
