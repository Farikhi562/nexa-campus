-- NEXA Campus v1.6.26 Batch 4 Fix
-- Manual payment: Bank Jago transfer + BRI QRIS/BRImo.
-- Aman dipakai buat fresh install atau project yang sudah jalanin migration v1.6.25.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists plan text not null default 'radar',
  add column if not exists plan_status text not null default 'active',
  add column if not exists plan_started_at timestamptz,
  add column if not exists plan_expires_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_plan_check'
  ) then
    alter table public.profiles
      add constraint profiles_plan_check check (plan in ('radar', 'pulse', 'command')) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_plan_status_check'
  ) then
    alter table public.profiles
      add constraint profiles_plan_status_check check (plan_status in ('active', 'expired', 'cancelled')) not valid;
  end if;
end $$;

create table if not exists public.manual_payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_code text not null unique,
  plan text not null check (plan in ('pulse', 'command')),
  amount integer not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected', 'expired', 'cancelled')),
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
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.manual_payment_orders
  alter column payment_method set default 'bank_jago',
  alter column bank_name set default 'Bank Jago',
  alter column account_number set default '100157134050',
  alter column account_name set default 'Muhamad Fauzan Al Farikhi';

create index if not exists manual_payment_orders_user_id_idx on public.manual_payment_orders(user_id);
create index if not exists manual_payment_orders_status_idx on public.manual_payment_orders(status);
create index if not exists manual_payment_orders_order_code_idx on public.manual_payment_orders(order_code);
create index if not exists manual_payment_orders_payment_method_idx on public.manual_payment_orders(payment_method);

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
comment on column public.manual_payment_orders.metadata is 'Detail UI payment method: label, type, qr_image_url, dll.';
