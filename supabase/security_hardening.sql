-- NEXA Campus security hardening migration.
-- Run after the base schema and growth-feature migrations.

alter table public.study_rooms
  add column if not exists room_password_hash text;

alter table public.profiles
  add column if not exists seat_owner_id uuid references auth.users,
  add column if not exists weakness_analysis jsonb;

-- Users may edit public/profile preferences, but billing, team-seat, and
-- gamification fields must only be changed by trusted server-side code.
create or replace function public.prevent_profile_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT'
     and auth.uid() = new.id
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    new.plan := 'free';
    new.badges := '[]'::jsonb;
    new.seat_owner_id := null;
    new.weakness_analysis := null;
    return new;
  end if;

  if auth.uid() = old.id
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    if new.plan is distinct from old.plan
       or new.badges is distinct from old.badges
       or new.seat_owner_id is distinct from old.seat_owner_id
       or new.weakness_analysis is distinct from old.weakness_analysis then
      raise exception 'Protected profile fields can only be updated by the server.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_profile_self_escalation_trigger on public.profiles;
create trigger prevent_profile_self_escalation_trigger
before insert or update on public.profiles
for each row execute function public.prevent_profile_self_escalation();

-- Documents must be created/processed through authenticated API routes that
-- enforce plan limits, file validation, and server-side OCR/AI processing.
drop policy if exists "own docs insert" on public.documents;
drop policy if exists "own docs update" on public.documents;
revoke insert, update on public.documents from anon, authenticated;

-- Direct browser uploads to the private documents bucket bypass server checks.
drop policy if exists "users upload own files" on storage.objects;

-- Client code may read and mark notifications as read, but must not create,
-- delete, or rewrite server-authored notification content.
drop policy if exists "own notifications" on public.notifications;
drop policy if exists "own notifications select" on public.notifications;
drop policy if exists "own notifications update read" on public.notifications;

create policy "own notifications select"
on public.notifications for select
using (auth.uid() = user_id);

create policy "own notifications update read"
on public.notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke insert, delete on public.notifications from anon, authenticated;

create or replace function public.prevent_notification_rewrite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = old.user_id
     and coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    if new.user_id is distinct from old.user_id
       or new.title is distinct from old.title
       or new.message is distinct from old.message
       or new.type is distinct from old.type
       or new.created_at is distinct from old.created_at then
      raise exception 'Notification content can only be changed by the server.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_notification_rewrite_trigger on public.notifications;
create trigger prevent_notification_rewrite_trigger
before update on public.notifications
for each row execute function public.prevent_notification_rewrite();

-- Error logs should always be tied to the authenticated user that submitted it.
drop policy if exists "own error logs insert" on public.error_logs;
drop policy if exists "own error logs read" on public.error_logs;

create policy "own error logs insert"
on public.error_logs for insert
with check (auth.uid() = user_id);

create policy "own error logs read"
on public.error_logs for select
using (auth.uid() = user_id);

-- Marketplace moderation belongs in the database too, otherwise direct Supabase
-- calls can skip client-side filters.
create or replace function public.reject_marketplace_abuse()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  combined text := lower(
    coalesce(new.title, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(new.category, '')
  );
begin
  if length(trim(coalesce(new.title, ''))) < 3
     or length(new.title) > 120
     or length(coalesce(new.description, '')) > 1200 then
    raise exception 'Listing marketplace tidak valid.';
  end if;

  if combined ~ '(narkoba|narkotika|ganja|sabu|senjata|pistol|alkohol|vape|rokok|joki|contekan|kunci jawaban|akun curian|jual akun|ktp|ijazah palsu|dokumen palsu|bajakan|crack|porn|dewasa|escort)' then
    raise exception 'Listing terindikasi melanggar aturan marketplace.';
  end if;

  return new;
end;
$$;

drop trigger if exists reject_marketplace_abuse_trigger on public.marketplace_listings;
create trigger reject_marketplace_abuse_trigger
before insert or update on public.marketplace_listings
for each row execute function public.reject_marketplace_abuse();

create or replace function public.prevent_marketplace_spoofing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_plan text;
  current_telegram text;
  current_campus text;
  current_provinsi text;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' then
    return new;
  end if;

  select plan, telegram_number, universitas, provinsi
    into current_plan, current_telegram, current_campus, current_provinsi
  from public.profiles
  where id = auth.uid();

  if current_plan not in ('basic', 'pro', 'admin') then
    raise exception 'Seller marketplace hanya untuk akun berbayar.';
  end if;

  if tg_op = 'INSERT' then
    new.seller_id := auth.uid();
    new.is_verified := false;
    new.contact_telegram := current_telegram;
    new.campus := current_campus;
    if coalesce(new.location, '') = '' then
      new.location := current_provinsi;
    end if;
  else
    if new.seller_id is distinct from old.seller_id
       or new.is_verified is distinct from old.is_verified then
      raise exception 'Seller dan status verifikasi tidak bisa diubah oleh client.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_marketplace_spoofing_trigger on public.marketplace_listings;
create trigger prevent_marketplace_spoofing_trigger
before insert or update on public.marketplace_listings
for each row execute function public.prevent_marketplace_spoofing();

create table if not exists public.payments (
  id uuid default uuid_generate_v4() primary key,
  order_id text unique not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  provider text not null default 'midtrans' check (provider = 'midtrans'),
  plan text not null check (plan in ('basic', 'pro')),
  amount integer not null check (amount in (19000, 39000)),
  status text not null default 'pending',
  transaction_status text,
  fraud_status text,
  snap_token text,
  redirect_url text,
  raw_response jsonb,
  paid_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.payments enable row level security;

drop policy if exists "own payments select" on public.payments;
create policy "own payments select"
on public.payments for select
using (auth.uid() = user_id);

revoke insert, update, delete on public.payments from anon, authenticated;

-- Direct exam schedule writes get the same basic constraints as the API.
create or replace function public.validate_exam_schedule_input()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  schedule_count integer;
begin
  if length(trim(coalesce(new.subject, ''))) < 1
     or length(new.subject) > 160
     or length(coalesce(new.room, '')) > 80
     or length(coalesce(new.notes, '')) > 500
     or new.type not in ('UTS', 'UAS', 'Quiz') then
    raise exception 'Jadwal ujian tidak valid.';
  end if;

  if tg_op = 'INSERT' then
    select count(*) into schedule_count
    from public.exam_schedules
    where user_id = new.user_id;

    if schedule_count >= 100 then
      raise exception 'Batas jadwal ujian tercapai.';
    end if;
  end if;

  if new.is_public = true and coalesce(new.university, '') = '' then
    raise exception 'Jadwal publik harus memiliki universitas.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_exam_schedule_input_trigger on public.exam_schedules;
create trigger validate_exam_schedule_input_trigger
before insert or update on public.exam_schedules
for each row execute function public.validate_exam_schedule_input();
