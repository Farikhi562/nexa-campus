-- NEXA Campus v1.6.27 Batch 4 Hotfix
-- Hardening manual payment: Bank Jago + BRI QRIS/BRImo.
-- Jalankan setelah v1.6.26. Aman buat fresh/existing table.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists plan text not null default 'radar',
  add column if not exists plan_status text not null default 'active',
  add column if not exists plan_started_at timestamptz,
  add column if not exists plan_expires_at timestamptz;

create table if not exists public.manual_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_code text not null unique,
  plan text not null,
  amount integer not null,
  status text not null default 'pending',
  payment_method text not null default 'bank_jago',
  bank_name text not null default 'Bank Jago',
  account_number text not null default '100157134050',
  account_name text not null default 'Muhamad Fauzan Al Farikhi',
  buyer_name text,
  buyer_whatsapp text,
  proof_url text,
  notes text,
  rejection_reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '24 hours',
  approved_at timestamptz
);

alter table public.manual_payment_orders
  add column if not exists payment_method text not null default 'bank_jago',
  add column if not exists bank_name text not null default 'Bank Jago',
  add column if not exists account_number text not null default '100157134050',
  add column if not exists account_name text not null default 'Muhamad Fauzan Al Farikhi',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists buyer_name text,
  add column if not exists buyer_whatsapp text,
  add column if not exists proof_url text,
  add column if not exists notes text,
  add column if not exists rejection_reason text,
  add column if not exists expires_at timestamptz not null default now() + interval '24 hours',
  add column if not exists approved_at timestamptz;

alter table public.manual_payment_orders
  alter column payment_method set default 'bank_jago',
  alter column bank_name set default 'Bank Jago',
  alter column account_number set default '100157134050',
  alter column account_name set default 'Muhamad Fauzan Al Farikhi',
  alter column metadata set default '{}'::jsonb,
  alter column expires_at set default now() + interval '24 hours';

update public.manual_payment_orders
set payment_method = 'bank_jago'
where payment_method is null or trim(payment_method) = '';

update public.manual_payment_orders
set bank_name = 'Bank Jago'
where bank_name is null or trim(bank_name) = '';

update public.manual_payment_orders
set account_number = '100157134050'
where account_number is null or trim(account_number) = '';

update public.manual_payment_orders
set account_name = 'Muhamad Fauzan Al Farikhi'
where account_name is null or trim(account_name) = '';

update public.manual_payment_orders
set metadata = '{}'::jsonb
where metadata is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_plan_check') then
    alter table public.profiles
      add constraint profiles_plan_check check (plan in ('radar', 'pulse', 'command')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_plan_status_check') then
    alter table public.profiles
      add constraint profiles_plan_status_check check (plan_status in ('active', 'expired', 'cancelled')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'manual_payment_orders_plan_check_v1627') then
    alter table public.manual_payment_orders
      add constraint manual_payment_orders_plan_check_v1627 check (plan in ('pulse', 'command')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'manual_payment_orders_amount_check_v1627') then
    alter table public.manual_payment_orders
      add constraint manual_payment_orders_amount_check_v1627 check (amount > 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'manual_payment_orders_status_check_v1627') then
    alter table public.manual_payment_orders
      add constraint manual_payment_orders_status_check_v1627
      check (status in ('pending', 'under_review', 'approved', 'rejected', 'expired', 'cancelled')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'manual_payment_orders_payment_method_check') then
    alter table public.manual_payment_orders
      add constraint manual_payment_orders_payment_method_check check (payment_method in ('bank_jago', 'bri_qris')) not valid;
  end if;
end $$;

-- Validate yang paling penting. Kalau gagal, berarti ada data lama yang nilainya ngaco.
alter table public.manual_payment_orders validate constraint manual_payment_orders_payment_method_check;

create index if not exists manual_payment_orders_user_id_idx on public.manual_payment_orders(user_id);
create index if not exists manual_payment_orders_status_idx on public.manual_payment_orders(status);
create index if not exists manual_payment_orders_order_code_idx on public.manual_payment_orders(order_code);
create index if not exists manual_payment_orders_payment_method_idx on public.manual_payment_orders(payment_method);

create or replace function public.set_manual_payment_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_manual_payment_orders_updated_at_trigger'
  ) then
    create trigger set_manual_payment_orders_updated_at_trigger
      before update on public.manual_payment_orders
      for each row
      execute function public.set_manual_payment_orders_updated_at();
  end if;
end $$;

alter table public.manual_payment_orders enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'manual_payment_orders'
      and policyname = 'Users can view own manual payment orders'
  ) then
    create policy "Users can view own manual payment orders"
      on public.manual_payment_orders
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'manual_payment_orders'
      and policyname = 'Users can create own manual payment orders'
  ) then
    create policy "Users can create own manual payment orders"
      on public.manual_payment_orders
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'manual_payment_orders'
      and policyname = 'Users can update proof on own pending orders'
  ) then
    create policy "Users can update proof on own pending orders"
      on public.manual_payment_orders
      for update
      using (auth.uid() = user_id and status in ('pending', 'under_review'))
      with check (auth.uid() = user_id and status in ('pending', 'under_review'));
  end if;
end $$;

comment on column public.manual_payment_orders.payment_method is 'bank_jago atau bri_qris';
comment on column public.manual_payment_orders.metadata is 'Detail UI payment method: payment_label, payment_type, qr_image_url, dll.';
