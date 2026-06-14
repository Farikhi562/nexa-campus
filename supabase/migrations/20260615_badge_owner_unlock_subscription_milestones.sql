-- NEXA Campus v1.6.39
-- Badge unlock rules + owner all badges + subscription/leaderboard/referral milestones.
-- Fixes:
-- - fauzanalfa36@gmail.com unlocks ALL badges permanently.
-- - Badge yang syaratnya sudah terpenuhi bisa auto-unlock lewat /api/badges/sync atau /api/badges/me.
-- - Adds 10 new milestone badges: Pulse/Command subscription, leaderboard, referral, 500 deadlines.

create extension if not exists pgcrypto;

create table if not exists public.nexa_badge_catalog (
  id uuid primary key default gen_random_uuid(),
  badge_key text not null unique,
  name text not null,
  description text not null,
  rarity text not null check (rarity in ('biasa', 'langka', 'epic', 'legend', 'mythos')),
  category text not null,
  icon text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.nexa_user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_key text not null references public.nexa_badge_catalog(badge_key) on delete cascade,
  source text not null default 'system',
  is_pinned boolean not null default false,
  unlocked_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, badge_key)
);

create table if not exists public.nexa_badge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  metric_key text not null,
  metric_value numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, metric_key)
);

create index if not exists nexa_badge_progress_user_metric_idx on public.nexa_badge_progress(user_id, metric_key);
create index if not exists nexa_user_badges_user_id_idx on public.nexa_user_badges(user_id);
create index if not exists nexa_user_badges_badge_key_idx on public.nexa_user_badges(badge_key);
create index if not exists nexa_user_badges_pinned_public_idx on public.nexa_user_badges(user_id, is_pinned, unlocked_at desc);

alter table public.nexa_badge_catalog enable row level security;
alter table public.nexa_user_badges enable row level security;
alter table public.nexa_badge_progress enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'nexa_badge_catalog' and policyname = 'Anyone can view active NEXA badge catalog'
  ) then
    create policy "Anyone can view active NEXA badge catalog"
      on public.nexa_badge_catalog
      for select
      using (is_active = true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'nexa_user_badges' and policyname = 'Users can view own badges'
  ) then
    create policy "Users can view own badges"
      on public.nexa_user_badges
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'nexa_user_badges' and policyname = 'Anyone can view pinned public profile badges'
  ) then
    create policy "Anyone can view pinned public profile badges"
      on public.nexa_user_badges
      for select
      using (is_pinned = true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'nexa_user_badges' and policyname = 'Users can update own pinned badge visibility'
  ) then
    create policy "Users can update own pinned badge visibility"
      on public.nexa_user_badges
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'nexa_badge_progress' and policyname = 'Users can view own badge progress'
  ) then
    create policy "Users can view own badge progress"
      on public.nexa_badge_progress
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- RPC untuk fitur-fitur lain: panggil ini saat user melakukan aksi.
-- Contoh: select public.bump_nexa_badge_progress('study_room_voice_notes', 1);
create or replace function public.bump_nexa_badge_progress(
  p_metric_key text,
  p_delta numeric default 1,
  p_metadata jsonb default '{}'::jsonb
)
returns public.nexa_badge_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_row public.nexa_badge_progress;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.nexa_badge_progress (user_id, metric_key, metric_value, metadata)
  values (v_user_id, p_metric_key, greatest(coalesce(p_delta, 0), 0), coalesce(p_metadata, '{}'::jsonb))
  on conflict (user_id, metric_key) do update
  set
    metric_value = public.nexa_badge_progress.metric_value + excluded.metric_value,
    metadata = public.nexa_badge_progress.metadata || excluded.metadata || jsonb_build_object('last_bumped_at', now()),
    updated_at = now()
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.bump_nexa_badge_progress(text, numeric, jsonb) to authenticated;

insert into public.nexa_badge_catalog (badge_key, name, description, rarity, category, icon, sort_order, metadata) values
('pulse_spark','Pulse Spark','Pernah support NEXA Pulse minimal satu kali.','langka','billing','💚',31,'{"emoji":"💚","animated":false,"animation_tier":"none","profile_priority":58,"requirement":"Berlangganan NEXA Pulse minimal 1 kali atau punya order Pulse approved."}'::jsonb),
('command_spark','Command Spark','Pernah masuk mode Command minimal satu kali.','langka','billing','👑',32,'{"emoji":"👑","animated":false,"animation_tier":"none","profile_priority":59,"requirement":"Berlangganan NEXA Command minimal 1 kali atau punya order Command approved."}'::jsonb),
('pulse_hexaflame','Pulse Hexaflame','Support Pulse berkali-kali, bukan cuma numpang promo sekali.','epic','billing','💎',33,'{"emoji":"💎","animated":true,"animation_tier":"epic","profile_priority":63,"requirement":"Berlangganan NEXA Pulse minimal 6 kali approved."}'::jsonb),
('leaderboard_six_month_king','Six-Month Rank One','Setengah tahun berturut-turut jadi Top 1 leaderboard.','epic','leaderboard','🥇',34,'{"emoji":"🥇","animated":true,"animation_tier":"epic","profile_priority":65,"requirement":"Top 1 leaderboard selama 6 bulan berturut-turut."}'::jsonb),
('command_hexacrown','Command Hexacrown','Enam kali bayar Command. Ini bukan langganan, ini hubungan serius.','legend','billing','🔱',35,'{"emoji":"🔱","animated":true,"animation_tier":"legend","profile_priority":88,"requirement":"Berlangganan NEXA Command minimal 6 kali approved."}'::jsonb),
('pulse_year_guardian','Pulse Year Guardian','Setahun jagain ritme akademik bareng Pulse.','legend','billing','🟢',36,'{"emoji":"🟢","animated":true,"animation_tier":"legend","profile_priority":84,"requirement":"Berlangganan NEXA Pulse selama 1 tahun atau minimal 12 order Pulse approved."}'::jsonb),
('command_year_overlord','Command Year Overlord','Setahun full di Command. Kalender akademik aja mungkin sungkan.','legend','billing','🏆',37,'{"emoji":"🏆","animated":true,"animation_tier":"legend","profile_priority":90,"requirement":"Berlangganan NEXA Command selama 1 tahun atau minimal 12 order Command approved."}'::jsonb),
('leaderboard_year_titan','Leaderboard Year Titan','Satu tahun eksis di leaderboard. Konsisten yang bikin lawan mikir dua kali.','legend','leaderboard','🏛️',38,'{"emoji":"🏛️","animated":true,"animation_tier":"legend","profile_priority":86,"requirement":"Masuk leaderboard aktif selama 12 bulan."}'::jsonb),
('deadline_500_commander','500 Deadline Commander','Mengelola 500 deadline. Ini kalender atau medan perang, bedanya tipis.','legend','deadline','📚',39,'{"emoji":"📚","animated":true,"animation_tier":"legend","profile_priority":87,"requirement":"Buat/kelola minimal 500 deadline di NEXA."}'::jsonb),
('referral_mythos_100','Referral Singularity','Mengundang 100 user lewat referral. Ini bukan promosi, ini invasi halus.','mythos','referral','🪐',40,'{"emoji":"🪐","animated":true,"animation_tier":"mythos","profile_priority":998,"requirement":"Dapatkan minimal 100 referral valid."}'::jsonb)
on conflict (badge_key) do update
set
  name = excluded.name,
  description = excluded.description,
  rarity = excluded.rarity,
  category = excluded.category,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  metadata = public.nexa_badge_catalog.metadata || excluded.metadata,
  is_active = true,
  updated_at = now();

-- Pastikan owner punya SEMUA badge, bukan cuma mythos doang.
insert into public.nexa_user_badges (user_id, badge_key, source, is_pinned, metadata)
select u.id, c.badge_key, 'owner_all_badges_sql', false, jsonb_build_object('reason', 'owner override v1.6.39')
from auth.users u
cross join public.nexa_badge_catalog c
where lower(u.email) = lower('fauzanalfa36@gmail.com')
on conflict (user_id, badge_key) do update
set source = 'owner_all_badges_sql', metadata = public.nexa_user_badges.metadata || excluded.metadata;

-- Pin 6 badge showcase owner paling tinggi. Semua tetap unlocked, tapi profile nggak jadi pasar malam.
update public.nexa_user_badges b
set is_pinned = false
where b.user_id in (select id from auth.users where lower(email) = lower('fauzanalfa36@gmail.com'));

update public.nexa_user_badges b
set is_pinned = true
where b.user_id in (select id from auth.users where lower(email) = lower('fauzanalfa36@gmail.com'))
  and b.badge_key in ('mythos_architect','referral_mythos_100','command_year_overlord','deadline_500_commander','leaderboard_year_titan','command_elite');

-- Helper function kalau nanti owner email ganti, tinggal call:
-- select public.grant_all_nexa_badges_to_email('email@domain.com');
create or replace function public.grant_all_nexa_badges_to_email(p_email text)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_user_id uuid;
  v_count integer := 0;
begin
  select id into v_user_id from auth.users where lower(email) = lower(p_email) limit 1;
  if v_user_id is null then
    return 0;
  end if;

  insert into public.nexa_user_badges (user_id, badge_key, source, is_pinned, metadata)
  select v_user_id, c.badge_key, 'manual_grant_all', false, jsonb_build_object('granted_by_function_at', now())
  from public.nexa_badge_catalog c
  on conflict (user_id, badge_key) do update
  set source = 'manual_grant_all';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

comment on table public.nexa_badge_progress is 'Progress metric badge. Fitur lain bisa bump metric lalu /api/badges/sync akan unlock badge yang memenuhi syarat.';
comment on function public.bump_nexa_badge_progress(text, numeric, jsonb) is 'Increment progress badge untuk user login. Contoh metric: ai_quick_add_count, study_room_voice_notes, top1_leaderboard_month_streak, referral_count.';
