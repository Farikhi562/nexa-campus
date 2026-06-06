-- ============================================================================
-- NEXA Campus — Study Room + Cari Teman (idempotent)
-- ============================================================================

-- ---------- STUDY ROOMS -------------------------------------------------------
create table if not exists public.study_rooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  topic text,
  category text not null default 'umum'
    check (category in ('umum','matematika','fisika','kimia','biologi','informatika',
                        'ekonomi','hukum','kedokteran','bahasa','seni','lainnya')),
  max_members integer not null default 8 check (max_members between 2 and 50),
  current_members_count integer not null default 0,
  status text not null default 'open' check (status in ('open','full','closed')),
  visibility text not null default 'public' check (visibility in ('public','private')),
  scheduled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists study_rooms_status_idx on public.study_rooms (status, visibility);
create index if not exists study_rooms_owner_idx on public.study_rooms (owner_id);

create table if not exists public.study_room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.study_rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  unique(room_id, user_id)
);
create index if not exists study_room_members_user_idx on public.study_room_members (user_id);

-- auto-update member count + status
create or replace function public.update_room_member_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.study_rooms
    set current_members_count = current_members_count + 1,
        status = case
          when status <> 'closed' and (current_members_count + 1) >= max_members then 'full'
          else status end
    where id = new.room_id;
  elsif tg_op = 'DELETE' then
    update public.study_rooms
    set current_members_count = greatest(0, current_members_count - 1),
        status = case
          when status = 'full' and (current_members_count - 1) < max_members then 'open'
          else status end
    where id = old.room_id;
  end if;
  return null;
end; $$;

drop trigger if exists study_room_member_count_trigger on public.study_room_members;
create trigger study_room_member_count_trigger
  after insert or delete on public.study_room_members
  for each row execute function public.update_room_member_count();

drop trigger if exists study_rooms_set_updated_at on public.study_rooms;
create trigger study_rooms_set_updated_at before update on public.study_rooms
  for each row execute procedure public.set_updated_at();

-- ---------- FRIEND REQUESTS ---------------------------------------------------
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friend_no_self_request check (requester_id <> receiver_id),
  unique(requester_id, receiver_id)
);
create index if not exists friend_requests_receiver_idx on public.friend_requests (receiver_id, status);
create index if not exists friend_requests_requester_idx on public.friend_requests (requester_id, status);

drop trigger if exists friend_requests_set_updated_at on public.friend_requests;
create trigger friend_requests_set_updated_at before update on public.friend_requests
  for each row execute procedure public.set_updated_at();

-- ---------- RLS ---------------------------------------------------------------
alter table public.study_rooms enable row level security;
alter table public.study_room_members enable row level security;
alter table public.friend_requests enable row level security;

-- study_rooms
drop policy if exists "study_rooms_select_public" on public.study_rooms;
create policy "study_rooms_select_public" on public.study_rooms
  for select to authenticated
  using (visibility = 'public' or owner_id = auth.uid());

drop policy if exists "study_rooms_insert_own" on public.study_rooms;
create policy "study_rooms_insert_own" on public.study_rooms
  for insert to authenticated with check (auth.uid() = owner_id);

drop policy if exists "study_rooms_update_own" on public.study_rooms;
create policy "study_rooms_update_own" on public.study_rooms
  for update to authenticated using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "study_rooms_delete_own" on public.study_rooms;
create policy "study_rooms_delete_own" on public.study_rooms
  for delete to authenticated using (auth.uid() = owner_id);

-- study_room_members
drop policy if exists "study_room_members_select" on public.study_room_members;
create policy "study_room_members_select" on public.study_room_members
  for select to authenticated
  using (
    user_id = auth.uid() or
    exists (select 1 from public.study_rooms sr where sr.id = room_id and sr.visibility = 'public')
  );

drop policy if exists "study_room_members_insert_own" on public.study_room_members;
create policy "study_room_members_insert_own" on public.study_room_members
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "study_room_members_delete_own" on public.study_room_members;
create policy "study_room_members_delete_own" on public.study_room_members
  for delete to authenticated using (auth.uid() = user_id);

-- profiles: allow reading other public profiles (for friend search)
drop policy if exists "profiles_select_public_safe" on public.profiles;
create policy "profiles_select_public_safe" on public.profiles
  for select to authenticated
  using (coalesce(is_public_profile, true) = true or id = auth.uid());

-- friend_requests
drop policy if exists "friend_requests_select_own" on public.friend_requests;
create policy "friend_requests_select_own" on public.friend_requests
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = receiver_id);

drop policy if exists "friend_requests_insert_own" on public.friend_requests;
create policy "friend_requests_insert_own" on public.friend_requests
  for insert to authenticated with check (auth.uid() = requester_id);

drop policy if exists "friend_requests_update_receiver" on public.friend_requests;
create policy "friend_requests_update_receiver" on public.friend_requests
  for update to authenticated
  using (auth.uid() = receiver_id or auth.uid() = requester_id)
  with check (auth.uid() = receiver_id or auth.uid() = requester_id);

drop policy if exists "friend_requests_delete_requester" on public.friend_requests;
create policy "friend_requests_delete_requester" on public.friend_requests
  for delete to authenticated using (auth.uid() = requester_id);

notify pgrst, 'reload schema';
