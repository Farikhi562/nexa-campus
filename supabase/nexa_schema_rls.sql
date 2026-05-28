-- ============================================================
-- NEXA Campus Ecosystem - Supabase SQL + RLS
-- Paste into Supabase SQL Editor.
-- Safe to run after the existing supabase/schema.sql.
-- ============================================================

create extension if not exists "uuid-ossp";

-- ============================================================
-- 1) PROFILE SIGNUP HARDENING
-- ============================================================

alter table public.profiles
  add column if not exists whatsapp_number text,
  add column if not exists profile_completed boolean default false,
  add column if not exists updated_at timestamptz default now();

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free', 'basic', 'pro', 'admin'));

alter table public.profiles enable row level security;

drop policy if exists "own profile select" on public.profiles;
drop policy if exists "own profile insert" on public.profiles;
drop policy if exists "own profile update" on public.profiles;

create policy "own profile select"
on public.profiles
for select
using (auth.uid() = id);

create policy "own profile insert"
on public.profiles
for insert
with check (
  auth.uid() = id
  and plan = 'free'
);

create policy "own profile update"
on public.profiles
for update
using (auth.uid() = id)
with check (
  auth.uid() = id
  and plan in ('free', 'basic', 'pro', 'admin')
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    plan,
    profile_completed
  )
  values (
    new.id,
    coalesce(new.email, ''),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    'free',
    false
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2) SMART REMINDER: tugas, praktikum, ujian, kuis, dll.
-- ============================================================

create table if not exists public.academic_reminders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,

  type text not null default 'tugas'
    check (type in ('ujian', 'tugas', 'praktikum', 'kuis', 'presentasi', 'organisasi', 'lainnya')),
  title text not null,
  course text,
  due_date date not null,
  due_time time,
  priority text not null default 'normal'
    check (priority in ('normal', 'penting', 'urgent')),

  notes text,
  whatsapp_number text,
  channel_whatsapp boolean not null default true,
  reminder_offsets jsonb not null default '["P7D", "P3D", "P1D", "PT3H", "PT30M"]'::jsonb,
  sent_log jsonb not null default '{}'::jsonb,

  status text not null default 'active'
    check (status in ('active', 'done', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academic_reminders_user_due_idx
  on public.academic_reminders (user_id, due_date, due_time);

create index if not exists academic_reminders_status_due_idx
  on public.academic_reminders (status, due_date);

alter table public.academic_reminders enable row level security;

drop policy if exists "own academic reminders select" on public.academic_reminders;
drop policy if exists "pro academic reminders insert" on public.academic_reminders;
drop policy if exists "own academic reminders update" on public.academic_reminders;
drop policy if exists "own academic reminders delete" on public.academic_reminders;

create policy "own academic reminders select"
on public.academic_reminders
for select
using (auth.uid() = user_id);

-- Pro only, because automatic WhatsApp reminder is a paid feature.
create policy "pro academic reminders insert"
on public.academic_reminders
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.plan in ('pro', 'admin')
  )
);

create policy "own academic reminders update"
on public.academic_reminders
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "own academic reminders delete"
on public.academic_reminders
for delete
using (auth.uid() = user_id);

-- ============================================================
-- 3) MARKETPLACE: barang + jasa mahasiswa
-- ============================================================

create table if not exists public.marketplace_listings (
  id uuid primary key default uuid_generate_v4(),
  seller_id uuid not null references public.profiles(id) on delete cascade,

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_listings_status_created_idx
  on public.marketplace_listings (status, created_at desc);

create index if not exists marketplace_listings_seller_idx
  on public.marketplace_listings (seller_id);

create index if not exists marketplace_listings_type_idx
  on public.marketplace_listings (type);

alter table public.marketplace_listings enable row level security;

drop policy if exists "active listings readable by auth users" on public.marketplace_listings;
drop policy if exists "seller can read own listings" on public.marketplace_listings;
drop policy if exists "paid users can create listings" on public.marketplace_listings;
drop policy if exists "paid sellers can update own listings" on public.marketplace_listings;
drop policy if exists "paid sellers can delete own listings" on public.marketplace_listings;

-- All logged-in users can browse active marketplace items.
create policy "active listings readable by auth users"
on public.marketplace_listings
for select
using (
  auth.role() = 'authenticated'
  and status = 'active'
);

-- Sellers can see their draft/pending/sold/archived listings too.
create policy "seller can read own listings"
on public.marketplace_listings
for select
using (auth.uid() = seller_id);

-- Only Basic/Pro users can sell barang/jasa.
create policy "paid users can create listings"
on public.marketplace_listings
for insert
with check (
  auth.uid() = seller_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.plan in ('basic', 'pro', 'admin')
  )
);

create policy "paid sellers can update own listings"
on public.marketplace_listings
for update
using (
  auth.uid() = seller_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.plan in ('basic', 'pro', 'admin')
  )
)
with check (
  auth.uid() = seller_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.plan in ('basic', 'pro', 'admin')
  )
);

create policy "paid sellers can delete own listings"
on public.marketplace_listings
for delete
using (
  auth.uid() = seller_id
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.plan in ('basic', 'pro', 'admin')
  )
);

-- Buyer inquiries / chat starter.
create table if not exists public.marketplace_inquiries (
  id uuid primary key default uuid_generate_v4(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'replied', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marketplace_inquiries_listing_idx
  on public.marketplace_inquiries (listing_id, created_at desc);

create index if not exists marketplace_inquiries_buyer_idx
  on public.marketplace_inquiries (buyer_id);

alter table public.marketplace_inquiries enable row level security;

drop policy if exists "buyer can create inquiry" on public.marketplace_inquiries;
drop policy if exists "buyer or seller can read inquiry" on public.marketplace_inquiries;
drop policy if exists "buyer or seller can update inquiry" on public.marketplace_inquiries;

create policy "buyer can create inquiry"
on public.marketplace_inquiries
for insert
with check (
  auth.uid() = buyer_id
  and exists (
    select 1
    from public.marketplace_listings l
    where l.id = listing_id
      and l.status = 'active'
      and l.seller_id <> auth.uid()
  )
);

create policy "buyer or seller can read inquiry"
on public.marketplace_inquiries
for select
using (
  auth.uid() = buyer_id
  or exists (
    select 1
    from public.marketplace_listings l
    where l.id = listing_id
      and l.seller_id = auth.uid()
  )
);

create policy "buyer or seller can update inquiry"
on public.marketplace_inquiries
for update
using (
  auth.uid() = buyer_id
  or exists (
    select 1
    from public.marketplace_listings l
    where l.id = listing_id
      and l.seller_id = auth.uid()
  )
)
with check (
  auth.uid() = buyer_id
  or exists (
    select 1
    from public.marketplace_listings l
    where l.id = listing_id
      and l.seller_id = auth.uid()
  )
);

-- ============================================================
-- 4) UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_academic_reminders_updated_at on public.academic_reminders;
create trigger set_academic_reminders_updated_at
  before update on public.academic_reminders
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_marketplace_listings_updated_at on public.marketplace_listings;
create trigger set_marketplace_listings_updated_at
  before update on public.marketplace_listings
  for each row execute procedure public.set_updated_at();

drop trigger if exists set_marketplace_inquiries_updated_at on public.marketplace_inquiries;
create trigger set_marketplace_inquiries_updated_at
  before update on public.marketplace_inquiries
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- 5) STORAGE BUCKET + POLICIES FOR DOCUMENTS
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do nothing;

drop policy if exists "users upload own files" on storage.objects;
drop policy if exists "users read own files" on storage.objects;
drop policy if exists "users delete own files" on storage.objects;

create policy "users upload own files"
on storage.objects
for insert
with check (
  bucket_id = 'documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users read own files"
on storage.objects
for select
using (
  bucket_id = 'documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "users delete own files"
on storage.objects
for delete
using (
  bucket_id = 'documents'
  and auth.uid()::text = (storage.foldername(name))[1]
);
