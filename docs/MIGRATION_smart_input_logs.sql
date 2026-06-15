-- ============================================================
-- Smart Input Engine — smart_input_logs
-- Jalankan di Supabase → SQL Editor. Idempotent.
-- ============================================================
-- Mencatat setiap input (manual/nlp/image/file) + hasil parsing-nya,
-- untuk audit, debugging parser, dan analitik kualitas ekstraksi AI.
-- Tidak memengaruhi tabel academic_deadlines / reminder / push / telegram.
-- ============================================================

create table if not exists public.smart_input_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  input_type text not null check (input_type in ('manual', 'nlp', 'image', 'file')),
  raw_input text,
  parsed_result jsonb,
  status text not null default 'parsed'
    check (status in ('parsed', 'fallback', 'confirmed', 'discarded', 'error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_smart_input_logs_user on public.smart_input_logs(user_id, created_at desc);

alter table public.smart_input_logs enable row level security;

drop policy if exists "Users manage own smart input logs" on public.smart_input_logs;
create policy "Users manage own smart input logs"
  on public.smart_input_logs for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.smart_input_logs to authenticated;
