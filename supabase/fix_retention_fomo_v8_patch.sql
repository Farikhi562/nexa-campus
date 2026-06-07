-- ============================================================================
-- NEXA Campus v1.5.23 retention patch
-- FOMO sehat, referral reward beneran, badge rarity, dan helper badge JSONB.
-- Aman dijalankan berulang.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Profiles: referral code + badge JSONB
-- ----------------------------------------------------------------------------
alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists badges jsonb not null default '[]'::jsonb,
  add column if not exists featured_badge text;

create unique index if not exists profiles_referral_code_key
  on public.profiles (referral_code)
  where referral_code is not null;

create or replace function public.generate_profile_referral_code()
returns text
language plpgsql
set search_path = public
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.profiles where referral_code = candidate);
  end loop;
  return candidate;
end;
$$;

create or replace function public.set_profile_referral_code()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.referral_code is null or length(trim(new.referral_code)) = 0 then
    new.referral_code := public.generate_profile_referral_code();
  end if;

  if new.badges is null or jsonb_typeof(new.badges) <> 'array' then
    new.badges := '[]'::jsonb;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_referral_code on public.profiles;
create trigger profiles_set_referral_code
before insert on public.profiles
for each row execute function public.set_profile_referral_code();

update public.profiles
set referral_code = public.generate_profile_referral_code()
where referral_code is null or length(trim(referral_code)) = 0;

update public.profiles
set badges = '[]'::jsonb
where badges is null or jsonb_typeof(badges) <> 'array';

create or replace function public.add_profile_badge(p_user_id uuid, p_badge text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_badge is null or length(trim(p_badge)) = 0 then
    return;
  end if;

  update public.profiles p
  set badges = case
    when jsonb_typeof(coalesce(p.badges, '[]'::jsonb)) = 'array'
      then coalesce(p.badges, '[]'::jsonb) || to_jsonb(array[p_badge])
    else to_jsonb(array[p_badge])
  end
  where p.id = p_user_id
    and not (coalesce(p.badges, '[]'::jsonb) ? p_badge);
end;
$$;

grant execute on function public.add_profile_badge(uuid, text) to authenticated;
grant execute on function public.add_profile_badge(uuid, text) to service_role;

-- ----------------------------------------------------------------------------
-- Referrals: reward metadata
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

alter table public.referrals
  add column if not exists rewarded_at timestamptz,
  add column if not exists reward_days integer not null default 30,
  add column if not exists reward_plan text not null default 'pulse',
  add column if not exists source text not null default 'onboarding';

create index if not exists referrals_referrer_idx on public.referrals (referrer_id);
create index if not exists referrals_referred_idx on public.referrals (referred_id);
create index if not exists referrals_rewarded_idx on public.referrals (rewarded);

alter table public.referrals enable row level security;

drop policy if exists "Users can read own referral records" on public.referrals;
create policy "Users can read own referral records"
on public.referrals
for select
to authenticated
using (auth.uid() = referrer_id or auth.uid() = referred_id);

drop policy if exists "Users can create own referred referral record" on public.referrals;
create policy "Users can create own referred referral record"
on public.referrals
for insert
to authenticated
with check (auth.uid() = referred_id);

-- ----------------------------------------------------------------------------
-- Points events: idempotent reward points
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
create unique index if not exists points_events_unique_ref
  on public.points_events (user_id, kind, ref)
  where ref is not null;

alter table public.points_events enable row level security;

drop policy if exists "points_events_select_own" on public.points_events;
create policy "points_events_select_own"
on public.points_events
for select
to authenticated
using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Backfill badge plan dasar + referral milestone dari data existing
-- ----------------------------------------------------------------------------
update public.profiles p
set badges = case when not (coalesce(p.badges, '[]'::jsonb) ? 'badge_radar')
  then coalesce(p.badges, '[]'::jsonb) || '["badge_radar"]'::jsonb
  else coalesce(p.badges, '[]'::jsonb)
end;

update public.profiles p
set badges = coalesce(p.badges, '[]'::jsonb) || '["badge_pulse"]'::jsonb
where p.plan in ('pulse', 'command')
  and not (coalesce(p.badges, '[]'::jsonb) ? 'badge_pulse');

update public.profiles p
set badges = coalesce(p.badges, '[]'::jsonb) || '["badge_command"]'::jsonb
where p.plan = 'command'
  and not (coalesce(p.badges, '[]'::jsonb) ? 'badge_command');

with rewarded_counts as (
  select referrer_id, count(*)::integer as total
  from public.referrals
  where rewarded = true
  group by referrer_id
)
update public.profiles p
set badges = case
  when rc.total >= 25 and not (coalesce(p.badges, '[]'::jsonb) ? 'nexa_origin')
    then coalesce(p.badges, '[]'::jsonb) || '["connector","squad","referral_10","nexa_origin"]'::jsonb
  when rc.total >= 10 and not (coalesce(p.badges, '[]'::jsonb) ? 'referral_10')
    then coalesce(p.badges, '[]'::jsonb) || '["connector","squad","referral_10"]'::jsonb
  when rc.total >= 3 and not (coalesce(p.badges, '[]'::jsonb) ? 'squad')
    then coalesce(p.badges, '[]'::jsonb) || '["connector","squad"]'::jsonb
  when rc.total >= 1 and not (coalesce(p.badges, '[]'::jsonb) ? 'connector')
    then coalesce(p.badges, '[]'::jsonb) || '["connector"]'::jsonb
  else coalesce(p.badges, '[]'::jsonb)
end
from rewarded_counts rc
where p.id = rc.referrer_id;

-- Bersihkan duplikasi JSONB sederhana dari append berulang.
create or replace function public.normalize_profile_badges(p_user_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles p
  set badges = coalesce((
    select jsonb_agg(distinct badge_value)
    from jsonb_array_elements_text(coalesce(p.badges, '[]'::jsonb)) as badge_value
  ), '[]'::jsonb)
  where p.id = p_user_id;
$$;

grant execute on function public.normalize_profile_badges(uuid) to authenticated;
grant execute on function public.normalize_profile_badges(uuid) to service_role;

update public.profiles p
set badges = coalesce((
  select jsonb_agg(distinct badge_value)
  from jsonb_array_elements_text(coalesce(p.badges, '[]'::jsonb)) as badge_value
), '[]'::jsonb);

notify pgrst, 'reload schema';
