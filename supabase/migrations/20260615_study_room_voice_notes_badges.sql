-- NEXA Campus v1.6.34
-- Study Room voice notes + 30 new badge catalog.

create extension if not exists pgcrypto;

-- Storage bucket buat VN Study Room.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'study-room-voice-notes',
  'study-room-voice-notes',
  true,
  10485760,
  array['audio/webm', 'audio/ogg', 'audio/mpeg', 'audio/mp4', 'audio/wav']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.study_room_voice_notes (
  id uuid primary key default gen_random_uuid(),
  room_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  file_url text not null,
  duration_seconds integer not null default 0,
  mime_type text not null default 'audio/webm',
  created_at timestamptz not null default now()
);

create index if not exists study_room_voice_notes_room_id_idx on public.study_room_voice_notes(room_id);
create index if not exists study_room_voice_notes_user_id_idx on public.study_room_voice_notes(user_id);
create index if not exists study_room_voice_notes_created_at_idx on public.study_room_voice_notes(created_at desc);

alter table public.study_room_voice_notes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'study_room_voice_notes'
      and policyname = 'Authenticated users can view study room voice notes'
  ) then
    create policy "Authenticated users can view study room voice notes"
      on public.study_room_voice_notes
      for select
      using (auth.uid() is not null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'study_room_voice_notes'
      and policyname = 'Users can insert own study room voice notes'
  ) then
    create policy "Users can insert own study room voice notes"
      on public.study_room_voice_notes
      for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

-- Catalog badge baru. Dibuat table sendiri biar aman kalau project lama punya badges table beda schema.
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

create index if not exists nexa_badge_catalog_rarity_idx on public.nexa_badge_catalog(rarity);
create index if not exists nexa_badge_catalog_category_idx on public.nexa_badge_catalog(category);

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

delete from public.nexa_badge_catalog
where badge_key in (
  'first_deadline','daily_planner','study_rookie','new_friend','quick_add_tryout','notification_ready','profile_complete','arena_spectator','focus_warmup','campus_citizen',
  'deadline_slayer','telegram_linked','study_room_host','five_friends','weekly_summary_reader','arena_player','no_panic_week',
  'ai_scheduler','voice_note_sender','video_call_starter','deadline_commander','arena_badge_hunter','qr_connector',
  'command_user','arena_team_captain','risk_scan_master','semester_survivor',
  'founding_commander','nexa_architect','deadline_myth'
);

insert into public.nexa_badge_catalog (badge_key, name, description, rarity, category, icon, sort_order) values
('first_deadline','Deadline Pertama','Membuat deadline pertama di NEXA.','biasa','deadline','CalendarCheck',1),
('daily_planner','Daily Planner','Membuat 3 deadline dalam satu hari.','biasa','deadline','ListTodo',2),
('study_rookie','Study Rookie','Masuk Study Room pertama kali.','biasa','study_room','Users',3),
('new_friend','Teman Baru','Menambahkan teman pertama.','biasa','social','UserPlus',4),
('quick_add_tryout','Quick Add Tryout','Mencoba Quick Add pertama kali.','biasa','assistant','Sparkles',5),
('notification_ready','Notification Ready','Mengaktifkan notifikasi in-app.','biasa','deadline','Bell',6),
('profile_complete','Profil Rapi','Melengkapi profil akademik.','biasa','social','BadgeCheck',7),
('arena_spectator','Arena Spectator','Membuka NEXA Arena pertama kali.','biasa','arena','Trophy',8),
('focus_warmup','Focus Warmup','Mulai sesi fokus pertama.','biasa','deadline','Timer',9),
('campus_citizen','Campus Citizen','Aktif memakai NEXA Campus selama 3 hari.','biasa','founder','GraduationCap',10),
('deadline_slayer','Deadline Slayer','Menyelesaikan 10 deadline.','langka','deadline','Sword',11),
('telegram_linked','Telegram Linked','Menghubungkan Telegram reminder.','langka','deadline','Send',12),
('study_room_host','Room Host','Membuat Study Room sendiri.','langka','study_room','Crown',13),
('five_friends','Circle Builder','Punya 5 teman di NEXA.','langka','social','UserRoundPlus',14),
('weekly_summary_reader','Summary Reader','Membaca weekly summary pertama.','langka','assistant','Newspaper',15),
('arena_player','Arena Player','Join kompetisi Arena pertama.','langka','arena','Medal',16),
('no_panic_week','No Panic Week','Seminggu tanpa deadline telat.','langka','deadline','ShieldCheck',17),
('ai_scheduler','AI Scheduler','Membuat jadwal eksekusi pakai NEXA Assistant.','epic','assistant','Bot',18),
('voice_note_sender','Voice Note Sender','Mengirim voice note di Study Room.','epic','study_room','Mic',19),
('video_call_starter','Call Starter','Memulai voice/video call Study Room.','epic','study_room','Video',20),
('deadline_commander','Deadline Commander','Menyelesaikan 25 deadline.','epic','deadline','BadgeCheck',21),
('arena_badge_hunter','Badge Hunter','Mendapat 5 badge kompetisi.','epic','arena','Award',22),
('qr_connector','QR Connector','Menambah teman lewat QR code.','epic','social','QrCode',23),
('command_user','Command User','Mengaktifkan NEXA Command.','legend','founder','Zap',24),
('arena_team_captain','Team Captain','Membuat tim di NEXA Arena.','legend','arena','Flag',25),
('risk_scan_master','Risk Scan Master','Menjalankan risk scan deadline 10 kali.','legend','assistant','Radar',26),
('semester_survivor','Semester Survivor','Aktif 30 hari dan tidak telat deadline penting.','legend','deadline','Flame',27),
('founding_commander','Founding Commander','Badge eksklusif founding user Command.','mythos','founder','Gem',28),
('nexa_architect','NEXA Architect','Kontributor awal ekosistem NEXA Campus.','mythos','founder','Network',29),
('deadline_myth','Deadline Myth','Menyelesaikan 100 deadline tanpa telat kritis.','mythos','deadline','Sparkle',30);
