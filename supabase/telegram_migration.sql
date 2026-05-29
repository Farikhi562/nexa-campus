alter table public.profiles
  add column if not exists telegram_chat_id text;

alter table public.schedules
  add column if not exists telegram_chat_id text,
  alter column telegram_number drop not null;
