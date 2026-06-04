alter table public.profiles
  add column if not exists province text,
  add column if not exists gender text,
  add column if not exists avatar_icon text;

alter table public.profiles
  drop constraint if exists profiles_gender_check;

alter table public.profiles
  add constraint profiles_gender_check
  check (
    gender is null or gender in (
      'laki_laki',
      'perempuan',
      'lainnya',
      'tidak_ingin_menyebutkan'
    )
  );
