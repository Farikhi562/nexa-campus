create extension if not exists "pgcrypto";

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists pulse_trial_until timestamptz;

create unique index if not exists profiles_referral_code_key
  on public.profiles (referral_code)
  where referral_code is not null;

create or replace function public.generate_profile_referral_code()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := upper(substring(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (
      select 1 from public.profiles where referral_code = candidate
    );
  end loop;

  return candidate;
end;
$$;

create or replace function public.set_profile_referral_code()
returns trigger
language plpgsql
as $$
begin
  if new.referral_code is null or length(trim(new.referral_code)) = 0 then
    new.referral_code := public.generate_profile_referral_code();
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_set_referral_code on public.profiles;
create trigger profiles_set_referral_code
before insert on public.profiles
for each row
execute function public.set_profile_referral_code();

update public.profiles
set referral_code = public.generate_profile_referral_code()
where referral_code is null;

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
