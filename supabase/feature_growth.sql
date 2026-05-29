-- NEXA Campus growth features migration
-- Safe to run after supabase/schema.sql on an existing project.

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists badges jsonb not null default '[]'::jsonb,
  add column if not exists is_public_profile boolean not null default false;

create table if not exists public.error_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  error_type text not null,
  message text not null,
  created_at timestamptz default now()
);

create table if not exists public.learning_streaks (
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  exams_completed integer not null default 0,
  avg_score integer not null default 0,
  primary key (user_id, date)
);

create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  message text not null,
  type text not null check (type in ('reminder','exam_result','badge_earned','system')),
  is_read boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.exam_schedules (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subject text not null,
  type text not null default 'UTS',
  exam_date timestamptz not null,
  room text,
  notes text,
  university text,
  is_public boolean not null default false,
  created_at timestamptz default now()
);

create table if not exists public.leaderboard_stats (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  total_exams integer not null default 0,
  avg_score integer not null default 0,
  current_streak integer not null default 0,
  last_session_id uuid references public.exam_sessions(id) on delete set null,
  last_document_id uuid references public.documents(id) on delete set null,
  updated_at timestamptz default now()
);

alter table public.error_logs enable row level security;
alter table public.learning_streaks enable row level security;
alter table public.notifications enable row level security;
alter table public.exam_schedules enable row level security;
alter table public.leaderboard_stats enable row level security;

drop policy if exists "own error logs insert" on public.error_logs;
create policy "own error logs insert" on public.error_logs for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "own error logs read" on public.error_logs;
create policy "own error logs read" on public.error_logs for select using (auth.uid() = user_id);

drop policy if exists "own learning streaks" on public.learning_streaks;
create policy "own learning streaks" on public.learning_streaks for select using (auth.uid() = user_id);

drop policy if exists "own notifications" on public.notifications;
create policy "own notifications" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "own exam schedules" on public.exam_schedules;
create policy "own exam schedules" on public.exam_schedules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "public suggested exam schedules" on public.exam_schedules;
create policy "public suggested exam schedules" on public.exam_schedules for select using (is_public = true);

drop policy if exists "own leaderboard stats" on public.leaderboard_stats;
create policy "own leaderboard stats" on public.leaderboard_stats for select using (auth.uid() = user_id);

drop policy if exists "public leaderboard stats" on public.leaderboard_stats;
create policy "public leaderboard stats" on public.leaderboard_stats for select using (
  exists (
    select 1 from public.profiles p
    where p.id = user_id and p.is_public_profile = true
  )
);
