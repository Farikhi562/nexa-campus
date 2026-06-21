-- ============================================================
-- Fix: Badge tidak konsisten antara halaman Pencapaian vs profil publik
-- Jalankan di Supabase → SQL Editor. Idempotent.
-- ============================================================
-- AKAR MASALAH (sudah diverifikasi baca kode):
-- Halaman Pencapaian menghitung badge LIVE dari stats asli (evaluateBadges()
-- di lib/badges.ts). Profil publik (saat melihat user LAIN) malah membaca
-- kolom `profiles.badges` — yang TERNYATA tidak pernah ditulis oleh UI
-- manapun (endpoint PATCH /api/profile/badges ada, tapi tidak pernah
-- dipanggil dari komponen manapun). Hasilnya: profil publik selalu
-- menampilkan badge kosong/cuma plan+featured, beda total dari yang
-- ditampilkan di Pencapaian.
--
-- FIX: hitung badge LIVE juga untuk profil yang sedang dilihat (bukan cuma
-- diri sendiri). points_events tidak bisa dibaca lintas-user lewat RLS
-- biasa (benar, sudah diperketat di Batch 9) — RPC get_my_rank yang sudah
-- ada PASTI mengandalkan auth.uid(), jadi tidak bisa dipakai untuk user
-- lain. Migration ini menambah KEMBARAN yang di-parameterize, TANPA
-- mengubah get_my_rank yang sudah ada sama sekali (zero risk ke fitur yang
-- sudah jalan).
-- ============================================================

create or replace function public.get_user_rank(p_user_id uuid, p_scope text default 'all_time')
returns table (
  points bigint,
  rank bigint,
  total_players bigint,
  current_streak integer,
  is_public boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := p_user_id;
  v_start timestamptz := public.leaderboard_period_start(p_scope);
  v_points bigint := 0;
  v_rank bigint := null;
  v_total_players bigint := 0;
  v_current_streak integer := 0;
  v_is_public boolean := true;
begin
  if v_user_id is null then
    return;
  end if;

  select coalesce(p.is_public_profile, true)
  into v_is_public
  from public.profiles p
  where p.id = v_user_id;

  select coalesce(sum(pe.points), 0)::bigint
  into v_points
  from public.points_events pe
  where pe.user_id = v_user_id
    and pe.created_at >= v_start;

  with agg as (
    select
      pe.user_id,
      coalesce(sum(pe.points), 0)::bigint as total_points
    from public.points_events pe
    where pe.created_at >= v_start
    group by pe.user_id
  ),
  public_agg as (
    select
      a.user_id,
      a.total_points
    from agg a
    join public.profiles p on p.id = a.user_id
    where coalesce(p.is_public_profile, true) = true
      and a.total_points > 0
  )
  select
    count(*) filter (where pa.total_points > v_points) + 1,
    count(*)
  into v_rank, v_total_players
  from public_agg pa;

  with days as (
    select distinct (pe.created_at at time zone 'Asia/Jakarta')::date as activity_date
    from public.points_events pe
    where pe.user_id = v_user_id
      and pe.kind = 'complete_deadline'
  ),
  grouped as (
    select
      d.activity_date,
      d.activity_date - (row_number() over (order by d.activity_date))::int as streak_group
    from days d
  ),
  runs as (
    select
      count(*)::int as run_length,
      max(g.activity_date) as last_day
    from grouped g
    group by g.streak_group
  )
  select coalesce(
    max(
      case
        when r.last_day >= (now() at time zone 'Asia/Jakarta')::date - 1
          then r.run_length
        else 0
      end
    ),
    0
  )
  into v_current_streak
  from runs r;

  points := v_points;
  rank := case when v_is_public and v_points > 0 then v_rank else null end;
  total_players := v_total_players;
  current_streak := v_current_streak;
  is_public := v_is_public;
  return next;
end;
$$;

-- Hanya untuk authenticated (bukan anon) — selaras dengan pola akses lain
-- di aplikasi ini. Privasi profil (is_public_profile, friend-only, dst)
-- TETAP digerbang di level pemanggil (app/api/profile/[id]/route.ts),
-- bukan di fungsi ini — fungsi ini murni alat hitung, bukan penjaga akses.
revoke all on function public.get_user_rank(uuid, text) from public;
grant execute on function public.get_user_rank(uuid, text) to authenticated;
