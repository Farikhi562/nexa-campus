-- ============================================================
-- NEXA Arena — Leaderboard Tim & Badge Kompetisi
-- Jalankan di Supabase → SQL Editor. Idempotent.
-- ============================================================
-- Memakai infra yang sudah ada:
--   - public.nexa_arena_posts (tim/kompetisi)
--   - public.nexa_arena_team_members (post_id, user_id, role)
--   - public.points_events (poin per user) → dipakai untuk skor tim
-- ============================================================

-- 1) Hasil/placement tim (diisi oleh creator setelah lomba selesai)
create table if not exists public.nexa_arena_results (
  post_id uuid primary key references public.nexa_arena_posts(id) on delete cascade,
  placement text not null default 'participant'
    check (placement in ('juara_1', 'juara_2', 'juara_3', 'finalist', 'participant')),
  note text,
  verified boolean not null default false,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.nexa_arena_results enable row level security;

-- Semua user terautentikasi boleh baca hasil (untuk leaderboard publik).
drop policy if exists "Arena results readable" on public.nexa_arena_results;
create policy "Arena results readable"
  on public.nexa_arena_results for select to authenticated using (true);

-- Hanya creator post yang boleh menulis/ubah hasil timnya.
drop policy if exists "Arena creator manages result" on public.nexa_arena_results;
create policy "Arena creator manages result"
  on public.nexa_arena_results for all to authenticated
  using (
    exists (select 1 from public.nexa_arena_posts p
            where p.id = nexa_arena_results.post_id and p.creator_id = auth.uid())
  )
  with check (
    exists (select 1 from public.nexa_arena_posts p
            where p.id = nexa_arena_results.post_id and p.creator_id = auth.uid())
  );

-- 2) Bobot placement untuk skor leaderboard
create or replace function public.nexa_placement_weight(p text)
returns integer language sql immutable as $$
  select case p
    when 'juara_1' then 1000
    when 'juara_2' then 700
    when 'juara_3' then 500
    when 'finalist' then 250
    else 50
  end
$$;

-- 3) VIEW leaderboard tim
-- Skor tim = bobot placement + total poin anggota tim (dari points_events).
create or replace view public.nexa_arena_team_leaderboard as
with team_points as (
  select tm.post_id,
         count(*) as member_count,
         coalesce(sum(pe_sum.total), 0) as members_points
  from public.nexa_arena_team_members tm
  left join lateral (
    select coalesce(sum(pe.points), 0) as total
    from public.points_events pe
    where pe.user_id = tm.user_id
  ) pe_sum on true
  group by tm.post_id
)
select
  p.id as post_id,
  p.title,
  p.competition_name,
  p.competition_type,
  p.campus_name,
  p.creator_id,
  coalesce(r.placement, 'participant') as placement,
  coalesce(r.verified, false) as verified,
  coalesce(tp.member_count, 0) as member_count,
  coalesce(tp.members_points, 0) as members_points,
  public.nexa_placement_weight(coalesce(r.placement, 'participant'))
    + coalesce(tp.members_points, 0) as team_score
from public.nexa_arena_posts p
join team_points tp on tp.post_id = p.id
left join public.nexa_arena_results r on r.post_id = p.id
where tp.member_count >= 2          -- hanya tim yang sudah terbentuk
order by team_score desc, p.created_at asc;

grant select on public.nexa_arena_team_leaderboard to authenticated;

-- 4) VIEW badge kompetisi per user (dari placement tim yang diikuti)
create or replace view public.nexa_arena_user_badges as
select
  tm.user_id,
  p.id as post_id,
  p.title,
  p.competition_name,
  coalesce(r.placement, 'participant') as placement,
  coalesce(r.verified, false) as verified,
  case coalesce(r.placement, 'participant')
    when 'juara_1' then '🥇 Juara 1'
    when 'juara_2' then '🥈 Juara 2'
    when 'juara_3' then '🥉 Juara 3'
    when 'finalist' then '🏅 Finalist'
    else '🎫 Peserta'
  end as badge_label,
  p.created_at
from public.nexa_arena_team_members tm
join public.nexa_arena_posts p on p.id = tm.post_id
left join public.nexa_arena_results r on r.post_id = p.id;

grant select on public.nexa_arena_user_badges to authenticated;
