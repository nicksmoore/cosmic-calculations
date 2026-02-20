-- Social tables for Cosmic Calculations feed, likes, comments, follows, and daily transits.
-- Uses TEXT for user_id to match Clerk user IDs (not Supabase auth UUIDs).
-- Run this against your Supabase project if these tables don't exist yet.

-- ── posts ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL,
  content          TEXT NOT NULL,
  is_public        BOOLEAN NOT NULL DEFAULT true,
  transit_snapshot JSONB,
  likes_count      INTEGER NOT NULL DEFAULT 0,
  comments_count   INTEGER NOT NULL DEFAULT 0,
  deleted_at       TIMESTAMP WITH TIME ZONE,
  created_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
CREATE POLICY "Public posts are viewable by everyone"
  ON public.posts FOR SELECT
  USING (is_public = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own posts" ON public.posts;
CREATE POLICY "Users can insert own posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- ── post_transit_tags ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.post_transit_tags (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  transit_key       TEXT NOT NULL,
  transiting_planet TEXT,
  aspect            TEXT,
  natal_point       TEXT,
  display_name      TEXT NOT NULL,
  orb               DOUBLE PRECISION NOT NULL DEFAULT 0,
  is_primary        BOOLEAN NOT NULL DEFAULT false,
  is_personal       BOOLEAN NOT NULL DEFAULT false,
  is_applying       BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.post_transit_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Transit tags readable with post" ON public.post_transit_tags;
CREATE POLICY "Transit tags readable with post"
  ON public.post_transit_tags FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_transit_tags.post_id
      AND posts.is_public = true
      AND posts.deleted_at IS NULL
  ));

DROP POLICY IF EXISTS "Users can insert transit tags for own posts" ON public.post_transit_tags;
CREATE POLICY "Users can insert transit tags for own posts"
  ON public.post_transit_tags FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_transit_tags.post_id
      AND auth.uid()::text = posts.user_id
  ));

CREATE INDEX IF NOT EXISTS idx_post_transit_tags_post_id ON public.post_transit_tags(post_id);

-- ── post_likes ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.post_likes (
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Likes readable by everyone" ON public.post_likes;
CREATE POLICY "Likes readable by everyone"
  ON public.post_likes FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

-- Trigger to keep likes_count in sync
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_likes_count ON public.post_likes;
CREATE TRIGGER trg_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_likes_count();

-- ── post_comments ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.post_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL,
  content    TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments readable by everyone" ON public.post_comments;
CREATE POLICY "Comments readable by everyone"
  ON public.post_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_comments.post_id
      AND posts.is_public = true
      AND posts.deleted_at IS NULL
  ));

DROP POLICY IF EXISTS "Users can insert own comments" ON public.post_comments;
CREATE POLICY "Users can insert own comments"
  ON public.post_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
CREATE POLICY "Users can delete own comments"
  ON public.post_comments FOR DELETE
  TO authenticated
  USING (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);

-- Trigger to keep comments_count in sync
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_post_comments_count ON public.post_comments;
CREATE TRIGGER trg_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_post_comments_count();

-- ── daily_transits ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.daily_transits (
  date             DATE PRIMARY KEY,
  dominant_transit TEXT NOT NULL,
  transit_key      TEXT NOT NULL,
  description      TEXT,
  aspect_precision TIMESTAMP WITH TIME ZONE,
  transits         JSONB NOT NULL DEFAULT '[]',
  computed_at      TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_transits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Daily transits readable by everyone" ON public.daily_transits;
CREATE POLICY "Daily transits readable by everyone"
  ON public.daily_transits FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can upsert daily transits" ON public.daily_transits;
CREATE POLICY "Authenticated users can upsert daily transits"
  ON public.daily_transits FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update daily transits" ON public.daily_transits;
CREATE POLICY "Authenticated users can update daily transits"
  ON public.daily_transits FOR UPDATE
  TO authenticated
  USING (true);

-- ── follows ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.follows (
  follower_id  TEXT NOT NULL,
  following_id TEXT NOT NULL,
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Follows readable by everyone" ON public.follows;
CREATE POLICY "Follows readable by everyone"
  ON public.follows FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid()::text = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  TO authenticated
  USING (auth.uid()::text = follower_id);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
