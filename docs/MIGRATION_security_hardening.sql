-- ============================================================
-- NEXA Campus — Security Hardening (Batch 9)
-- Jalankan di Supabase → SQL Editor. Idempotent.
-- ============================================================
-- Ringkasan temuan yang diperbaiki migration ini:
--   1. payment_orders tidak pernah enable RLS (data finansial terbuka)
--   2. award_points RPC bisa dipanggil bebas dari client dengan poin
--      sembarangan (leaderboard bisa di-cheat)
--   3. Kode join Study Room cuma 16 juta kombinasi (hex 6 karakter)
--   4. Tidak ada rate limiting di endpoint manapun (terutama AI yang
--      berbiaya per-panggilan)
-- ============================================================


-- ============================================================
-- 1) payment_orders — enable RLS (TEMUAN KRITIS)
-- ============================================================
-- Sebelumnya: tabel ini punya kolom user_id/plan/amount/status tapi RLS
-- TIDAK PERNAH di-enable di migration manapun. Dengan anon key (yang publik,
-- nempel di semua client bundle), siapa pun bisa baca SEMUA payment_orders
-- semua user langsung lewat REST API Supabase.
alter table public.payment_orders enable row level security;

-- User hanya boleh BACA order miliknya sendiri (untuk halaman billing/riwayat).
drop policy if exists "payment_orders_select_own" on public.payment_orders;
create policy "payment_orders_select_own"
  on public.payment_orders for select to authenticated
  using (auth.uid() = user_id);

-- SENGAJA tidak ada policy insert/update/delete untuk authenticated/anon.
-- Order hanya dibuat oleh /api/payments/midtrans/create dan diupdate oleh
-- webhook /api/payments/midtrans/notification — keduanya lewat service-role
-- client (bypass RLS by design). Client tidak pernah butuh menulis tabel ini
-- langsung.


-- ============================================================
-- 2) award_points — kunci poin & kind di server, bukan dari client
--    (TEMUAN KRITIS)
-- ============================================================
-- Sebelumnya: function ini menerima p_points dari CALLER tanpa validasi, dan
-- dedup (on conflict ... where ref is not null) cuma jalan kalau p_ref diisi.
-- User bisa panggil langsung dari devtools:
--   supabase.rpc('award_points', {p_kind:'apa saja', p_points:999999999})
-- berkali-kali tanpa ref → leaderboard bisa di-cheat instan.
--
-- Fix: hapus parameter p_points sepenuhnya dari signature (poin ditentukan
-- HARDCODE di server berdasarkan p_kind), dan p_ref WAJIB diisi (jadi dedup
-- selalu aktif, tidak bisa di-spam berulang).

-- Hapus overload lama yang rawan disalahgunakan.
drop function if exists public.award_points(text, integer, text);

create or replace function public.award_points(p_kind text, p_ref text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  uid uuid := auth.uid();
  v_points integer;
begin
  if uid is null then return; end if;

  -- p_ref WAJIB diisi — ini satu-satunya mekanisme dedup (unique constraint
  -- di points_events). Tanpa ref, request ditolak diam-diam (no-op) supaya
  -- tidak bisa di-spam tanpa batas dengan ref kosong/null berulang-ulang.
  if p_ref is null or length(trim(p_ref)) = 0 then return; end if;

  -- Poin ditentukan DI SINI (server), bukan dari parameter caller. Daftar ini
  -- harus selalu sinkron dengan kind yang benar-benar dipakai aplikasi —
  -- lihat README Batch 9 untuk daftar call site yang sudah diaudit.
  v_points := case p_kind
    when 'create_deadline'   then 2
    when 'complete_deadline' then 10
    when 'ontime_bonus'      then 5
    when 'focus_session'     then 5
    when 'daily_checkin'     then 3
    else null
  end;

  -- Kind yang tidak dikenal -> no-op (bukan error, supaya tidak mematahkan
  -- alur utama caller seperti create-deadline kalau ada typo kind di masa depan;
  -- cukup tidak menambah poin apa pun).
  if v_points is null then return; end if;

  insert into public.points_events (user_id, kind, points, ref)
  values (uid, p_kind, v_points, p_ref)
  on conflict (user_id, kind, ref) where ref is not null do nothing;
end; $$;

revoke all on function public.award_points(text, text) from public;
grant execute on function public.award_points(text, text) to authenticated;


-- ============================================================
-- 3) Kode join Study Room — perlebar alfabet (TEMUAN SEDANG)
-- ============================================================
-- Sebelumnya: substring dari md5 hash = cuma karakter hex (0-9a-f, 16
-- kemungkinan per posisi) -> 16^6 ≈ 16,7 juta kombinasi untuk 6 karakter.
-- Sekarang: alfabet 34 karakter (alfanumerik tanpa I/O biar gak ketuker
-- 1/0) -> 34^6 ≈ 1,5 miliar kombinasi. Panjang kode TETAP 6 karakter (UI
-- punya maxLength={6} di form join-by-code, sengaja tidak diubah supaya
-- tidak perlu sentuh komponen React).
create or replace function public.generate_room_code()
returns text language plpgsql as $$
declare
  alphabet text := '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  code text;
  i integer;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
    end loop;
    exit when not exists (select 1 from public.study_rooms where room_code = code);
  end loop;
  return code;
end; $$;


-- ============================================================
-- 4) Rate limiting — infrastruktur baru (TEMUAN TINGGI)
-- ============================================================
-- Sebelumnya: TIDAK ADA rate limiting di endpoint manapun, terutama
-- endpoint AI yang berbiaya per-panggilan (bisa di-spam untuk menguras
-- kuota/biaya provider AI), dan endpoint join-by-code (brute force kode room).
--
-- Desain: counter sederhana per user+route+window waktu, atomic via
-- "insert ... on conflict ... do update ... returning" (aman dari race
-- condition di level Postgres). Tidak butuh dependency/service eksternal
-- (Redis/Upstash dll) — cukup tabel + function di Supabase yang sudah ada.

create table if not exists public.rate_limits (
  user_id uuid not null references public.profiles(id) on delete cascade,
  route_key text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  primary key (user_id, route_key, window_start)
);

alter table public.rate_limits enable row level security;
-- SENGAJA tidak ada policy select/insert/update untuk authenticated/anon —
-- tabel ini HANYA boleh diakses lewat function security definer di bawah.
-- User tidak pernah perlu (dan tidak boleh) baca/tulis tabel ini langsung.

create or replace function public.check_rate_limit(
  p_route_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  v_window timestamptz;
  v_count integer;
begin
  if uid is null then return false; end if;

  -- Fixed window sederhana (bukan sliding window) — cukup untuk mencegah
  -- burst abuse tanpa kompleksitas tambahan.
  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);

  insert into public.rate_limits (user_id, route_key, window_start, request_count)
  values (uid, p_route_key, v_window, 1)
  on conflict (user_id, route_key, window_start)
  do update set request_count = rate_limits.request_count + 1
  returning request_count into v_count;

  return v_count <= p_limit;
end; $$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to authenticated;

-- Housekeeping opsional: bersihkan baris lama (>1 hari) biar tabel tidak
-- menumpuk terus. Bisa dipanggil manual sesekali, atau dijadwalkan lewat
-- cron Supabase (pg_cron) kalau tersedia di plan kamu — tidak wajib, tabel
-- ini kecil dan murah meski dibiarkan tumbuh untuk sementara.
create or replace function public.cleanup_old_rate_limits()
returns void language sql security definer set search_path = public as $$
  delete from public.rate_limits where window_start < now() - interval '1 day';
$$;
