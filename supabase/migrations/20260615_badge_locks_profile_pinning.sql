-- NEXA Campus v1.6.38
-- Badge locks + profile pin/showcase.
-- Behavior:
-- - Badge yang belum kebuka tampil blur + lock di UI.
-- - Klik badge locked menampilkan syarat unlock.
-- - Klik badge unlocked akan tampil/sembunyi di profile publik.
-- - Maksimal 6 badge pinned/showcase per user.
-- - Badge pinned bisa dibaca publik agar bisa tampil di user profile/user card semua halaman.

create extension if not exists pgcrypto;

alter table public.nexa_badge_catalog
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists is_active boolean not null default true;

alter table public.nexa_user_badges
  add column if not exists is_pinned boolean not null default false,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists nexa_user_badges_pinned_public_idx
  on public.nexa_user_badges(user_id, is_pinned, unlocked_at desc);

alter table public.nexa_badge_catalog enable row level security;
alter table public.nexa_user_badges enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nexa_user_badges'
      and policyname = 'Anyone can view pinned public profile badges'
  ) then
    create policy "Anyone can view pinned public profile badges"
      on public.nexa_user_badges
      for select
      using (is_pinned = true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nexa_user_badges'
      and policyname = 'Users can update own pinned badge visibility'
  ) then
    create policy "Users can update own pinned badge visibility"
      on public.nexa_user_badges
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Requirements metadata, biar database juga ngerti syaratnya. UI utama tetap baca src/lib/badges/catalog.ts biar build cepat.
update public.nexa_badge_catalog
set metadata = metadata || jsonb_build_object(
  'requirement', case badge_key
    when 'first_ping' then 'Login dan buka dashboard pertama kali.'
    when 'deadline_newbie' then 'Buat minimal 1 deadline aktif.'
    when 'campus_walker' then 'Kunjungi minimal 3 halaman dashboard.'
    when 'deadline_guard' then 'Selesaikan 3 deadline sebelum due date.'
    when 'study_ally' then 'Join Study Room dan aktif minimal 1 sesi.'
    when 'telegram_ready' then 'Hubungkan akun Telegram ke NEXA.'
    when 'friend_magnet' then 'Tambah minimal 3 teman.'
    when 'focus_keeper' then 'Selesaikan 3 sesi focus mode.'
    when 'arena_scout' then 'Buka NEXA Arena minimal 1 kali.'
    when 'quick_add_beast' then 'Pakai AI Quick Add minimal 5 kali.'
    when 'ai_scheduler' then 'Buat minimal 3 battle plan dari NEXA Assistant.'
    when 'risk_hunter' then 'Jalankan risk scan minimal 5 kali.'
    when 'reminder_builder' then 'Buat reminder custom minimal 5 kali.'
    when 'voice_note_caster' then 'Kirim 3 voice note di Study Room.'
    when 'video_call_initiator' then 'Mulai 1 video/voice call Study Room sebagai Command user.'
    when 'deadline_streaker' then 'Selesaikan 7 deadline beruntun.'
    when 'study_room_host' then 'Buat 1 Study Room dan undang teman.'
    when 'battle_plan_maker' then 'Generate 5 study battle plan.'
    when 'night_owl' then 'Selesaikan aktivitas produktif setelah jam 21.00 sebanyak 5 kali.'
    when 'anti_telat' then 'Selesaikan 10 deadline sebelum hari-H.'
    when 'arena_contender' then 'Join minimal 1 kompetisi NEXA Arena.'
    when 'team_synergy' then 'Aktif di team workspace minimal 3 hari.'
    when 'summary_reader' then 'Buka weekly summary minimal 1 kali.'
    when 'focus_grinder' then 'Selesaikan 10 sesi focus mode.'
    when 'command_elite' then 'Aktifkan NEXA Command.'
    when 'arena_captain' then 'Buat/pimpin tim NEXA Arena dan aktifkan leaderboard tim.'
    when 'deadline_commander' then 'Selesaikan 25 deadline, minimal 80% sebelum due date.'
    when 'risk_oracle' then 'Jalankan 20 risk scan dan selamatkan 10 deadline high-risk.'
    when 'campus_titan' then 'Aktif 30 hari dan pakai minimal 5 fitur utama NEXA.'
    when 'mythos_architect' then 'Hanya owner/founding architect yang membangun NEXA dari nol dan terdaftar di NEXA_OWNER_EMAILS.'
    else coalesce(metadata->>'requirement', 'Selesaikan aktivitas terkait badge ini.')
  end,
  'public_profile_showcase', true,
  'max_pinned_per_user', 6
)
where badge_key in (
  'first_ping','deadline_newbie','campus_walker','deadline_guard','study_ally','telegram_ready','friend_magnet','focus_keeper','arena_scout','quick_add_beast','ai_scheduler','risk_hunter','reminder_builder','voice_note_caster','video_call_initiator','deadline_streaker','study_room_host','battle_plan_maker','night_owl','anti_telat','arena_contender','team_synergy','summary_reader','focus_grinder','command_elite','arena_captain','deadline_commander','risk_oracle','campus_titan','mythos_architect'
);

-- Command aktif otomatis punya Command Elite, owner bisa pin Mythos via endpoint atau SQL manual.
insert into public.nexa_user_badges (user_id, badge_key, source, is_pinned)
select p.id, 'command_elite', 'auto_plan', true
from public.profiles p
where p.plan = 'command'
  and p.plan_status = 'active'
on conflict (user_id, badge_key) do update
set is_pinned = true;

comment on column public.nexa_user_badges.is_pinned is 'true = badge tampil di profile publik dan bisa dibaca orang lain.';
comment on table public.nexa_user_badges is 'Badge yang sudah dibuka user. Badge locked tidak masuk tabel ini, hanya tampil dari catalog UI.';
