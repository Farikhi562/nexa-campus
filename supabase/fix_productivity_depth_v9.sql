-- NEXA Campus v1.6.50 — Productivity depth upgrade
-- Menambahkan checklist deadline, progress, focus session per tugas,
-- actionable notification/snooze, dan Daily Pulse checkout.

alter table public.academic_deadlines
  add column if not exists estimated_minutes integer not null default 25,
  add column if not exists progress_percent integer not null default 0;

alter table public.academic_deadlines drop constraint if exists academic_deadlines_estimated_minutes_check;
alter table public.academic_deadlines add constraint academic_deadlines_estimated_minutes_check
  check (estimated_minutes between 5 and 600);

alter table public.academic_deadlines drop constraint if exists academic_deadlines_progress_percent_check;
alter table public.academic_deadlines add constraint academic_deadlines_progress_percent_check
  check (progress_percent between 0 and 100);

create table if not exists public.deadline_subtasks (
  id uuid primary key default gen_random_uuid(),
  deadline_id uuid not null references public.academic_deadlines(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  is_completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deadline_subtasks_deadline_position_idx
  on public.deadline_subtasks (deadline_id, position, created_at);
create index if not exists deadline_subtasks_user_idx
  on public.deadline_subtasks (user_id, created_at desc);

alter table public.deadline_subtasks enable row level security;
drop policy if exists deadline_subtasks_select_own on public.deadline_subtasks;
create policy deadline_subtasks_select_own on public.deadline_subtasks
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists deadline_subtasks_insert_own on public.deadline_subtasks;
create policy deadline_subtasks_insert_own on public.deadline_subtasks
  for insert to authenticated with check (
    auth.uid() = user_id and exists (
      select 1 from public.academic_deadlines d
      where d.id = deadline_id and d.user_id = auth.uid()
    )
  );
drop policy if exists deadline_subtasks_update_own on public.deadline_subtasks;
create policy deadline_subtasks_update_own on public.deadline_subtasks
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists deadline_subtasks_delete_own on public.deadline_subtasks;
create policy deadline_subtasks_delete_own on public.deadline_subtasks
  for delete to authenticated using (auth.uid() = user_id);

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  deadline_id uuid references public.academic_deadlines(id) on delete set null,
  duration_minutes integer not null check (duration_minutes between 1 and 600),
  preset_minutes integer,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists focus_sessions_user_completed_idx
  on public.focus_sessions (user_id, completed_at desc);
create index if not exists focus_sessions_deadline_idx
  on public.focus_sessions (deadline_id, completed_at desc)
  where deadline_id is not null;

alter table public.focus_sessions enable row level security;
drop policy if exists focus_sessions_select_own on public.focus_sessions;
create policy focus_sessions_select_own on public.focus_sessions
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists focus_sessions_insert_own on public.focus_sessions;
create policy focus_sessions_insert_own on public.focus_sessions
  for insert to authenticated with check (
    auth.uid() = user_id and (
      deadline_id is null or exists (
        select 1 from public.academic_deadlines d
        where d.id = deadline_id and d.user_id = auth.uid()
      )
    )
  );

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'notifications'
  ) then
    alter table public.notifications
      add column if not exists related_deadline_id uuid references public.academic_deadlines(id) on delete set null,
      add column if not exists snoozed_until timestamptz,
      add column if not exists action_state text not null default 'pending',
      add column if not exists read_at timestamptz;

    alter table public.notifications drop constraint if exists notifications_action_state_check;
    alter table public.notifications add constraint notifications_action_state_check
      check (action_state in ('pending', 'read', 'snoozed', 'done'));

    create index if not exists notifications_snooze_idx
      on public.notifications (user_id, snoozed_until)
      where snoozed_until is not null;
  end if;
end $$;

alter table public.daily_checkins
  add column if not exists checkout_mood text,
  add column if not exists checkout_note text,
  add column if not exists goal_completed boolean,
  add column if not exists checked_out_at timestamptz;

alter table public.daily_checkins drop constraint if exists daily_checkins_checkout_mood_check;
alter table public.daily_checkins add constraint daily_checkins_checkout_mood_check
  check (checkout_mood is null or checkout_mood in ('semangat', 'normal', 'capek', 'tertekan'));

notify pgrst, 'reload schema';
