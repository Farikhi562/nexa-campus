-- ================================================
-- DIKTAT.AI — Supabase Schema
-- Run this in Supabase SQL Editor (dashboard.supabase.com)
-- ================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ──────────────────────────────────────────────
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text not null,
  full_name     text,
  avatar_url    text,
  jurusan       text,
  universitas   text,
  provinsi      text,
  plan          text not null default 'free' check (plan in ('free','basic','pro')),
  whatsapp_number text,
  profile_completed boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ──────────────────────────────────────────────
-- DOCUMENTS
-- ──────────────────────────────────────────────
create table public.documents (
  id             uuid default uuid_generate_v4() primary key,
  user_id        uuid references public.profiles(id) on delete cascade not null,
  title          text not null,
  file_path      text not null,        -- supabase storage path
  file_url       text,                 -- public/signed url cached
  status         text not null default 'pending'
                   check (status in ('pending','processing','completed','error')),
  error_message  text,
  question_count integer default 0,
  created_at     timestamptz default now()
);

-- ──────────────────────────────────────────────
-- QUESTIONS
-- ──────────────────────────────────────────────
create table public.questions (
  id              uuid default uuid_generate_v4() primary key,
  document_id     uuid references public.documents(id) on delete cascade not null,
  user_id         uuid references public.profiles(id) on delete cascade not null,
  question_text   text not null,
  options         jsonb not null,   -- {"A":"...", "B":"...", "C":"...", "D":"..."}
  correct_answer  text not null,    -- "A" | "B" | "C" | "D"
  explanation     text,
  order_index     integer,
  created_at      timestamptz default now()
);

-- ──────────────────────────────────────────────
-- EXAM SESSIONS
-- ──────────────────────────────────────────────
create table public.exam_sessions (
  id                   uuid default uuid_generate_v4() primary key,
  user_id              uuid references public.profiles(id) on delete cascade not null,
  document_id          uuid references public.documents(id) on delete set null,
  study_room_id        uuid,          -- filled if part of a study room session
  score                integer,       -- 0-100
  total_questions      integer not null default 0,
  correct_count        integer default 0,
  time_taken_seconds   integer,
  status               text not null default 'in_progress'
                         check (status in ('in_progress','completed')),
  started_at           timestamptz default now(),
  completed_at         timestamptz
);

-- ──────────────────────────────────────────────
-- SESSION ANSWERS
-- ──────────────────────────────────────────────
create table public.session_answers (
  id               uuid default uuid_generate_v4() primary key,
  session_id       uuid references public.exam_sessions(id) on delete cascade not null,
  question_id      uuid references public.questions(id) on delete cascade not null,
  selected_answer  text,           -- null = skipped
  is_correct       boolean,
  created_at       timestamptz default now()
);

-- ──────────────────────────────────────────────
-- STUDY ROOMS
-- ──────────────────────────────────────────────
create table public.study_rooms (
  id           uuid default uuid_generate_v4() primary key,
  creator_id   uuid references public.profiles(id) on delete cascade not null,
  document_id  uuid references public.documents(id) on delete set null,
  room_code    text unique not null,   -- 6-char alphanumeric
  title        text not null,
  is_active    boolean default true,
  created_at   timestamptz default now(),
  expires_at   timestamptz default (now() + interval '24 hours')
);

-- ──────────────────────────────────────────────
-- ROOM PARTICIPANTS
-- ──────────────────────────────────────────────
create table public.room_participants (
  id          uuid default uuid_generate_v4() primary key,
  room_id     uuid references public.study_rooms(id) on delete cascade not null,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  session_id  uuid references public.exam_sessions(id) on delete set null,
  joined_at   timestamptz default now(),
  unique (room_id, user_id)
);

-- ──────────────────────────────────────────────
-- SCHEDULES (WhatsApp Reminder — Pro feature)
-- ──────────────────────────────────────────────
create table public.schedules (
  id                  uuid default uuid_generate_v4() primary key,
  user_id             uuid references public.profiles(id) on delete cascade not null,
  document_id         uuid references public.documents(id) on delete set null,
  subject_name        text not null,
  exam_date           date not null,
  exam_time           time,
  whatsapp_number     text not null,
  reminder_sent_h3    boolean default false,
  reminder_sent_h1    boolean default false,
  reminder_sent_h0    boolean default false,
  created_at          timestamptz default now()
);

-- ──────────────────────────────────────────────
-- MARKETPLACE LISTINGS
-- ──────────────────────────────────────────────
create table if not exists public.marketplace_listings (
  id uuid default uuid_generate_v4() primary key,
  seller_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('barang', 'jasa')),
  title text not null,
  description text not null,
  category text not null,
  price_amount integer,
  price_label text,
  campus text,
  location text,
  contact_whatsapp text,
  image_url text,
  status text not null default 'active'
    check (status in ('draft', 'pending', 'active', 'sold', 'archived', 'rejected')),
  is_verified boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists marketplace_listings_status_created_idx
  on public.marketplace_listings (status, created_at desc);
create index if not exists marketplace_listings_seller_idx
  on public.marketplace_listings (seller_id);
create index if not exists marketplace_listings_type_idx
  on public.marketplace_listings (type);

-- ══════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════════
alter table public.profiles          enable row level security;
alter table public.documents         enable row level security;
alter table public.questions         enable row level security;
alter table public.exam_sessions     enable row level security;
alter table public.session_answers   enable row level security;
alter table public.study_rooms       enable row level security;
alter table public.room_participants enable row level security;
alter table public.schedules         enable row level security;
alter table public.marketplace_listings enable row level security;

-- profiles
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- documents
create policy "own docs select" on public.documents for select using (auth.uid() = user_id);
create policy "own docs insert" on public.documents for insert with check (auth.uid() = user_id);
create policy "own docs update" on public.documents for update using (auth.uid() = user_id);
create policy "own docs delete" on public.documents for delete using (auth.uid() = user_id);

-- questions
create policy "own questions select" on public.questions for select using (auth.uid() = user_id);
create policy "own questions insert" on public.questions for insert with check (auth.uid() = user_id);

-- exam_sessions
create policy "own sessions select" on public.exam_sessions for select using (auth.uid() = user_id);
create policy "own sessions insert" on public.exam_sessions for insert with check (auth.uid() = user_id);
create policy "own sessions update" on public.exam_sessions for update using (auth.uid() = user_id);

-- session_answers (via session ownership)
create policy "own answers select" on public.session_answers for select using (
  session_id in (select id from public.exam_sessions where user_id = auth.uid())
);
create policy "own answers insert" on public.session_answers for insert with check (
  session_id in (select id from public.exam_sessions where user_id = auth.uid())
);

create or replace function public.is_room_participant(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_participants
    where room_id = p_room_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_room_creator(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.study_rooms
    where id = p_room_id
      and creator_id = auth.uid()
  );
$$;

-- study_rooms
create policy "rooms read own or joined" on public.study_rooms for select using (
  creator_id = auth.uid()
  or public.is_room_participant(id)
);
create policy "rooms insert" on public.study_rooms for insert with check (auth.uid() = creator_id);
create policy "rooms update" on public.study_rooms for update using (auth.uid() = creator_id);

-- room_participants
create policy "participants read same room" on public.room_participants for select using (
  user_id = auth.uid()
  or public.is_room_creator(room_id)
);
create policy "participants insert" on public.room_participants for insert with check (auth.uid() = user_id);
create policy "participants update" on public.room_participants for update using (auth.uid() = user_id);

-- schedules
create policy "own schedules" on public.schedules for all using (auth.uid() = user_id);

-- marketplace_listings
create policy "active listings readable by auth users"
on public.marketplace_listings for select
using (auth.role() = 'authenticated' and status = 'active');

create policy "seller can read own listings"
on public.marketplace_listings for select
using (auth.uid() = seller_id);

create policy "paid users can create listings"
on public.marketplace_listings for insert
with check (
  auth.uid() = seller_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.plan in ('basic', 'pro')
  )
);

create policy "paid sellers can update own listings"
on public.marketplace_listings for update
using (
  auth.uid() = seller_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.plan in ('basic', 'pro')
  )
)
with check (
  auth.uid() = seller_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.plan in ('basic', 'pro')
  )
);

create policy "paid sellers can delete own listings"
on public.marketplace_listings for delete
using (
  auth.uid() = seller_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.plan in ('basic', 'pro')
  )
);

-- ══════════════════════════════════════════════
-- TRIGGER: auto-create profile on signup
-- ══════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ══════════════════════════════════════════════
-- STORAGE BUCKET: documents (private)
-- ══════════════════════════════════════════════
-- Run in SQL Editor:
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,  -- 10 MB
  array['application/pdf']
)
on conflict (id) do nothing;

-- Storage policies
create policy "users upload own files" on storage.objects for insert with check (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "users read own files" on storage.objects for select using (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "users delete own files" on storage.objects for delete using (
  bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]
);
