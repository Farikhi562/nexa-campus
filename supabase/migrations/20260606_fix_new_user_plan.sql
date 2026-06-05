-- ============================================================================
-- FIX TUNTAS: new row for relation "profiles" violates "profiles_plan_check"
-- ----------------------------------------------------------------------------
-- Penyebab: trigger handle_new_user versi lama menyisipkan plan tidak valid
-- (mis. 'user') saat user baru daftar. Migration ini:
--   1) merapikan data lama,
--   2) memastikan default kolom 'radar',
--   3) MENGGANTI trigger handle_new_user supaya selalu insert plan 'radar',
--   4) reload schema cache.
-- Idempotent (aman dijalankan berkali-kali).
-- ============================================================================

-- 1) Rapikan semua plan yang di luar daftar valid (termasuk 'user', NULL, dll.)
alter table public.profiles drop constraint if exists profiles_plan_check;

update public.profiles
set plan = 'radar'
where plan is distinct from 'radar'
  and plan is distinct from 'pulse'
  and plan is distinct from 'command';

-- 2) Default kolom 'radar'
alter table public.profiles alter column plan set default 'radar';

-- 3) Pasang lagi constraint-nya
alter table public.profiles
  add constraint profiles_plan_check check (plan in ('radar', 'pulse', 'command'));

-- 4) Ganti fungsi trigger user baru -> selalu plan 'radar' yang valid
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, plan, profile_completed)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    'radar',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

notify pgrst, 'reload schema';
