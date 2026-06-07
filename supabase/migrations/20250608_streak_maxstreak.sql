-- Add max_streak tracking to leaderboard / rank functions
-- This migration ensures we track max_streak alongside current_streak

-- If leaderboard_scores table exists, add max_streak column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leaderboard_scores') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leaderboard_scores' AND column_name = 'max_streak') THEN
      ALTER TABLE leaderboard_scores ADD COLUMN max_streak integer DEFAULT 0;
    END IF;
  END IF;
END $$;

-- If user_streaks table exists, add max_streak column
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_streaks') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_streaks' AND column_name = 'max_streak') THEN
      ALTER TABLE user_streaks ADD COLUMN max_streak integer DEFAULT 0;
      -- Initialize max_streak from current_streak
      UPDATE user_streaks SET max_streak = GREATEST(max_streak, current_streak);
    END IF;
    -- Reset streak if last_streak_date is not today or yesterday (streak dies!)
    UPDATE user_streaks
    SET current_streak = 0
    WHERE last_streak_date < CURRENT_DATE - INTERVAL '1 day'
      AND current_streak > 0;
  END IF;
END $$;
