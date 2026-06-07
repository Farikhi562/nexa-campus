-- ============================================================================
-- NEXA Campus v1.5.23 — Final Social Chat + Privacy Patch
-- Online friends, Study Room presence privacy, direct message, edit/delete media.
-- Idempotent: aman di-run ulang di Supabase SQL Editor.
-- ============================================================================

-- 1) Profile privacy controls -------------------------------------------------
alter table public.profiles
  add column if not exists online_status_visibility text not null default 'friends',
  add column if not exists study_room_presence_visibility text not null default 'members',
  add column if not exists dm_privacy text not null default 'friends';

update public.profiles
set online_status_visibility = coalesce(nullif(online_status_visibility, ''), 'friends'),
    study_room_presence_visibility = coalesce(nullif(study_room_presence_visibility, ''), 'members'),
    dm_privacy = coalesce(nullif(dm_privacy, ''), 'friends');

alter table public.profiles drop constraint if exists profiles_online_status_visibility_check;
alter table public.profiles add constraint profiles_online_status_visibility_check
  check (online_status_visibility in ('public','friends','private'));

alter table public.profiles drop constraint if exists profiles_study_room_presence_visibility_check;
alter table public.profiles add constraint profiles_study_room_presence_visibility_check
  check (study_room_presence_visibility in ('members','private'));

alter table public.profiles drop constraint if exists profiles_dm_privacy_check;
alter table public.profiles add constraint profiles_dm_privacy_check
  check (dm_privacy in ('friends','none'));

-- 2) Global presence heartbeat ------------------------------------------------
create table if not exists public.user_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  current_path text,
  current_room_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists user_presence_last_seen_idx on public.user_presence (last_seen_at desc);
create index if not exists user_presence_current_room_idx on public.user_presence (current_room_id, last_seen_at desc);

drop trigger if exists user_presence_set_updated_at on public.user_presence;
create trigger user_presence_set_updated_at before update on public.user_presence
  for each row execute procedure public.set_updated_at();

alter table public.user_presence enable row level security;

drop policy if exists "presence_upsert_own" on public.user_presence;
create policy "presence_upsert_own" on public.user_presence
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "presence_update_own" on public.user_presence;
create policy "presence_update_own" on public.user_presence
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "presence_select_allowed" on public.user_presence;
create policy "presence_select_allowed" on public.user_presence
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = user_presence.user_id
        and p.online_status_visibility = 'public'
    )
    or exists (
      select 1 from public.friend_requests fr
      join public.profiles p on p.id = user_presence.user_id
      where fr.status = 'accepted'
        and p.online_status_visibility in ('public','friends')
        and (
          (fr.requester_id = auth.uid() and fr.receiver_id = user_presence.user_id)
          or (fr.receiver_id = auth.uid() and fr.requester_id = user_presence.user_id)
        )
    )
  );

alter table public.user_presence replica identity full;

-- 3) Study room messages: video/edit/delete ----------------------------------
alter table public.study_room_messages
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz;

alter table public.study_room_messages drop constraint if exists study_room_messages_message_type_check;
alter table public.study_room_messages add constraint study_room_messages_message_type_check
  check (message_type in ('text','image','video','file'));

drop policy if exists "messages_update_sender" on public.study_room_messages;
create policy "messages_update_sender" on public.study_room_messages
  for update to authenticated
  using (
    auth.uid() = sender_id
    or exists (
      select 1 from public.study_room_members srm
      where srm.room_id = study_room_messages.room_id
        and srm.user_id = auth.uid()
        and srm.role in ('owner','admin','moderator')
    )
  )
  with check (
    auth.uid() = sender_id
    or exists (
      select 1 from public.study_room_members srm
      where srm.room_id = study_room_messages.room_id
        and srm.user_id = auth.uid()
        and srm.role in ('owner','admin','moderator')
    )
  );

alter table public.study_room_messages replica identity full;

-- 4) Direct/private messages --------------------------------------------------
create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  message_type text not null default 'text' check (message_type in ('text','image','video','file')),
  attachment_path text,
  attachment_name text,
  attachment_size integer,
  attachment_mime text,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint private_messages_no_self check (sender_id <> receiver_id)
);
create index if not exists private_messages_pair_created_idx
  on public.private_messages (sender_id, receiver_id, created_at desc);
create index if not exists private_messages_receiver_created_idx
  on public.private_messages (receiver_id, created_at desc);

alter table public.private_messages enable row level security;
alter table public.private_messages replica identity full;

drop policy if exists "private_messages_select_participants" on public.private_messages;
create policy "private_messages_select_participants" on public.private_messages
  for select to authenticated using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "private_messages_insert_friends" on public.private_messages;
create policy "private_messages_insert_friends" on public.private_messages
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.friend_requests fr
      join public.profiles receiver_profile on receiver_profile.id = private_messages.receiver_id
      where fr.status = 'accepted'
        and receiver_profile.dm_privacy = 'friends'
        and (
          (fr.requester_id = private_messages.sender_id and fr.receiver_id = private_messages.receiver_id)
          or (fr.requester_id = private_messages.receiver_id and fr.receiver_id = private_messages.sender_id)
        )
    )
  );

drop policy if exists "private_messages_update_sender" on public.private_messages;
create policy "private_messages_update_sender" on public.private_messages
  for update to authenticated using (auth.uid() = sender_id) with check (auth.uid() = sender_id);

drop policy if exists "private_messages_delete_sender" on public.private_messages;
create policy "private_messages_delete_sender" on public.private_messages
  for delete to authenticated using (auth.uid() = sender_id);

-- 5) Notifications: direct message type --------------------------------------
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'deadline_reminder','deadline_approaching','friend_request','friend_accepted',
  'room_approved','room_invite','achievement','system','arena_application',
  'arena_accepted','arena_rejected','direct_message'
));

-- 6) Storage buckets for media preview ---------------------------------------
do $storage$
begin
  begin
    insert into storage.buckets (id, name, public)
    values ('private-chat-attachments', 'private-chat-attachments', true)
    on conflict (id) do update set public = true;
  exception when others then null; end;

  begin
    update storage.buckets set public = true where id = 'room-attachments';
  exception when others then null; end;

  begin
    execute $p$drop policy if exists "private_chat_upload_own" on storage.objects$p$;
    execute $p$create policy "private_chat_upload_own" on storage.objects for insert to authenticated
      with check (bucket_id = 'private-chat-attachments')$p$;
  exception when others then null; end;

  begin
    execute $p$drop policy if exists "private_chat_read_auth" on storage.objects$p$;
    execute $p$create policy "private_chat_read_auth" on storage.objects for select to authenticated
      using (bucket_id = 'private-chat-attachments')$p$;
  exception when others then null; end;

  begin
    execute $p$drop policy if exists "private_chat_delete_own" on storage.objects$p$;
    execute $p$create policy "private_chat_delete_own" on storage.objects for delete to authenticated
      using (bucket_id = 'private-chat-attachments')$p$;
  exception when others then null; end;
end $storage$;

-- 7) Realtime publication guard ----------------------------------------------
do $$
begin
  begin alter publication supabase_realtime add table public.user_presence; exception when others then null; end;
  begin alter publication supabase_realtime add table public.private_messages; exception when others then null; end;
  begin alter publication supabase_realtime add table public.study_room_messages; exception when others then null; end;
  begin alter publication supabase_realtime add table public.notifications; exception when others then null; end;
end $$;

notify pgrst, 'reload schema';
