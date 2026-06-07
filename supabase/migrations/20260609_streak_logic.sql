-- ============================================================
-- NEXA Campus — Streak Logic Fix
-- Adds last_streak_date, auto-reset trigger, max_streak update
-- ============================================================

-- 1. Ensure last_streak_date exists on user_streaks
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'user_streaks'
  ) THEN
    -- Add last_streak_date if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_streaks' AND column_name = 'last_streak_date'
    ) THEN
      ALTER TABLE user_streaks ADD COLUMN last_streak_date date;
      -- Seed from updated_at so existing streaks don't all get reset
      UPDATE user_streaks SET last_streak_date = updated_at::date WHERE last_streak_date IS NULL;
    END IF;

    -- Add max_streak if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_streaks' AND column_name = 'max_streak'
    ) THEN
      ALTER TABLE user_streaks ADD COLUMN max_streak integer DEFAULT 0;
      UPDATE user_streaks SET max_streak = GREATEST(COALESCE(max_streak, 0), COALESCE(current_streak, 0));
    END IF;
  END IF;
END $$;

-- 2. Also ensure leaderboard_scores has max_streak
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'leaderboard_scores'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leaderboard_scores' AND column_name = 'last_streak_date'
    ) THEN
      ALTER TABLE leaderboard_scores ADD COLUMN last_streak_date date;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leaderboard_scores' AND column_name = 'max_streak'
    ) THEN
      ALTER TABLE leaderboard_scores ADD COLUMN max_streak integer DEFAULT 0;
      UPDATE leaderboard_scores
        SET max_streak = GREATEST(COALESCE(max_streak, 0), COALESCE(current_streak, 0));
    END IF;
  END IF;
END $$;

-- 3. Function: check_and_reset_streak
--    Call this when a user logs in or from cron.
--    Returns true if streak was reset.
CREATE OR REPLACE FUNCTION check_and_reset_streak(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_date  date;
  v_streak     integer;
  v_table_name text;
BEGIN
  -- Detect which table is in use
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_streaks') THEN
    v_table_name := 'user_streaks';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leaderboard_scores') THEN
    v_table_name := 'leaderboard_scores';
  ELSE
    RETURN false;
  END IF;

  IF v_table_name = 'user_streaks' THEN
    SELECT last_streak_date, current_streak
      INTO v_last_date, v_streak
      FROM user_streaks
      WHERE user_id = p_user_id;

    IF v_last_date IS NOT NULL AND v_last_date < (CURRENT_DATE - INTERVAL '1 day') AND v_streak > 0 THEN
      UPDATE user_streaks
        SET current_streak = 0,
            updated_at     = now()
        WHERE user_id = p_user_id;
      RETURN true;
    END IF;

  ELSE
    SELECT last_streak_date, current_streak
      INTO v_last_date, v_streak
      FROM leaderboard_scores
      WHERE user_id = p_user_id;

    IF v_last_date IS NOT NULL AND v_last_date < (CURRENT_DATE - INTERVAL '1 day') AND v_streak > 0 THEN
      UPDATE leaderboard_scores
        SET current_streak = 0,
            updated_at     = now()
        WHERE user_id = p_user_id;
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

-- 4. Function: increment_streak
--    Call this when a user completes a deadline (idempotent per day).
CREATE OR REPLACE FUNCTION increment_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_date date;
  v_table_name text;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_streaks') THEN
    v_table_name := 'user_streaks';
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leaderboard_scores') THEN
    v_table_name := 'leaderboard_scores';
  ELSE
    RETURN;
  END IF;

  IF v_table_name = 'user_streaks' THEN
    SELECT last_streak_date INTO v_last_date FROM user_streaks WHERE user_id = p_user_id;

    IF v_last_date = CURRENT_DATE THEN
      -- Already incremented today — idempotent, do nothing
      RETURN;
    END IF;

    INSERT INTO user_streaks (user_id, current_streak, max_streak, last_streak_date, updated_at)
      VALUES (p_user_id, 1, 1, CURRENT_DATE, now())
    ON CONFLICT (user_id) DO UPDATE
      SET current_streak  = CASE
            WHEN user_streaks.last_streak_date = CURRENT_DATE - 1 THEN user_streaks.current_streak + 1
            ELSE 1
          END,
          last_streak_date = CURRENT_DATE,
          max_streak       = GREATEST(
                               user_streaks.max_streak,
                               CASE
                                 WHEN user_streaks.last_streak_date = CURRENT_DATE - 1
                                      THEN user_streaks.current_streak + 1
                                 ELSE 1
                               END
                             ),
          updated_at = now();

  ELSE
    SELECT last_streak_date INTO v_last_date FROM leaderboard_scores WHERE user_id = p_user_id;

    IF v_last_date = CURRENT_DATE THEN
      RETURN;
    END IF;

    INSERT INTO leaderboard_scores (user_id, current_streak, max_streak, last_streak_date, updated_at)
      VALUES (p_user_id, 1, 1, CURRENT_DATE, now())
    ON CONFLICT (user_id) DO UPDATE
      SET current_streak  = CASE
            WHEN leaderboard_scores.last_streak_date = CURRENT_DATE - 1
                 THEN leaderboard_scores.current_streak + 1
            ELSE 1
          END,
          last_streak_date = CURRENT_DATE,
          max_streak       = GREATEST(
                               leaderboard_scores.max_streak,
                               CASE
                                 WHEN leaderboard_scores.last_streak_date = CURRENT_DATE - 1
                                      THEN leaderboard_scores.current_streak + 1
                                 ELSE 1
                               END
                             ),
          updated_at = now();
  END IF;
END;
$$;

-- 5. Cron-style batch reset: reset all stale streaks
--    Run this from a scheduled job or manually.
CREATE OR REPLACE FUNCTION reset_stale_streaks()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_streaks') THEN
    UPDATE user_streaks
      SET current_streak = 0, updated_at = now()
      WHERE last_streak_date < CURRENT_DATE - INTERVAL '1 day'
        AND current_streak > 0;
    GET DIAGNOSTICS v_count = ROW_COUNT;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leaderboard_scores') THEN
    UPDATE leaderboard_scores
      SET current_streak = 0, updated_at = now()
      WHERE last_streak_date < CURRENT_DATE - INTERVAL '1 day'
        AND current_streak > 0;
    GET DIAGNOSTICS v_count = v_count + ROW_COUNT;
  END IF;

  RETURN v_count;
END;
$$;

-- 6. Grant execute to authenticated users for their own streak
GRANT EXECUTE ON FUNCTION check_and_reset_streak(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_streak(uuid) TO authenticated;
-- reset_stale_streaks is for service role only (cron)
