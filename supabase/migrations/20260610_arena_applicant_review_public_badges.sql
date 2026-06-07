-- ============================================================================
-- NEXA Arena v2: applicant review, real competency confirmation, public badges
-- ============================================================================

ALTER TABLE public.nexa_arena_applications
  ADD COLUMN IF NOT EXISTS applicant_background text,
  ADD COLUMN IF NOT EXISTS portfolio_url text,
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS competency_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

CREATE INDEX IF NOT EXISTS arena_apps_reviewed_by_idx ON public.nexa_arena_applications (reviewed_by);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS featured_badge text;

-- Leaderboard publik ikut bawa featured_badge supaya badge bisa tampil di kartu user.
DROP FUNCTION IF EXISTS public.get_leaderboard(text, integer);
DROP FUNCTION IF EXISTS public.get_leaderboard();

CREATE OR REPLACE FUNCTION public.get_leaderboard(
  p_scope text DEFAULT 'all_time'::text,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  campus_name text,
  featured_badge text,
  plan text,
  points bigint,
  rank bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH period AS (
    SELECT public.leaderboard_period_start(p_scope) AS start_at
  ),
  agg AS (
    SELECT
      pe.user_id,
      COALESCE(SUM(pe.points), 0)::bigint AS total_points
    FROM public.points_events pe
    CROSS JOIN period pr
    WHERE pe.created_at >= pr.start_at
    GROUP BY pe.user_id
  ),
  ranked AS (
    SELECT
      p.id AS user_id,
      COALESCE(NULLIF(TRIM(p.full_name), ''), 'Mahasiswa NEXA')::text AS display_name,
      p.avatar_url::text AS avatar_url,
      p.campus_name::text AS campus_name,
      p.featured_badge::text AS featured_badge,
      COALESCE(p.plan, 'radar')::text AS plan,
      a.total_points AS total_points,
      ROW_NUMBER() OVER (
        ORDER BY a.total_points DESC, p.created_at ASC
      )::bigint AS rank_number
    FROM public.profiles p
    INNER JOIN agg a ON a.user_id = p.id
    WHERE COALESCE(p.is_public_profile, true) = true
      AND a.total_points > 0
  )
  SELECT
    ranked.user_id,
    ranked.display_name,
    ranked.avatar_url,
    ranked.campus_name,
    ranked.featured_badge,
    ranked.plan,
    ranked.total_points AS points,
    ranked.rank_number AS rank
  FROM ranked
  ORDER BY ranked.total_points DESC, ranked.rank_number ASC
  LIMIT GREATEST(1, LEAST(COALESCE(p_limit, 100), 200));
$function$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(text, integer) TO authenticated;

-- get_my_rank aman dari ambiguity points. Simpan lagi di sini biar deploy baru tidak mewarisi dosa lama.
DROP FUNCTION IF EXISTS public.get_my_rank(text);
DROP FUNCTION IF EXISTS public.get_my_rank();

CREATE OR REPLACE FUNCTION public.get_my_rank(p_scope text DEFAULT 'all_time')
RETURNS TABLE (
  points bigint,
  rank bigint,
  total_players bigint,
  current_streak integer,
  is_public boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_start timestamptz := public.leaderboard_period_start(p_scope);
  v_points bigint := 0;
  v_rank bigint := NULL;
  v_total_players bigint := 0;
  v_current_streak integer := 0;
  v_is_public boolean := true;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(p.is_public_profile, true)
  INTO v_is_public
  FROM public.profiles p
  WHERE p.id = v_user_id;

  SELECT COALESCE(SUM(pe.points), 0)::bigint
  INTO v_points
  FROM public.points_events pe
  WHERE pe.user_id = v_user_id
    AND pe.created_at >= v_start;

  WITH agg AS (
    SELECT
      pe.user_id,
      COALESCE(SUM(pe.points), 0)::bigint AS total_points
    FROM public.points_events pe
    WHERE pe.created_at >= v_start
    GROUP BY pe.user_id
  ),
  public_agg AS (
    SELECT
      a.user_id,
      a.total_points
    FROM agg a
    JOIN public.profiles p ON p.id = a.user_id
    WHERE COALESCE(p.is_public_profile, true) = true
      AND a.total_points > 0
  )
  SELECT
    COUNT(*) FILTER (WHERE pa.total_points > v_points) + 1,
    COUNT(*)
  INTO v_rank, v_total_players
  FROM public_agg pa;

  WITH days AS (
    SELECT DISTINCT (pe.created_at AT TIME ZONE 'Asia/Jakarta')::date AS activity_date
    FROM public.points_events pe
    WHERE pe.user_id = v_user_id
      AND pe.kind = 'complete_deadline'
  ),
  grouped AS (
    SELECT
      d.activity_date,
      d.activity_date - (ROW_NUMBER() OVER (ORDER BY d.activity_date))::int AS streak_group
    FROM days d
  ),
  runs AS (
    SELECT
      COUNT(*)::int AS run_length,
      MAX(g.activity_date) AS last_day
    FROM grouped g
    GROUP BY g.streak_group
  )
  SELECT COALESCE(
    MAX(
      CASE
        WHEN r.last_day >= (NOW() AT TIME ZONE 'Asia/Jakarta')::date - 1 THEN r.run_length
        ELSE 0
      END
    ),
    0
  )
  INTO v_current_streak
  FROM runs r;

  points := v_points;
  rank := CASE WHEN v_is_public AND v_points > 0 THEN v_rank ELSE NULL END;
  total_players := v_total_players;
  current_streak := v_current_streak;
  is_public := v_is_public;

  RETURN NEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_rank(text) TO authenticated;

NOTIFY pgrst, 'reload schema';
