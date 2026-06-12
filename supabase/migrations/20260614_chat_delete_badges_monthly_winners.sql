-- Chat delete stability + future-ready rare badge support.

alter table public.private_messages
  drop constraint if exists private_messages_content_or_attachment_check;

alter table public.private_messages
  add constraint private_messages_content_or_attachment_check
  check (
    is_deleted = true
    or deleted_at is not null
    or nullif(btrim(coalesce(content, '')), '') is not null
    or attachment_url is not null
    or attachment_path is not null
  );

create table if not exists public.leaderboard_monthly_winners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  month_key text not null check (month_key ~ '^[0-9]{4}-[0-9]{2}$'),
  rank integer not null check (rank > 0),
  points integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, month_key)
);

create index if not exists idx_leaderboard_monthly_winners_user_rank
  on public.leaderboard_monthly_winners(user_id, rank, month_key desc);

alter table public.leaderboard_monthly_winners enable row level security;

drop policy if exists "Users can read own monthly leaderboard wins" on public.leaderboard_monthly_winners;
create policy "Users can read own monthly leaderboard wins"
on public.leaderboard_monthly_winners
for select to authenticated
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
