-- NEXA Campus migration: Gemini + Telegram reminder

alter table public.profiles
  add column if not exists telegram_chat_id text;

alter table public.schedules
  add column if not exists telegram_chat_id text;

alter table if exists public.academic_reminders
  add column if not exists telegram_chat_id text;

comment on column public.profiles.telegram_chat_id is 'Telegram chat_id for @NEXATchBot reminders';
comment on column public.schedules.telegram_chat_id is 'Optional Telegram chat_id override for this reminder';
