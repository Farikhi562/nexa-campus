-- NEXA Campus v1.6.30
-- Billing Admin Suite: upload bukti transfer, admin dashboard, audit log, expire cron support.

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
  add column if not exists buyer_name text,
  add column if not exists buyer_whatsapp text,
  add column if not exists proof_url text,
  add column if not exists notes text,
  add column if not exists rejection_reason text,
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists expires_at timestamptz not null default now() + interval '24 hours',
  add column if not exists approved_at timestamptz;

update public.manual_payment_orders set metadata = '{}'::jsonb where metadata is null;
update public.manual_payment_orders set payment_method = 'bank_jago' where payment_method is null or trim(payment_method) = '';
update public.manual_payment_orders set status = 'pending' where status is null or trim(status) = '';

create index if not exists manual_payment_orders_user_id_idx on public.manual_payment_orders(user_id);
create index if not exists manual_payment_orders_status_idx on public.manual_payment_orders(status);
create index if not exists manual_payment_orders_order_code_idx on public.manual_payment_orders(order_code);
create index if not exists manual_payment_orders_payment_method_idx on public.manual_payment_orders(payment_method);
create index if not exists manual_payment_orders_expires_at_idx on public.manual_payment_orders(expires_at);

alter table public.manual_payment_orders enable row level security;

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

  if not exists (select 1 from pg_constraint where conname = 'manual_payment_orders_plan_check') then
    alter table public.manual_payment_orders
      add constraint manual_payment_orders_plan_check check (plan in ('pulse', 'command')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'manual_payment_orders_amount_check') then
    alter table public.manual_payment_orders
      add constraint manual_payment_orders_amount_check check (amount > 0) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'manual_payment_orders_status_check') then
    alter table public.manual_payment_orders
      add constraint manual_payment_orders_status_check check (status in ('pending', 'under_review', 'approved', 'rejected', 'expired', 'cancelled')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'manual_payment_orders_payment_method_check') then
    alter table public.manual_payment_orders
      add constraint manual_payment_orders_payment_method_check check (payment_method in ('bank_jago', 'bri_qris')) not valid;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'manual_payment_orders' and policyname = 'Users can view own manual payment orders'
  ) then
    create policy "Users can view own manual payment orders"
      on public.manual_payment_orders
      for select
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'manual_payment_orders' and policyname = 'Users can create own manual payment orders'
  ) then
    create policy "Users can create own manual payment orders"
      on public.manual_payment_orders
      for insert
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'manual_payment_orders' and policyname = 'Users can update proof on own pending orders'
  ) then
    create policy "Users can update proof on own pending orders"
      on public.manual_payment_orders
      for update
      using (auth.uid() = user_id and status in ('pending', 'under_review'))
      with check (auth.uid() = user_id and status in ('pending', 'under_review'));
  end if;
end $$;

create table if not exists public.payment_audit_logs (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.manual_payment_orders(id) on delete set null,
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_email text,
  action text not null check (action in ('approved', 'rejected', 'expired', 'manual_note')),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_audit_logs_order_id_idx on public.payment_audit_logs(order_id);
create index if not exists payment_audit_logs_admin_user_id_idx on public.payment_audit_logs(admin_user_id);
create index if not exists payment_audit_logs_created_at_idx on public.payment_audit_logs(created_at desc);

alter table public.payment_audit_logs enable row level security;

-- Bucket publik buat bukti pembayaran. MVP dulu. Kalau mau lebih private nanti ganti signed URL.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.payment_audit_logs is 'Audit trail approve/reject manual payment NEXA.';
comment on column public.manual_payment_orders.proof_url is 'Public URL bukti transfer user dari bucket payment-proofs atau URL manual.';
