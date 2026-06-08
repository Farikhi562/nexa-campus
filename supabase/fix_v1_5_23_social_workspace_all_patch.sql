-- =========================================================
-- NEXA Campus v1.5.23 Social Workspace ALL Patch
-- Notification Inbox, Weekly Challenge, Friend Suggestion support,
-- Study Room Workspace, Arena Team Workspace, private chat stability.
-- Jalankan sekali di Supabase SQL Editor project production.
-- =========================================================

create extension if not exists "pgcrypto";

-- 1) Notifications lebih fleksibel + read_at untuk inbox
alter table public.notifications
  drop constraint if exists notifications_type_check;

update public.notifications
set type = 'system'
where type is null or btrim(type::text) = '';

alter table public.notifications
  add constraint notifications_type_check
  check (type is not null and btrim(type::text) <> '');

alter table public.notifications
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists read_at timestamptz;

create index if not exists idx_notifications_user_read_created
on public.notifications(user_id, is_read, created_at desc);

-- 2) Private messages table, kalau belum ada
create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  message_type text not null default 'text' check (message_type in ('text', 'emoji', 'image', 'video', 'file')),
  attachment_url text,
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size bigint,
  is_edited boolean not null default false,
  edited_at timestamptz,
  is_deleted boolean not null default false,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint private_messages_content_or_attachment_check
  check (is_deleted = true or content is not null or attachment_url is not null or attachment_path is not null)
);

alter table public.private_messages
  add column if not exists attachment_url text,
  add column if not exists attachment_type text,
  add column if not exists is_edited boolean not null default false,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists deleted_by uuid references public.profiles(id) on delete set null;

create index if not exists idx_private_messages_pair_1 on public.private_messages(sender_id, receiver_id, created_at desc);
create index if not exists idx_private_messages_pair_2 on public.private_messages(receiver_id, sender_id, created_at desc);

alter table public.private_messages enable row level security;

drop policy if exists "Users can read their private messages" on public.private_messages;
create policy "Users can read their private messages"
on public.private_messages for select to authenticated
using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "Users can send private messages" on public.private_messages;
create policy "Users can send private messages"
on public.private_messages for insert to authenticated
with check (auth.uid() = sender_id and receiver_id <> sender_id);

drop policy if exists "Users can update own private messages" on public.private_messages;
create policy "Users can update own private messages"
on public.private_messages for update to authenticated
using (auth.uid() = sender_id)
with check (auth.uid() = sender_id);

drop policy if exists "Users can delete own private messages" on public.private_messages;
create policy "Users can delete own private messages"
on public.private_messages for delete to authenticated
using (auth.uid() = sender_id);

grant select, insert, update, delete on public.private_messages to authenticated;

-- 3) User presence table, kalau belum ada
create table if not exists public.user_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'online' check (status in ('online', 'idle', 'offline')),
  current_path text,
  last_seen_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_presence_last_seen_at on public.user_presence(last_seen_at desc);
alter table public.user_presence enable row level security;

drop policy if exists "Users can read presence" on public.user_presence;
create policy "Users can read presence" on public.user_presence for select to authenticated using (true);

drop policy if exists "Users can insert own presence" on public.user_presence;
create policy "Users can insert own presence" on public.user_presence for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own presence" on public.user_presence;
create policy "Users can update own presence" on public.user_presence for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.user_presence to authenticated;

-- 4) Study Room workspace mini
create table if not exists public.study_room_workspaces (
  room_id uuid primary key references public.study_rooms(id) on delete cascade,
  pinned_note text,
  group_goal text,
  material_link text,
  next_session_at timestamptz,
  checklist jsonb not null default '[]'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.study_room_workspaces enable row level security;

drop policy if exists "Room members can read workspace" on public.study_room_workspaces;
create policy "Room members can read workspace"
on public.study_room_workspaces for select to authenticated
using (
  exists (
    select 1 from public.study_room_members m
    where m.room_id = study_room_workspaces.room_id and m.user_id = auth.uid()
  )
);

drop policy if exists "Room managers can manage workspace" on public.study_room_workspaces;
create policy "Room managers can manage workspace"
on public.study_room_workspaces for all to authenticated
using (
  exists (
    select 1 from public.study_room_members m
    where m.room_id = study_room_workspaces.room_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','moderator')
  )
)
with check (
  exists (
    select 1 from public.study_room_members m
    where m.room_id = study_room_workspaces.room_id
      and m.user_id = auth.uid()
      and m.role in ('owner','admin','moderator')
  )
);

grant select, insert, update, delete on public.study_room_workspaces to authenticated;

-- 5) Arena team workspace setelah applicant diterima
create table if not exists public.nexa_arena_workspaces (
  post_id uuid primary key references public.nexa_arena_posts(id) on delete cascade,
  owner_task text,
  team_status text not null default 'ready' check (team_status in ('ready', 'busy', 'needs_help')),
  checklist jsonb not null default '[]'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.nexa_arena_workspaces enable row level security;

drop policy if exists "Arena team can read workspace" on public.nexa_arena_workspaces;
create policy "Arena team can read workspace"
on public.nexa_arena_workspaces for select to authenticated
using (
  exists (
    select 1 from public.nexa_arena_team_members tm
    where tm.post_id = nexa_arena_workspaces.post_id and tm.user_id = auth.uid()
  )
);

drop policy if exists "Arena creator can manage workspace" on public.nexa_arena_workspaces;
create policy "Arena creator can manage workspace"
on public.nexa_arena_workspaces for all to authenticated
using (
  exists (
    select 1 from public.nexa_arena_posts p
    where p.id = nexa_arena_workspaces.post_id and p.creator_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.nexa_arena_posts p
    where p.id = nexa_arena_workspaces.post_id and p.creator_id = auth.uid()
  )
);

grant select, insert, update, delete on public.nexa_arena_workspaces to authenticated;

-- 6) Storage bucket private chat attachments, kalau belum ada
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'private-chat-attachments',
  'private-chat-attachments',
  true,
  52428800,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','application/pdf','text/plain','application/zip']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Authenticated users can read private chat attachments" on storage.objects;
create policy "Authenticated users can read private chat attachments"
on storage.objects for select to authenticated
using (bucket_id = 'private-chat-attachments');

drop policy if exists "Authenticated users can upload private chat attachments" on storage.objects;
create policy "Authenticated users can upload private chat attachments"
on storage.objects for insert to authenticated
with check (bucket_id = 'private-chat-attachments');

-- 7) Realtime optional
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_object THEN NULL;
END $$;

-- 8) Founder tetap spesial
update public.profiles
set
  plan = 'command',
  lifetime_command = true,
  founder_verified = true,
  subscription_status = 'lifetime',
  featured_badge = coalesce(featured_badge, 'nexa_origin'),
  badges = '[]'::jsonb || '["rookie","finisher_5","finisher_10","planner_5","planner_20","punctual_3","streak_3","streak_7","daily_1","daily_7","centurion","connector","arena_applicant","arena_creator","weekly_champion","monthly_champion","badge_radar","badge_pulse","premium","finisher_50","punctual_25","streak_30","elite","daily_30","squad","referral_10","badge_command","nexa_origin"]'::jsonb,
  updated_at = now()
where lower(email) = 'fauzanalfa36@gmail.com';

notify pgrst, 'reload schema';
