-- ============================================================
-- BUG-002 FIX (akar masalah) — kolom yang hilang di user_presence
-- ============================================================
-- Heartbeat route melakukan upsert ke kolom `current_room_id`, tetapi tabel
-- public.user_presence TIDAK punya kolom itu → setiap heartbeat error → HTTP 500
-- berulang tiap beberapa detik.
--
-- Jalankan di Supabase → SQL Editor. Idempotent (aman dijalankan berkali-kali).
-- ============================================================

-- 1) Pastikan tabel ada (kalau belum pernah dibuat)
create table if not exists public.user_presence (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'online' check (status in ('online', 'idle', 'offline')),
  current_path text,
  last_seen_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Tambahkan kolom yang hilang (penyebab utama 500)
alter table public.user_presence
  add column if not exists current_room_id uuid;

-- (opsional) kaitkan ke study_rooms kalau tabelnya ada; abaikan kalau tidak.
do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema = 'public' and table_name = 'study_rooms') then
    begin
      alter table public.user_presence
        add constraint user_presence_current_room_fk
        foreign key (current_room_id) references public.study_rooms(id) on delete set null;
    exception when duplicate_object then
      null; -- constraint sudah ada
    end;
  end if;
end $$;

-- 3) Pastikan index & RLS tetap ada
create index if not exists idx_user_presence_last_seen_at
  on public.user_presence(last_seen_at desc);

alter table public.user_presence enable row level security;

drop policy if exists "Users can read presence" on public.user_presence;
create policy "Users can read presence"
  on public.user_presence for select to authenticated using (true);

drop policy if exists "Users can insert own presence" on public.user_presence;
create policy "Users can insert own presence"
  on public.user_presence for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can update own presence" on public.user_presence;
create policy "Users can update own presence"
  on public.user_presence for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update on public.user_presence to authenticated;
