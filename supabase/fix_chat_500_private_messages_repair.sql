-- NEXA Campus v1.5.23 — Chat 500 repair
-- Fix utama untuk GET /api/chats/[friendId]/messages -> 500 karena table private_messages belum ada di schema cache / belum dibuat.
-- Aman di-run ulang di Supabase SQL Editor.

-- 1) Pastikan kolom social privacy & founder flag ada
alter table public.profiles
  add column if not exists founder_verified boolean not null default false,
  add column if not exists dm_privacy text not null default 'friends',
  add column if not exists online_status_visibility text not null default 'friends',
  add column if not exists study_room_presence_visibility text not null default 'members';

update public.profiles
set founder_verified = true,
    updated_at = now()
where lower(coalesce(email, '')) = 'fauzanalfa36@gmail.com';

alter table public.profiles drop constraint if exists profiles_dm_privacy_check;
alter table public.profiles add constraint profiles_dm_privacy_check
  check (dm_privacy in ('friends','none'));

-- 2) Buat table direct/private message yang dipakai API /api/chats/[friendId]/messages
create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text,
  message_type text not null default 'text',
  attachment_path text,
  attachment_name text,
  attachment_size integer,
  attachment_mime text,
  edited_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint private_messages_no_self check (sender_id <> receiver_id)
);

alter table public.private_messages
  add column if not exists content text,
  add column if not exists message_type text not null default 'text',
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_size integer,
  add column if not exists attachment_mime text,
  add column if not exists edited_at timestamptz,
  add column if not exists deleted_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

alter table public.private_messages drop constraint if exists private_messages_message_type_check;
alter table public.private_messages add constraint private_messages_message_type_check
  check (message_type in ('text','image','video','file'));

create index if not exists private_messages_pair_created_idx
  on public.private_messages (sender_id, receiver_id, created_at desc);
create index if not exists private_messages_receiver_created_idx
  on public.private_messages (receiver_id, created_at desc);
create index if not exists private_messages_sender_created_idx
  on public.private_messages (sender_id, created_at desc);

alter table public.private_messages enable row level security;
alter table public.private_messages replica identity full;

drop policy if exists "private_messages_select_participants" on public.private_messages;
create policy "private_messages_select_participants" on public.private_messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

drop policy if exists "private_messages_insert_friends" on public.private_messages;
create policy "private_messages_insert_friends" on public.private_messages
  for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (
      select 1
      from public.friend_requests fr
      join public.profiles receiver_profile on receiver_profile.id = private_messages.receiver_id
      where fr.status = 'accepted'
        and coalesce(receiver_profile.dm_privacy, 'friends') = 'friends'
        and (
          (fr.requester_id = private_messages.sender_id and fr.receiver_id = private_messages.receiver_id)
          or (fr.requester_id = private_messages.receiver_id and fr.receiver_id = private_messages.sender_id)
        )
    )
  );

drop policy if exists "private_messages_update_sender" on public.private_messages;
create policy "private_messages_update_sender" on public.private_messages
  for update to authenticated
  using (auth.uid() = sender_id)
  with check (auth.uid() = sender_id);

drop policy if exists "private_messages_delete_sender" on public.private_messages;
create policy "private_messages_delete_sender" on public.private_messages
  for delete to authenticated
  using (auth.uid() = sender_id);

-- 3) Notifikasi direct message, aman kalau constraint lama ada
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (type in (
  'deadline_reminder','deadline_approaching','friend_request','friend_accepted',
  'room_approved','room_invite','achievement','system','arena_application',
  'arena_accepted','arena_rejected','direct_message'
));

-- 4) Storage bucket attachment chat pribadi
insert into storage.buckets (id, name, public)
values ('private-chat-attachments', 'private-chat-attachments', true)
on conflict (id) do update set public = true;

do $storage$
begin
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

-- 5) Realtime + schema cache
begin;
  do $$
  begin
    begin alter publication supabase_realtime add table public.private_messages; exception when others then null; end;
    begin alter publication supabase_realtime add table public.notifications; exception when others then null; end;
  end $$;
commit;

notify pgrst, 'reload schema';
