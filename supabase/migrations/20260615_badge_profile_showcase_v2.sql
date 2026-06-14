-- NEXA Campus v1.6.36
-- Badge visual refresh + profile showcase.
-- Rules:
-- - Total 30 badges.
-- - Mythos: 1 badge only, animated highest.
-- - Legend: 5 badges, animated premium.
-- - Epic: 15 badges, animated subtle.
-- - Langka: 6 badges, static but good-looking.
-- - Biasa: 3 badges, emoji/basic.

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

alter table public.nexa_badge_catalog
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists is_active boolean not null default true;

create index if not exists nexa_badge_catalog_rarity_idx on public.nexa_badge_catalog(rarity);
create index if not exists nexa_badge_catalog_category_idx on public.nexa_badge_catalog(category);
create index if not exists nexa_badge_catalog_sort_order_idx on public.nexa_badge_catalog(sort_order);

alter table public.nexa_badge_catalog enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nexa_badge_catalog'
      and policyname = 'Anyone can view active NEXA badge catalog'
  ) then
    create policy "Anyone can view active NEXA badge catalog"
      on public.nexa_badge_catalog
      for select
      using (is_active = true);
  end if;
end $$;

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

create index if not exists nexa_user_badges_user_id_idx on public.nexa_user_badges(user_id);
create index if not exists nexa_user_badges_badge_key_idx on public.nexa_user_badges(badge_key);
create index if not exists nexa_user_badges_pinned_idx on public.nexa_user_badges(user_id, is_pinned, unlocked_at desc);

alter table public.nexa_user_badges enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'nexa_user_badges'
      and policyname = 'Users can view own badges'
  ) then
    create policy "Users can view own badges"
      on public.nexa_user_badges
      for select
      using (auth.uid() = user_id);
  end if;
end $$;

-- Replace old ugly catalog entries with the new v2 keys.
delete from public.nexa_badge_catalog
where badge_key in (
  'first_deadline','daily_planner','study_rookie','new_friend','quick_add_tryout','notification_ready','profile_complete','arena_spectator','focus_warmup','campus_citizen',
  'deadline_slayer','telegram_linked','study_room_host','five_friends','weekly_summary_reader','arena_player','no_panic_week',
  'ai_scheduler','voice_note_sender','video_call_starter','deadline_commander','arena_badge_hunter','qr_connector',
  'command_user','arena_team_captain','risk_scan_master','semester_survivor','founding_commander','nexa_architect','deadline_myth',
  'first_ping','deadline_newbie','campus_walker','deadline_guard','study_ally','telegram_ready','friend_magnet','focus_keeper','arena_scout',
  'quick_add_beast','risk_hunter','reminder_builder','voice_note_caster','video_call_initiator','deadline_streaker','battle_plan_maker','night_owl','anti_telat','arena_contender','team_synergy','summary_reader','focus_grinder',
  'command_elite','arena_captain','risk_oracle','campus_titan','mythos_architect'
);

insert into public.nexa_badge_catalog (badge_key, name, description, rarity, category, icon, sort_order, metadata) values
-- 3 Biasa
('first_ping','First Ping','Pertama kali aktif di NEXA Campus.','biasa','founder','👋',1,'{"emoji":"👋","animated":false,"animation_tier":"none","profile_priority":30}'::jsonb),
('deadline_newbie','Deadline Newbie','Membuat deadline pertama. Bayi deadline telah lahir.','biasa','deadline','📝',2,'{"emoji":"📝","animated":false,"animation_tier":"none","profile_priority":29}'::jsonb),
('campus_walker','Campus Walker','Mulai keliling dashboard tanpa tersesat total.','biasa','focus','🎒',3,'{"emoji":"🎒","animated":false,"animation_tier":"none","profile_priority":28}'::jsonb),

-- 6 Langka static bagus
('deadline_guard','Deadline Guard','Menjaga deadline tetap aman sebelum meledak.','langka','deadline','🛡️',4,'{"emoji":"🛡️","animated":false,"animation_tier":"none","profile_priority":40}'::jsonb),
('study_ally','Study Ally','Aktif di Study Room dan tidak cuma numpang nama.','langka','study_room','🤝',5,'{"emoji":"🤝","animated":false,"animation_tier":"none","profile_priority":39}'::jsonb),
('telegram_ready','Telegram Ready','Menghubungkan Telegram reminder.','langka','notification','📨',6,'{"emoji":"📨","animated":false,"animation_tier":"none","profile_priority":38}'::jsonb),
('friend_magnet','Friend Magnet','Mulai membangun circle akademik.','langka','social','🧲',7,'{"emoji":"🧲","animated":false,"animation_tier":"none","profile_priority":37}'::jsonb),
('focus_keeper','Focus Keeper','Menjaga fokus beberapa sesi tanpa kabur ke scroll random.','langka','focus','🎯',8,'{"emoji":"🎯","animated":false,"animation_tier":"none","profile_priority":36}'::jsonb),
('arena_scout','Arena Scout','Membuka dan mengintip NEXA Arena pertama kali.','langka','arena','🏹',9,'{"emoji":"🏹","animated":false,"animation_tier":"none","profile_priority":35}'::jsonb),

-- 15 Epic animated subtle
('quick_add_beast','Quick Add Beast','Sering input deadline cepat tanpa drama panjang.','epic','deadline','⚡',10,'{"emoji":"⚡","animated":true,"animation_tier":"epic","profile_priority":55}'::jsonb),
('ai_scheduler','AI Scheduler','Membuat jadwal eksekusi pakai NEXA Assistant.','epic','assistant','🤖',11,'{"emoji":"🤖","animated":true,"animation_tier":"epic","profile_priority":54}'::jsonb),
('risk_hunter','Risk Hunter','Menjalankan risk scan sebelum deadline berubah jadi kebakaran.','epic','assistant','📡',12,'{"emoji":"📡","animated":true,"animation_tier":"epic","profile_priority":53}'::jsonb),
('reminder_builder','Reminder Builder','Menyusun reminder yang tidak cuma bunyi pas semuanya telat.','epic','notification','🔔',13,'{"emoji":"🔔","animated":true,"animation_tier":"epic","profile_priority":52}'::jsonb),
('voice_note_caster','Voice Note Caster','Mengirim voice note di Study Room.','epic','study_room','🎙️',14,'{"emoji":"🎙️","animated":true,"animation_tier":"epic","profile_priority":51}'::jsonb),
('video_call_initiator','Call Initiator','Memulai voice/video call Study Room.','epic','study_room','🎥',15,'{"emoji":"🎥","animated":true,"animation_tier":"epic","profile_priority":50}'::jsonb),
('deadline_streaker','Deadline Streaker','Menyelesaikan deadline beruntun tanpa jadi korban panik.','epic','deadline','🔥',16,'{"emoji":"🔥","animated":true,"animation_tier":"epic","profile_priority":49}'::jsonb),
('study_room_host','Room Host','Membuat Study Room sendiri.','epic','study_room','🏠',17,'{"emoji":"🏠","animated":true,"animation_tier":"epic","profile_priority":48}'::jsonb),
('battle_plan_maker','Battle Plan Maker','Membuat rencana belajar yang tidak cuma niat jam 2 pagi.','epic','assistant','🗺️',18,'{"emoji":"🗺️","animated":true,"animation_tier":"epic","profile_priority":47}'::jsonb),
('night_owl','Night Owl','Produktif malam hari tanpa full berubah jadi makhluk goa.','epic','focus','🦉',19,'{"emoji":"🦉","animated":true,"animation_tier":"epic","profile_priority":46}'::jsonb),
('anti_telat','Anti Telat Club','Menyelesaikan tugas sebelum deadline ngancam mental.','epic','deadline','⏱️',20,'{"emoji":"⏱️","animated":true,"animation_tier":"epic","profile_priority":45}'::jsonb),
('arena_contender','Arena Contender','Ikut kompetisi NEXA Arena.','epic','arena','🥊',21,'{"emoji":"🥊","animated":true,"animation_tier":"epic","profile_priority":44}'::jsonb),
('team_synergy','Team Synergy','Aktif dalam tim dan tidak cuma muncul pas menang.','epic','arena','🧩',22,'{"emoji":"🧩","animated":true,"animation_tier":"epic","profile_priority":43}'::jsonb),
('summary_reader','Summary Reader','Membaca weekly summary pertama.','epic','notification','📰',23,'{"emoji":"📰","animated":true,"animation_tier":"epic","profile_priority":42}'::jsonb),
('focus_grinder','Focus Grinder','Menyelesaikan beberapa sesi fokus dengan konsisten.','epic','focus','⚙️',24,'{"emoji":"⚙️","animated":true,"animation_tier":"epic","profile_priority":41}'::jsonb),

-- 5 Legend animated premium
('command_elite','Command Elite','Mengaktifkan NEXA Command dan masuk mode serius.','legend','founder','👑',25,'{"emoji":"👑","animated":true,"animation_tier":"legend","profile_priority":80}'::jsonb),
('arena_captain','Arena Captain','Membuat atau memimpin tim di NEXA Arena.','legend','arena','🚩',26,'{"emoji":"🚩","animated":true,"animation_tier":"legend","profile_priority":79}'::jsonb),
('deadline_commander','Deadline Commander','Menangani banyak deadline tanpa meltdown total.','legend','deadline','⚔️',27,'{"emoji":"⚔️","animated":true,"animation_tier":"legend","profile_priority":78}'::jsonb),
('risk_oracle','Risk Oracle','Ahli membaca deadline berisiko sebelum semuanya gosong.','legend','assistant','🔮',28,'{"emoji":"🔮","animated":true,"animation_tier":"legend","profile_priority":77}'::jsonb),
('campus_titan','Campus Titan','Aktif lama, stabil, dan tidak tumbang oleh kalender akademik.','legend','founder','🏛️',29,'{"emoji":"🏛️","animated":true,"animation_tier":"legend","profile_priority":76}'::jsonb),

-- 1 Mythos only
('mythos_architect','Mythos Architect','Badge Mythos satu-satunya untuk owner/founding architect NEXA.','mythos','founder','🌌',30,'{"emoji":"🌌","animated":true,"animation_tier":"mythos","profile_priority":999}'::jsonb);

-- Auto grant Command badge ke user Command aktif.
insert into public.nexa_user_badges (user_id, badge_key, source, is_pinned)
select p.id, 'command_elite', 'auto_plan', true
from public.profiles p
where p.plan = 'command'
  and p.plan_status = 'active'
on conflict (user_id, badge_key) do update
set is_pinned = true;

comment on table public.nexa_user_badges is 'Badge yang sudah dibuka user dan bisa ditampilkan di profile.';
comment on column public.nexa_badge_catalog.metadata is 'emoji, animated, animation_tier, profile_priority. UI v1.6.36 baca info ini.';
