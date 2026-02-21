-- Social feed/profile setup verification checks.
-- Run this in Supabase SQL Editor after:
--   1) running supabase/migrations/20260220000001_social-tables.sql
--   2) configuring Clerk JWT template + JWKS in Supabase Auth

-- 1) Core tables exist
SELECT
  to_regclass('public.posts')             AS posts,
  to_regclass('public.post_transit_tags') AS post_transit_tags,
  to_regclass('public.post_likes')        AS post_likes,
  to_regclass('public.post_comments')     AS post_comments,
  to_regclass('public.daily_transits')    AS daily_transits,
  to_regclass('public.follows')           AS follows;

-- 2) Key column type checks for Clerk IDs (must be TEXT)
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    (table_name = 'posts' AND column_name = 'user_id')
    OR (table_name = 'post_likes' AND column_name = 'user_id')
    OR (table_name = 'post_comments' AND column_name = 'user_id')
    OR (table_name = 'follows' AND column_name IN ('follower_id', 'following_id'))
  )
ORDER BY table_name, column_name;

-- 3) RLS is enabled on all social tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'posts',
    'post_transit_tags',
    'post_likes',
    'post_comments',
    'daily_transits',
    'follows'
  )
ORDER BY tablename;

-- 4) Required policies exist
SELECT schemaname, tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'posts',
    'post_transit_tags',
    'post_likes',
    'post_comments',
    'daily_transits',
    'follows'
  )
ORDER BY tablename, policyname;

-- 5) Counter triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('post_likes', 'post_comments')
ORDER BY event_object_table, trigger_name;

-- 6) Trigger functions exist
SELECT proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('update_post_likes_count', 'update_post_comments_count')
ORDER BY proname;

