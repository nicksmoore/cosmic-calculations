-- Elemental Houses: membership + weekly challenge progress for marketplace discounts.
-- Uses TEXT user_id to align with Clerk IDs used across social tables.

CREATE TABLE IF NOT EXISTS public.house_memberships (
  user_id TEXT PRIMARY KEY,
  house TEXT NOT NULL CHECK (house IN ('Fire', 'Earth', 'Air', 'Water')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.house_weekly_progress (
  user_id TEXT NOT NULL,
  week_key TEXT NOT NULL,
  house TEXT NOT NULL CHECK (house IN ('Fire', 'Earth', 'Air', 'Water')),
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  challenge_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_key)
);

ALTER TABLE public.house_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.house_weekly_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own house membership" ON public.house_memberships;
CREATE POLICY "Users can read own house membership"
  ON public.house_memberships FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own house membership" ON public.house_memberships;
CREATE POLICY "Users can insert own house membership"
  ON public.house_memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own house membership" ON public.house_memberships;
CREATE POLICY "Users can update own house membership"
  ON public.house_memberships FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can read own weekly house progress" ON public.house_weekly_progress;
CREATE POLICY "Users can read own weekly house progress"
  ON public.house_weekly_progress FOR SELECT
  TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own weekly house progress" ON public.house_weekly_progress;
CREATE POLICY "Users can insert own weekly house progress"
  ON public.house_weekly_progress FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own weekly house progress" ON public.house_weekly_progress;
CREATE POLICY "Users can update own weekly house progress"
  ON public.house_weekly_progress FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own weekly house progress" ON public.house_weekly_progress;
CREATE POLICY "Users can delete own weekly house progress"
  ON public.house_weekly_progress FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_house_weekly_progress_week_key
  ON public.house_weekly_progress(week_key);
