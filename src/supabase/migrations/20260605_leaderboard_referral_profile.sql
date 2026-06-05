-- ============================================================================
-- NEXA Campus — Leaderboard + Referral + Profile privacy + Payment orders
-- ----------------------------------------------------------------------------
-- Jalankan SETELAH schema.sql. Idempotent (aman dijalankan berkali-kali).
-- Supabase Dashboard -> SQL Editor -> paste semua -> Run.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1) PROFILE: opt-out leaderboard (default TAMPIL)
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_public_profile boolean not null default true;

-- ----------------------------------------------------------------------------
-- 2) REFERRALS (pastikan ada; biasanya sudah dibuat schema.sql)
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
alter table public.referrals enable row level security;
drop policy if exists "Users can read own referral records" on public.referrals;
create policy "Users can read own referral records" on public.referrals
  for select to authenticated using (auth.uid() = referrer_id or auth.uid() = referred_id);
drop policy if exists "Users can create own referred referral record" on public.referrals;
create policy "Users can create own referred referral record" on public.referrals
  for insert to authenticated with check (auth.uid() = referred_id);

-- ----------------------------------------------------------------------------
-- 3) POINTS EVENTS (sumber poin leaderboard, punya timestamp untuk weekly/monthly)
-- ----------------------------------------------------------------------------
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
-- Idempotensi: 1 event per (user, kind, ref) -> tidak bisa double-claim.
create unique index if not exists points_events_unique_ref
  on public.points_events (user_id, kind, ref) where ref is not null;

alter table public.points_events enable row level security;
drop policy if exists "points_events_select_own" on public.points_events;
create policy "points_events_select_own" on public.points_events
  for select to authenticated using (auth.uid() = user_id);
-- Tidak ada policy insert: penulisan hanya lewat fungsi award_points (SECURITY DEFINER).

-- ----------------------------------------------------------------------------
-- 4) FUNCTION: award_points (dipanggil server route via rpc)
-- ----------------------------------------------------------------------------
create or replace function public.award_points(p_kind text, p_points integer, p_ref text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    return;
  end if;
  insert into public.points_events (user_id, kind, points, ref)
  values (uid, p_kind, greatest(0, coalesce(p_points, 0)), p_ref)
  on conflict (user_id, kind, ref) where ref is not null do nothing;
end;
$$;

grant execute on function public.award_points(text, integer, text) to authenticated;

-- ----------------------------------------------------------------------------
-- 5) Helper: batas waktu scope
-- ----------------------------------------------------------------------------
create or replace function public.leaderboard_period_start(p_scope text)
returns timestamptz
language sql
stable
as $$
  select case lower(coalesce(p_scope, 'all_time'))
    when 'weekly' then date_trunc('week', (now() at time zone 'Asia/Jakarta'))
    when 'monthly' then date_trunc('month', (now() at time zone 'Asia/Jakarta'))
    else '-infinity'::timestamptz
  end;
$$;

-- ----------------------------------------------------------------------------
-- 6) FUNCTION: get_leaderboard(scope, limit)
--    Hanya user public (is_public_profile = true). TIDAK pernah expose email.
-- ----------------------------------------------------------------------------
create or replace function public.get_leaderboard(p_scope text default 'all_time', p_limit integer default 100)
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
    select pe.user_id, sum(pe.points)::bigint as points
    from public.points_events pe, period
    where pe.created_at >= period.start_at
    group by pe.user_id
  )
  select
    p.id as user_id,
    coalesce(nullif(trim(p.full_name), ''), 'Mahasiswa NEXA') as display_name,
    p.avatar_url,
    p.campus_name,
    coalesce(p.plan, 'radar') as plan,
    coalesce(a.points, 0) as points,
    row_number() over (order by coalesce(a.points, 0) desc, p.created_at asc) as rank
  from public.profiles p
  join agg a on a.user_id = p.id
  where coalesce(p.is_public_profile, true) = true
    and coalesce(a.points, 0) > 0
  order by points desc, p.created_at asc
  limit greatest(1, least(coalesce(p_limit, 100), 200));
$$;

grant execute on function public.get_leaderboard(text, integer) to authenticated;

-- ----------------------------------------------------------------------------
-- 7) FUNCTION: get_my_rank(scope) — untuk user yang sedang login (termasuk streak)
-- ----------------------------------------------------------------------------
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
  uid uuid := auth.uid();
  v_start timestamptz := public.leaderboard_period_start(p_scope);
  v_points bigint := 0;
  v_rank bigint;
  v_total bigint := 0;
  v_streak integer := 0;
  v_public boolean := true;
begin
  if uid is null then
    return;
  end if;

  select coalesce(is_public_profile, true) into v_public from public.profiles where id = uid;

  select coalesce(sum(points), 0) into v_points
  from public.points_events
  where user_id = uid and created_at >= v_start;

  -- Rank di antara user public (yang punya poin > 0).
  with agg as (
    select pe.user_id, sum(pe.points)::bigint as pts
    from public.points_events pe
    where pe.created_at >= v_start
    group by pe.user_id
  ),
  public_agg as (
    select a.user_id, a.pts
    from agg a
    join public.profiles p on p.id = a.user_id
    where coalesce(p.is_public_profile, true) = true and a.pts > 0
  )
  select count(*) + 1, (select count(*) from public_agg)
  into v_rank, v_total
  from public_agg
  where pts > v_points;

  -- Streak: hari berturut-turut ada penyelesaian deadline (all-time).
  with days as (
    select distinct (created_at at time zone 'Asia/Jakarta')::date as d
    from public.points_events
    where user_id = uid and kind = 'complete_deadline'
  ),
  grouped as (
    select d, (d - (row_number() over (order by d))::int) as grp from days
  ),
  runs as (
    select count(*)::int as len, max(d) as last_day from grouped group by grp
  )
  select coalesce(max(case when last_day >= (now() at time zone 'Asia/Jakarta')::date - 1 then len else 0 end), 0)
  into v_streak
  from runs;

  points := v_points;
  rank := case when v_public and v_points > 0 then v_rank else null end;
  total_players := v_total;
  current_streak := v_streak;
  is_public := v_public;
  return next;
end;
$$;

grant execute on function public.get_my_rank(text) to authenticated;

-- ----------------------------------------------------------------------------
-- 8) PAYMENT ORDERS (Midtrans)
-- ----------------------------------------------------------------------------
create table if not exists public.payment_orders (
  order_id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('pulse', 'command')),
  amount integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired', 'cancelled')),
  provider text not null default 'midtrans',
  raw_status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_orders_user_idx on public.payment_orders (user_id, created_at desc);

alter table public.payment_orders enable row level security;
drop policy if exists "payment_orders_select_own" on public.payment_orders;
create policy "payment_orders_select_own" on public.payment_orders
  for select to authenticated using (auth.uid() = user_id);
-- Insert/update hanya lewat server (service role) -> tidak ada policy untuk user.

drop trigger if exists payment_orders_set_updated_at on public.payment_orders;
create trigger payment_orders_set_updated_at before update on public.payment_orders
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 9) BACKFILL poin dari deadline yang sudah selesai (sekali; idempotent via ref)
-- ----------------------------------------------------------------------------
insert into public.points_events (user_id, kind, points, ref, created_at)
select d.user_id, 'complete_deadline', 10, d.id::text, coalesce(d.updated_at, now())
from public.academic_deadlines d
where d.status = 'completed'
on conflict (user_id, kind, ref) where ref is not null do nothing;

insert into public.points_events (user_id, kind, points, ref, created_at)
select d.user_id, 'ontime_bonus', 5, d.id::text, coalesce(d.updated_at, now())
from public.academic_deadlines d
where d.status = 'completed'
  and (d.updated_at at time zone 'Asia/Jakarta')::date <= d.deadline_date
on conflict (user_id, kind, ref) where ref is not null do nothing;

notify pgrst, 'reload schema';
