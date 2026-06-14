-- NEXA Campus v1.6.42
-- Badge showcase rule: satu user cuma boleh punya 1 badge utama yang tampil di profile.

-- Rapihin data lama: kalau ada user punya banyak badge pinned, sisakan 1 yang paling baru.
do $$
begin
  if to_regclass('public.nexa_user_badges') is not null then
    with ranked as (
      select
        ctid,
        row_number() over (
          partition by user_id
          order by unlocked_at desc nulls last, badge_key asc
        ) as rn
      from public.nexa_user_badges
      where is_pinned is true
    )
    update public.nexa_user_badges b
    set is_pinned = false
    from ranked r
    where b.ctid = r.ctid
      and r.rn > 1;

    if not exists (
      select 1
      from pg_indexes
      where schemaname = 'public'
        and indexname = 'nexa_user_badges_one_pinned_per_user_idx'
    ) then
      execute 'create unique index nexa_user_badges_one_pinned_per_user_idx on public.nexa_user_badges(user_id) where is_pinned is true';
    end if;
  end if;
end $$;

comment on index public.nexa_user_badges_one_pinned_per_user_idx is 'Satu user hanya boleh punya satu badge utama untuk profile showcase.';
