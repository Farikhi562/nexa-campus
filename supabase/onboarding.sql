alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists deadline_sources text[] not null default '{}',
  add column if not exists reminder_preference text not null default 'dashboard',
  add column if not exists telegram_username text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_reminder_preference_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_reminder_preference_check
      check (reminder_preference in ('telegram', 'dashboard'))
      not valid;
  end if;
end $$;

alter table public.profiles validate constraint profiles_reminder_preference_check;
