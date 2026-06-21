create table if not exists public.calendar_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_date date not null,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_notes_title_length check (char_length(trim(title)) between 1 and 80),
  constraint calendar_notes_content_length check (char_length(trim(content)) between 1 and 1000)
);

create index if not exists calendar_notes_user_date_idx
  on public.calendar_notes (user_id, note_date desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists calendar_notes_set_updated_at on public.calendar_notes;
create trigger calendar_notes_set_updated_at before update on public.calendar_notes
  for each row execute procedure public.set_updated_at();

alter table public.calendar_notes enable row level security;

drop policy if exists "calendar_notes_select_own" on public.calendar_notes;
create policy "calendar_notes_select_own"
  on public.calendar_notes for select
  using (auth.uid() = user_id);

drop policy if exists "calendar_notes_insert_own" on public.calendar_notes;
create policy "calendar_notes_insert_own"
  on public.calendar_notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "calendar_notes_update_own" on public.calendar_notes;
create policy "calendar_notes_update_own"
  on public.calendar_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "calendar_notes_delete_own" on public.calendar_notes;
create policy "calendar_notes_delete_own"
  on public.calendar_notes for delete
  using (auth.uid() = user_id);
