# Astro-Feed (Transit Feed) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the Transit Feed — a public post stream where every post is auto-tagged with the user's active personal transits and the day's dominant collective transit energy.

**Architecture:** Clerk → Supabase JWT template bridges auth. Client-side celestine library computes transit tags at post time. Five new Supabase tables store posts, tags, likes, comments, and cached daily transit data. Feed reads publicly via anon key; writes use Clerk JWT.

**Tech Stack:** React 18 + TypeScript + Vite, `@clerk/clerk-react`, `@supabase/supabase-js`, `celestine` (already bundled), `@tanstack/react-query`, shadcn/ui + Tailwind, Supabase (project `efuustsrjnwpmomkxjnz`)

**Reference design:** `docs/plans/2026-02-19-astro-feed-design.md`

---

## Task 1: Clerk → Supabase JWT Bridge (Config + Code)

**Files:**
- Modify: `src/integrations/supabase/client.ts`
- Create: `src/integrations/supabase/authClient.ts`

### Step 1: Configure Clerk JWT Template (manual — Clerk Dashboard)

Go to: https://dashboard.clerk.com → Your App → Configure → JWT Templates

1. Click **New template** → choose **Supabase** (or Blank)
2. Name it exactly: `supabase`
3. The default Supabase template maps `sub` to Clerk user ID — keep defaults
4. Note the **JWKS Endpoint URL** shown (e.g. `https://national-lamb-67.clerk.accounts.dev/.well-known/jwks.json`)

### Step 2: Configure Supabase Custom JWT (manual — Supabase Dashboard)

Go to: https://supabase.com/dashboard/project/efuustsrjnwpmomkxjnz/auth/url-configuration

Then navigate to: Authentication → JWT Settings (or Settings → Authentication)

1. Find the **JWT Secret** section, look for "Third-party Auth" or "Custom JWT"
2. In Supabase: Settings → API → scroll to "JWT Settings" — set **JWT Secret** to use Clerk's JWKS
   - Actually: Authentication → Providers → look for "Third Party Providers"
   - OR use the Supabase Management API (see below)

**Via Management API** (run in terminal):
```bash
curl -X PATCH \
  "https://api.supabase.com/v1/projects/efuustsrjnwpmomkxjnz/config/auth" \
  -H "Authorization: Bearer sbp_7b16066e320c8fb4ecb030af0983d132d32ca8ab" \
  -H "Content-Type: application/json" \
  -d '{
    "jwt_secret": "use-jwks",
    "jwks_uri": "https://national-lamb-67.clerk.accounts.dev/.well-known/jwks.json"
  }'
```

> **Note:** Supabase's third-party auth support varies by plan. If Management API doesn't support `jwks_uri`, use the alternative: pass `Authorization: Bearer <clerk-token>` as a custom header and skip Supabase's `auth.uid()` for now — instead filter by `user_id = <clerk-id>` using service role in a future Edge Function. For v1, we can use service role key on writes server-side if needed. **Try the JWT template approach first.**

### Step 3: Create authenticated Supabase client factory

Create `src/integrations/supabase/authClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Returns a Supabase client authenticated with a Clerk JWT token.
 * Use for writes (posts, likes, comments) where RLS must verify identity.
 * For public reads, use the default `supabase` client from ./client.ts.
 */
export function getAuthenticatedClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
```

### Step 4: Verify Clerk token retrieval works

In `src/hooks/useAuth.ts`, note that `useClerk()` exposes `clerk.session`. Token retrieval pattern used in all write hooks:

```typescript
import { useClerk } from "@clerk/clerk-react";

// Inside a hook:
const { session } = useClerk();

// Inside a mutation function (async context):
const token = await session?.getToken({ template: 'supabase' });
if (!token) throw new Error("Not authenticated");
const client = getAuthenticatedClient(token);
```

### Step 5: Commit

```bash
git add src/integrations/supabase/authClient.ts
git commit -m "feat: add Clerk→Supabase JWT authenticated client factory"
```

---

## Task 2: Database Migrations

**Files:** None (SQL run in Supabase SQL Editor or Management API)

Run these in order via Supabase Dashboard → SQL Editor for project `efuustsrjnwpmomkxjnz`.

### Step 1: Alter profiles.user_id from uuid to text

```sql
-- The profiles table was created with user_id UUID.
-- Clerk user IDs are strings like "user_2abc..." so we must change the column type.
-- Safe to run on a fresh project with no real user rows.
ALTER TABLE profiles ALTER COLUMN user_id TYPE text USING user_id::text;

-- Update all policies that compare user_id to auth.uid()
-- auth.uid() returns text when using Clerk JWT template
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Step 2: Create posts table

```sql
CREATE TABLE posts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        text NOT NULL,
  content        text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 280),
  is_public      boolean NOT NULL DEFAULT true,
  likes_count    integer NOT NULL DEFAULT 0,
  comments_count integer NOT NULL DEFAULT 0,
  deleted_at     timestamptz,
  report_count   integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public posts are readable by all" ON posts
  FOR SELECT USING (is_public = true AND deleted_at IS NULL);

CREATE POLICY "Users can read own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can soft-delete own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 3: Create post_transit_tags table

```sql
CREATE TABLE post_transit_tags (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id           uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  transit_key       text NOT NULL,     -- e.g. "saturn_cnj_moon"
  transiting_planet text NOT NULL,     -- e.g. "Saturn"
  aspect            text NOT NULL,     -- e.g. "conjunction"
  natal_point       text NOT NULL,     -- e.g. "Moon"
  display_name      text NOT NULL,     -- e.g. "Saturn conjunct Moon"
  orb               numeric NOT NULL,  -- degrees, lower = tighter
  is_primary        boolean NOT NULL,  -- true if orb <= 3°
  is_personal       boolean NOT NULL,  -- true = natal hit, false = collective
  is_applying       boolean NOT NULL   -- true = moving toward exact
);

CREATE INDEX idx_post_transit_tags_transit_key ON post_transit_tags(transit_key);
CREATE INDEX idx_post_transit_tags_post_id ON post_transit_tags(post_id);

ALTER TABLE post_transit_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Transit tags are publicly readable" ON post_transit_tags
  FOR SELECT USING (true);

CREATE POLICY "Users can insert tags for own posts" ON post_transit_tags
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM posts WHERE id = post_id)
  );
```

### Step 4: Create post_likes table with trigger

```sql
CREATE TABLE post_likes (
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are publicly readable" ON post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own likes" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Denormalized count triggers
CREATE OR REPLACE FUNCTION increment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_like_insert AFTER INSERT ON post_likes
  FOR EACH ROW EXECUTE FUNCTION increment_likes_count();

CREATE TRIGGER on_like_delete AFTER DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION decrement_likes_count();
```

### Step 5: Create post_comments table with trigger

```sql
CREATE TABLE post_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    text NOT NULL,
  content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 280),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comments are publicly readable" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION increment_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_comment_insert AFTER INSERT ON post_comments
  FOR EACH ROW EXECUTE FUNCTION increment_comments_count();

CREATE TRIGGER on_comment_delete AFTER DELETE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION decrement_comments_count();
```

### Step 6: Create daily_transits table

```sql
CREATE TABLE daily_transits (
  date             date PRIMARY KEY,
  dominant_transit text NOT NULL,
  transit_key      text NOT NULL,
  description      text,
  aspect_precision timestamptz,
  transits         jsonb NOT NULL DEFAULT '[]',
  computed_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daily_transits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Daily transits are publicly readable" ON daily_transits
  FOR SELECT USING (true);

CREATE POLICY "Any authenticated user can insert daily transits" ON daily_transits
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

### Step 7: Verify in SQL Editor

Run these to confirm tables exist:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected: `daily_transits`, `post_comments`, `post_likes`, `post_transit_tags`, `posts`, `profiles`, and others.

---

## Task 3: Transit Calculation Engine

**Files:**
- Create: `src/lib/transitEngine.ts`

This is pure TypeScript — no React, no Supabase. Inputs are natal planet data and today's date. Outputs are structured transit tag objects.

### Step 1: Create the file with types and constants

Create `src/lib/transitEngine.ts`:

```typescript
import { calculateChart } from "celestine";

// ---- Types ----

export interface TransitTag {
  transit_key: string;        // e.g. "saturn_cnj_moon"
  transiting_planet: string;  // e.g. "Saturn"
  aspect: string;             // e.g. "conjunction"
  natal_point: string;        // e.g. "Moon"
  display_name: string;       // e.g. "Saturn conjunct Moon"
  orb: number;                // degrees, rounded to 2 decimal places
  is_primary: boolean;        // orb <= 3°
  is_personal: boolean;       // true = personal transit, false = collective
  is_applying: boolean;       // true = moving toward exact
}

export interface CollectiveTransit {
  transit_key: string;
  display_name: string;
  transiting_planet: string;
  aspect: string;
  target_planet: string;
  orb: number;
  is_applying: boolean;
  aspect_precision: string | null;
  vibe: string;
}

export interface DailyTransitData {
  dominant_transit: string;
  transit_key: string;
  description: string;
  aspect_precision: string | null;
  transits: CollectiveTransit[];
}

// ---- Constants ----

const MAJOR_ASPECTS: Array<{ name: string; abbr: string; angle: number; orb: number }> = [
  { name: "conjunction",  abbr: "cnj", angle:   0, orb: 6 },
  { name: "opposition",  abbr: "opp", angle: 180, orb: 6 },
  { name: "square",      abbr: "sq",  angle:  90, orb: 6 },
  { name: "trine",       abbr: "tri", angle: 120, orb: 6 },
  { name: "sextile",     abbr: "sxt", angle:  60, orb: 4 },
];

// Collective daily transits use tighter orbs (1°)
const COLLECTIVE_ORB = 1;

// Planet weight for collective transit scoring
const PLANET_WEIGHT: Record<string, number> = {
  Saturn: 3, Uranus: 3, Neptune: 3, Pluto: 3,
  Jupiter: 2, Mars: 2,
  Sun: 1, Moon: 1, Mercury: 1, Venus: 1,
};

// Vibe descriptions by aspect type
const ASPECT_VIBES: Record<string, Record<string, string>> = {
  conjunction: {
    default: "Energies merge and amplify.",
    "Saturn-Pluto": "Pressure to restructure at the deepest level.",
    "Jupiter-Uranus": "Sudden expansion and unexpected breakthroughs.",
  },
  opposition: { default: "Tension between polarities seeking integration." },
  square: { default: "Friction drives growth through challenge." },
  trine: { default: "Harmonious flow and natural ease." },
  sextile: { default: "Opportunity awaits those who reach for it." },
};

// ---- Helpers ----

/** Minimum angular distance between two ecliptic longitudes (0–180°) */
function angularDiff(a: number, b: number): number {
  const diff = Math.abs(((a - b) + 360) % 360);
  return diff > 180 ? 360 - diff : diff;
}

/** Check if a transiting planet is applying (moving toward exact aspect) */
function isApplying(
  transitLonNow: number,
  transitLonNext: number, // same planet 24h later
  natalLon: number,
  aspectAngle: number,
): boolean {
  const orbNow = Math.abs(angularDiff(transitLonNow, natalLon) - aspectAngle);
  const orbNext = Math.abs(angularDiff(transitLonNext, natalLon) - aspectAngle);
  return orbNext < orbNow;
}

/** Build a transit_key slug from planet names and aspect abbreviation */
function buildTransitKey(planet: string, aspectAbbr: string, natalPoint: string): string {
  return `${planet.toLowerCase()}_${aspectAbbr}_${natalPoint.toLowerCase().replace(/\s+/g, "_")}`;
}

/** Get planet positions for a given UTC date (lat/lng don't affect ecliptic longitudes) */
function getPlanetPositions(date: Date): Map<string, { lon: number; isRetrograde: boolean }> {
  const chart = calculateChart(
    {
      year:     date.getUTCFullYear(),
      month:    date.getUTCMonth() + 1,
      day:      date.getUTCDate(),
      hour:     12, // Noon UTC for stable daily snapshot
      minute:   0,
      second:   0,
      timezone: 0,
      latitude: 0,
      longitude: 0,
    },
    { houseSystem: "whole-sign" }
  );

  const positions = new Map<string, { lon: number; isRetrograde: boolean }>();
  for (const p of chart.planets) {
    positions.set(p.body, { lon: p.longitude, isRetrograde: p.isRetrograde });
  }
  return positions;
}

// ---- Public API ----

/**
 * Compute personal transit tags for a user at post time.
 * @param natalPlanets - planets from the user's natal chart (from useEphemeris)
 * @param natalAngles  - ascendant/midheaven from the user's natal chart
 * @returns Up to 5 transit tags, applying first, tightest orb first.
 */
export function getPersonalTransits(
  natalPlanets: Array<{ name: string; longitude: number }>,
  natalAngles: { ascendant: { longitude: number }; midheaven: { longitude: number } },
): TransitTag[] {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const posToday = getPlanetPositions(today);
  const posTomorrow = getPlanetPositions(tomorrow);

  // Build natal point list: planets + AC + MC
  const natalPoints: Array<{ name: string; longitude: number }> = [
    ...natalPlanets,
    { name: "Ascendant", longitude: natalAngles.ascendant.longitude },
    { name: "Midheaven", longitude: natalAngles.midheaven.longitude },
  ];

  const tags: TransitTag[] = [];

  for (const [transitPlanetName, todayPos] of posToday.entries()) {
    const tomorrowPos = posTomorrow.get(transitPlanetName);
    if (!tomorrowPos) continue;

    for (const natalPoint of natalPoints) {
      for (const aspect of MAJOR_ASPECTS) {
        const diff = angularDiff(todayPos.lon, natalPoint.longitude);
        const orb = Math.abs(diff - aspect.angle);
        if (orb > aspect.orb) continue;

        const applying = isApplying(
          todayPos.lon,
          tomorrowPos.lon,
          natalPoint.longitude,
          aspect.angle,
        );

        const transitKey = buildTransitKey(transitPlanetName, aspect.abbr, natalPoint.name);

        tags.push({
          transit_key:       transitKey,
          transiting_planet: transitPlanetName,
          aspect:            aspect.name,
          natal_point:       natalPoint.name,
          display_name:      `${transitPlanetName} ${aspect.name} ${natalPoint.name}`,
          orb:               Math.round(orb * 100) / 100,
          is_primary:        orb <= 3,
          is_personal:       true,
          is_applying:       applying,
        });
      }
    }
  }

  // Sort: applying first, then by orb ascending
  tags.sort((a, b) => {
    if (a.is_applying !== b.is_applying) return a.is_applying ? -1 : 1;
    return a.orb - b.orb;
  });

  // Cap at 5
  return tags.slice(0, 5);
}

/**
 * Compute collective daily transit energy.
 * Compares transiting planets against each other (not natal).
 * Returns structured data for the daily_transits table.
 */
export function getDailyCollectiveTransits(): DailyTransitData {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const posToday = getPlanetPositions(today);
  const posTomorrow = getPlanetPositions(tomorrow);

  const collectiveTransits: CollectiveTransit[] = [];
  const planetNames = Array.from(posToday.keys());

  for (let i = 0; i < planetNames.length; i++) {
    for (let j = i + 1; j < planetNames.length; j++) {
      const planetA = planetNames[i];
      const planetB = planetNames[j];
      const posA = posToday.get(planetA)!;
      const posB = posToday.get(planetB)!;
      const posANext = posTomorrow.get(planetA)!;

      for (const aspect of MAJOR_ASPECTS) {
        const diff = angularDiff(posA.lon, posB.lon);
        const orb = Math.abs(diff - aspect.angle);
        if (orb > COLLECTIVE_ORB) continue;

        const applying = isApplying(posA.lon, posANext.lon, posB.lon, aspect.angle);
        const transitKey = `${planetA.toLowerCase()}_${aspect.abbr}_${planetB.toLowerCase()}`;

        // Estimate when aspect is exact (simple linear interpolation)
        const orbChange = (() => {
          const orbNow = Math.abs(angularDiff(posA.lon, posB.lon) - aspect.angle);
          const orbNext = Math.abs(angularDiff(posANext.lon, posB.lon) - aspect.angle);
          return orbNow - orbNext; // degrees per day change
        })();
        const hoursToExact = orbChange > 0 ? (orb / orbChange) * 24 : null;
        const aspectPrecision = hoursToExact !== null
          ? new Date(Date.now() + hoursToExact * 3_600_000).toISOString()
          : null;

        const vibeKey = [planetA, planetB].sort().join('-');
        const vibe = ASPECT_VIBES[aspect.name]?.[vibeKey]
          ?? ASPECT_VIBES[aspect.name]?.default
          ?? "Cosmic energies in dialogue.";

        collectiveTransits.push({
          transit_key:       transitKey,
          display_name:      `${planetA} ${aspect.name} ${planetB}`,
          transiting_planet: planetA,
          aspect:            aspect.name,
          target_planet:     planetB,
          orb:               Math.round(orb * 100) / 100,
          is_applying:       applying,
          aspect_precision:  aspectPrecision,
          vibe,
        });
      }
    }
  }

  if (collectiveTransits.length === 0) {
    // No aspects within 1° today — return a placeholder
    return {
      dominant_transit: "Moon in Flow",
      transit_key:      "moon_flow",
      description:      "A quiet day cosmically. Good for reflection.",
      aspect_precision: null,
      transits:         [],
    };
  }

  // Score by planet weights; pick dominant
  const scored = collectiveTransits.map(t => ({
    t,
    score: (PLANET_WEIGHT[t.transiting_planet] ?? 1) * (PLANET_WEIGHT[t.target_planet] ?? 1),
  }));
  scored.sort((a, b) => b.score - a.score || a.t.orb - b.t.orb);
  const dominant = scored[0].t;

  return {
    dominant_transit: dominant.display_name,
    transit_key:      dominant.transit_key,
    description:      dominant.vibe,
    aspect_precision: dominant.aspect_precision,
    transits:         collectiveTransits,
  };
}
```

### Step 2: Verify it type-checks

```bash
npx tsc --noEmit
```

Expected: no errors in `src/lib/transitEngine.ts`.

### Step 3: Commit

```bash
git add src/lib/transitEngine.ts
git commit -m "feat: add client-side transit calculation engine"
```

---

## Task 4: useDailyTransits Hook

**Files:**
- Create: `src/hooks/useDailyTransits.ts`

Fetches or computes today's collective transit energy. Uses React Query with a 24h stale time. If today's row is missing, computes it client-side and upserts it.

### Step 1: Create the hook

Create `src/hooks/useDailyTransits.ts`:

```typescript
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDailyCollectiveTransits, CollectiveTransit } from "@/lib/transitEngine";
import { useClerk } from "@clerk/clerk-react";
import { getAuthenticatedClient } from "@/integrations/supabase/authClient";

export interface DailyTransitsRow {
  date: string;
  dominant_transit: string;
  transit_key: string;
  description: string | null;
  aspect_precision: string | null;
  transits: CollectiveTransit[];
}

export function useDailyTransits() {
  const { session } = useClerk();

  return useQuery<DailyTransitsRow | null>({
    queryKey: ["daily-transits", new Date().toISOString().slice(0, 10)],
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

      // 1. Try to read existing row (public, anon key)
      const { data, error } = await (supabase as any)
        .from("daily_transits")
        .select("*")
        .eq("date", today)
        .maybeSingle();

      if (error) {
        console.error("daily_transits fetch error:", error);
        return null;
      }

      if (data) {
        return data as DailyTransitsRow;
      }

      // 2. Row missing — compute and upsert (first writer of the day)
      const computed = getDailyCollectiveTransits();
      const row = {
        date:             today,
        dominant_transit: computed.dominant_transit,
        transit_key:      computed.transit_key,
        description:      computed.description,
        aspect_precision: computed.aspect_precision,
        transits:         computed.transits,
        computed_at:      new Date().toISOString(),
      };

      // Try to write with Clerk JWT (required by RLS); fall back to anon
      try {
        const token = await session?.getToken({ template: "supabase" });
        const client = token ? getAuthenticatedClient(token) : (supabase as any);
        await (client as any)
          .from("daily_transits")
          .upsert(row, { onConflict: "date", ignoreDuplicates: true });
      } catch {
        // Write failed (user not logged in or JWT template not configured yet)
        // Return computed data without persisting — still useful locally
        console.warn("Could not persist daily_transits row. Running in compute-only mode.");
      }

      return {
        date:             today,
        dominant_transit: computed.dominant_transit,
        transit_key:      computed.transit_key,
        description:      computed.description,
        aspect_precision: computed.aspect_precision,
        transits:         computed.transits,
      };
    },
  });
}
```

### Step 2: Commit

```bash
git add src/hooks/useDailyTransits.ts
git commit -m "feat: add useDailyTransits hook with first-writer-of-day sync"
```

---

## Task 5: useFeed Hook (Public Read, Infinite Scroll)

**Files:**
- Create: `src/hooks/useFeed.ts`

Fetches posts with their transit tags and author profile data. Public read, anon key, no auth needed.

### Step 1: Create the hook

Create `src/hooks/useFeed.ts`:

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 20;

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  // Joined from profiles
  display_name: string | null;
  avatar_url: string | null;
  sun_sign: string | null;
  moon_sign: string | null;
  rising_sign: string | null;
  // Joined from post_transit_tags
  transit_tags: Array<{
    transit_key: string;
    display_name: string;
    orb: number;
    is_primary: boolean;
    is_personal: boolean;
    is_applying: boolean;
  }>;
}

export function useFeed() {
  return useInfiniteQuery<FeedPost[], Error>({
    queryKey: ["feed"],
    initialPageParam: 0,
    staleTime: 60_000, // 1 minute
    queryFn: async ({ pageParam = 0 }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Fetch posts
      const { data: posts, error: postsError } = await (supabase as any)
        .from("posts")
        .select("id, user_id, content, likes_count, comments_count, created_at")
        .eq("is_public", true)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (postsError) throw postsError;
      if (!posts || posts.length === 0) return [];

      const postIds = posts.map((p: any) => p.id);
      const userIds = [...new Set(posts.map((p: any) => p.user_id))];

      // Fetch profiles for all authors in one query
      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("user_id, display_name, avatar_url, sun_sign, moon_sign, rising_sign")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p: any) => [p.user_id, p])
      );

      // Fetch transit tags for all posts in one query
      const { data: tags } = await (supabase as any)
        .from("post_transit_tags")
        .select("post_id, transit_key, display_name, orb, is_primary, is_personal, is_applying")
        .in("post_id", postIds);

      const tagsMap = new Map<string, any[]>();
      for (const tag of (tags ?? [])) {
        const list = tagsMap.get(tag.post_id) ?? [];
        list.push(tag);
        tagsMap.set(tag.post_id, list);
      }

      return posts.map((post: any) => {
        const profile = profileMap.get(post.user_id) ?? {};
        return {
          ...post,
          display_name:    profile.display_name ?? null,
          avatar_url:      profile.avatar_url ?? null,
          sun_sign:        profile.sun_sign ?? null,
          moon_sign:       profile.moon_sign ?? null,
          rising_sign:     profile.rising_sign ?? null,
          transit_tags:    tagsMap.get(post.id) ?? [],
        } as FeedPost;
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length < PAGE_SIZE ? undefined : allPages.length;
    },
  });
}
```

### Step 2: Commit

```bash
git add src/hooks/useFeed.ts
git commit -m "feat: add useFeed infinite scroll hook"
```

---

## Task 6: useCreatePost Hook (Authenticated Write)

**Files:**
- Create: `src/hooks/useCreatePost.ts`

Creates a post + transit tags atomically. Requires Clerk JWT.

### Step 1: Create the hook

Create `src/hooks/useCreatePost.ts`:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClerk } from "@clerk/clerk-react";
import { getAuthenticatedClient } from "@/integrations/supabase/authClient";
import { TransitTag } from "@/lib/transitEngine";
import { useAuth } from "@/hooks/useAuth";

interface CreatePostInput {
  content: string;
  transitTags: TransitTag[];
}

export function useCreatePost() {
  const { session } = useClerk();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ content, transitTags }: CreatePostInput) => {
      if (!user) throw new Error("Must be signed in to post");

      const token = await session?.getToken({ template: "supabase" });
      if (!token) throw new Error("Could not get auth token — check Clerk JWT template setup");

      const client = getAuthenticatedClient(token);

      // Insert post
      const { data: post, error: postError } = await (client as any)
        .from("posts")
        .insert({
          user_id:  user.id,
          content,
          is_public: true,
        })
        .select("id")
        .single();

      if (postError) throw postError;

      // Insert transit tags (if any)
      if (transitTags.length > 0) {
        const tagRows = transitTags.map(tag => ({
          post_id:           post.id,
          transit_key:       tag.transit_key,
          transiting_planet: tag.transiting_planet,
          aspect:            tag.aspect,
          natal_point:       tag.natal_point,
          display_name:      tag.display_name,
          orb:               tag.orb,
          is_primary:        tag.is_primary,
          is_personal:       tag.is_personal,
          is_applying:       tag.is_applying,
        }));

        const { error: tagsError } = await (client as any)
          .from("post_transit_tags")
          .insert(tagRows);

        if (tagsError) {
          // Post is created, tags failed — log but don't throw
          console.error("Transit tags insert failed:", tagsError);
        }
      }

      return post;
    },
    onSuccess: () => {
      // Invalidate feed so new post appears at top
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
```

### Step 2: Commit

```bash
git add src/hooks/useCreatePost.ts
git commit -m "feat: add useCreatePost mutation with Clerk JWT"
```

---

## Task 7: useToggleLike + useComments Hooks

**Files:**
- Create: `src/hooks/useToggleLike.ts`
- Create: `src/hooks/useComments.ts`

### Step 1: Create useToggleLike

Create `src/hooks/useToggleLike.ts`:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useClerk } from "@clerk/clerk-react";
import { getAuthenticatedClient } from "@/integrations/supabase/authClient";
import { useAuth } from "@/hooks/useAuth";

export function useToggleLike() {
  const { session } = useClerk();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error("Must be signed in to like");
      const token = await session?.getToken({ template: "supabase" });
      if (!token) throw new Error("Could not get auth token");
      const client = getAuthenticatedClient(token);

      if (isLiked) {
        // Remove like
        await (client as any)
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
      } else {
        // Add like
        await (client as any)
          .from("post_likes")
          .insert({ post_id: postId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
```

### Step 2: Create useComments

Create `src/hooks/useComments.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getAuthenticatedClient } from "@/integrations/supabase/authClient";
import { useClerk } from "@clerk/clerk-react";
import { useAuth } from "@/hooks/useAuth";

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function useComments(postId: string, enabled = false) {
  return useQuery<Comment[]>({
    queryKey: ["comments", postId],
    enabled,
    queryFn: async () => {
      const { data: comments, error } = await (supabase as any)
        .from("post_comments")
        .select("id, post_id, user_id, content, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!comments || comments.length === 0) return [];

      const userIds = [...new Set(comments.map((c: any) => c.user_id))];
      const { data: profiles } = await (supabase as any)
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p: any) => [p.user_id, p])
      );

      return comments.map((c: any) => ({
        ...c,
        display_name: profileMap.get(c.user_id)?.display_name ?? null,
        avatar_url:   profileMap.get(c.user_id)?.avatar_url ?? null,
      }));
    },
  });
}

export function useAddComment(postId: string) {
  const { session } = useClerk();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error("Must be signed in to comment");
      const token = await session?.getToken({ template: "supabase" });
      if (!token) throw new Error("Could not get auth token");
      const client = getAuthenticatedClient(token);

      const { error } = await (client as any)
        .from("post_comments")
        .insert({ post_id: postId, user_id: user.id, content });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
```

### Step 3: Commit

```bash
git add src/hooks/useToggleLike.ts src/hooks/useComments.ts
git commit -m "feat: add useToggleLike and useComments hooks"
```

---

## Task 8: DailyHookCard Component

**Files:**
- Create: `src/components/feed/DailyHookCard.tsx`

Sticky card at top of feed showing dominant collective transit with a countdown to peak intensity.

### Step 1: Create the component

Create `src/components/feed/DailyHookCard.tsx`:

```tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronDown } from "lucide-react";
import { useDailyTransits } from "@/hooks/useDailyTransits";
import { CollectiveTransit } from "@/lib/transitEngine";

function useCountdown(targetIso: string | null) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!targetIso) {
      setTimeLeft("");
      return;
    }

    const tick = () => {
      const ms = new Date(targetIso).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft("Now");
        return;
      }
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setTimeLeft(`${h}h ${m.toString().padStart(2, "0")}m`);
    };

    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return timeLeft;
}

function ProgressBar({ targetIso }: { targetIso: string | null }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!targetIso) return;
    const target = new Date(targetIso).getTime();
    const windowMs = 24 * 3_600_000; // Show progress over 24h window
    const start = target - windowMs;

    const tick = () => {
      const now = Date.now();
      const p = Math.min(1, Math.max(0, (now - start) / windowMs));
      setProgress(p);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [targetIso]);

  return (
    <div className="h-1 rounded-full bg-white/20 mt-3 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-yellow-300"
        style={{ width: `${progress * 100}%` }}
        animate={{ boxShadow: progress > 0.7 ? "0 0 8px 2px #fde047" : "none" }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}

function CollectiveForecastSheet({
  transits,
  onClose,
}: {
  transits: CollectiveTransit[];
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60" />
      <motion.div
        className="relative w-full glass-panel rounded-t-2xl p-6 pb-10 max-h-[70vh] overflow-y-auto"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        onClick={e => e.stopPropagation()}
      >
        <h3 className="text-lg font-serif text-ethereal mb-4">Collective Forecast</h3>
        {transits.length === 0 && (
          <p className="text-muted-foreground text-sm">A quiet cosmic day — ideal for inner reflection.</p>
        )}
        {transits.map(t => (
          <div key={t.transit_key} className="mb-4 pb-4 border-b border-border/30 last:border-0">
            <p className="font-medium text-sm">{t.display_name}</p>
            <p className="text-muted-foreground text-xs mt-1">{t.vibe}</p>
            <p className="text-muted-foreground text-xs">Orb: {t.orb.toFixed(1)}° · {t.is_applying ? "Applying" : "Separating"}</p>
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

export default function DailyHookCard() {
  const { data, isLoading } = useDailyTransits();
  const [showSheet, setShowSheet] = useState(false);
  const countdown = useCountdown(data?.aspect_precision ?? null);

  if (isLoading) {
    return (
      <div className="h-24 rounded-xl glass-panel animate-pulse mb-6" />
    );
  }

  if (!data) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-xl overflow-hidden mb-6 cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #1a0533 0%, #0d1b4b 50%, #0a2a1a 100%)",
          boxShadow: "0 0 20px rgba(168, 85, 247, 0.3)",
        }}
        onClick={() => setShowSheet(true)}
      >
        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-yellow-300 text-xs uppercase tracking-widest font-medium">
              Today's Energy
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-serif text-white">
            {data.dominant_transit}
          </h2>

          {data.description && (
            <p className="text-purple-200 text-sm mt-1 line-clamp-1">{data.description}</p>
          )}

          {data.aspect_precision && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-purple-200">
                <span>Peak Intensity</span>
                <span className="font-mono">{countdown || "—"}</span>
              </div>
              <ProgressBar targetIso={data.aspect_precision} />
            </div>
          )}

          <div className="flex items-center gap-1 mt-3 text-purple-300 text-xs">
            <span>Tap for full forecast</span>
            <ChevronDown className="h-3 w-3" />
          </div>
        </div>
      </motion.div>

      {showSheet && (
        <CollectiveForecastSheet
          transits={data.transits}
          onClose={() => setShowSheet(false)}
        />
      )}
    </>
  );
}
```

### Step 2: Commit

```bash
git add src/components/feed/DailyHookCard.tsx
git commit -m "feat: add DailyHookCard component with countdown"
```

---

## Task 9: PostComposer Component

**Files:**
- Create: `src/components/feed/PostComposer.tsx`

Textarea, transit pill auto-tagging on focus, submit button. Requires natal chart data for personal transit computation.

### Step 1: Create the component

Create `src/components/feed/PostComposer.tsx`:

```tsx
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useCreatePost } from "@/hooks/useCreatePost";
import { useDailyTransits } from "@/hooks/useDailyTransits";
import { getPersonalTransits, TransitTag } from "@/lib/transitEngine";
import { NatalChartData } from "@/data/natalChartData";
import { useToast } from "@/hooks/use-toast";

const MAX_CHARS = 280;

const ASPECT_BADGE_COLORS: Record<string, string> = {
  conjunction: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  opposition:  "bg-red-500/20 text-red-300 border-red-500/30",
  square:      "bg-orange-500/20 text-orange-300 border-orange-500/30",
  trine:       "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  sextile:     "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

interface TransitPillProps {
  tag: TransitTag;
  onRemove?: () => void;
  isCollective?: boolean;
}

function TransitPill({ tag, onRemove, isCollective }: TransitPillProps) {
  const baseClass = isCollective
    ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
    : tag.is_primary
    ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
    : "bg-white/5 text-muted-foreground border-border/30";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${baseClass}`}
    >
      {tag.display_name}
      {tag.is_primary && !isCollective && (
        <span className="text-yellow-400 text-[10px]">●</span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 opacity-60 hover:opacity-100 text-[10px] leading-none"
          aria-label={`Remove ${tag.display_name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

interface PostComposerProps {
  chartData: NatalChartData | null;
}

export default function PostComposer({ chartData }: PostComposerProps) {
  const { user } = useAuth();
  const { data: dailyTransits } = useDailyTransits();
  const createPost = useCreatePost();
  const { toast } = useToast();

  const [content, setContent] = useState("");
  const [personalTags, setPersonalTags] = useState<TransitTag[]>([]);
  const [tagsComputed, setTagsComputed] = useState(false);

  const handleFocus = useCallback(() => {
    if (tagsComputed || !chartData) return;
    const tags = getPersonalTransits(
      chartData.planets.map(p => ({ name: p.name, longitude: p.longitude })),
      {
        ascendant: { longitude: chartData.angles.ascendant.longitude },
        midheaven: { longitude: chartData.angles.midheaven.longitude },
      }
    );
    setPersonalTags(tags);
    setTagsComputed(true);
  }, [chartData, tagsComputed]);

  const removeTag = (index: number) => {
    setPersonalTags(prev => prev.filter((_, i) => i !== index));
  };

  const collectiveTag: TransitTag | null = dailyTransits
    ? {
        transit_key:       dailyTransits.transit_key,
        transiting_planet: dailyTransits.dominant_transit.split(" ")[0],
        aspect:            "conjunction", // placeholder aspect type
        natal_point:       "collective",
        display_name:      dailyTransits.dominant_transit,
        orb:               0,
        is_primary:        true,
        is_personal:       false,
        is_applying:       true,
      }
    : null;

  const allTags: TransitTag[] = collectiveTag
    ? [collectiveTag, ...personalTags]
    : personalTags;

  const handleSubmit = async () => {
    if (!content.trim()) return;
    if (content.length > MAX_CHARS) return;

    try {
      await createPost.mutateAsync({ content: content.trim(), transitTags: allTags });
      setContent("");
      setPersonalTags([]);
      setTagsComputed(false);
      toast({ title: "Posted to the cosmos ✨" });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Post failed",
        description: err.message ?? "Something went wrong",
      });
    }
  };

  if (!user) {
    return (
      <div className="glass-panel rounded-xl p-4 mb-6 text-center text-muted-foreground text-sm">
        Sign in to share your cosmic perspective
      </div>
    );
  }

  const charsLeft = MAX_CHARS - content.length;
  const isOverLimit = charsLeft < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-4 mb-6"
    >
      <Textarea
        placeholder="What's the cosmic vibe today?"
        value={content}
        onChange={e => setContent(e.target.value)}
        onFocus={handleFocus}
        className="resize-none border-none bg-transparent focus-visible:ring-0 text-sm min-h-[80px]"
        maxLength={MAX_CHARS + 50} // Allow slight overrun to show counter
      />

      {/* Transit pills */}
      <AnimatePresence>
        {(tagsComputed || collectiveTag) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-1.5 mt-3"
          >
            {collectiveTag && (
              <TransitPill key="collective" tag={collectiveTag} isCollective />
            )}
            {personalTags.map((tag, i) => (
              <TransitPill key={tag.transit_key} tag={tag} onRemove={() => removeTag(i)} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-3">
        <span
          className={`text-xs tabular-nums ${
            isOverLimit
              ? "text-destructive font-medium"
              : charsLeft < 40
              ? "text-yellow-400"
              : "text-muted-foreground"
          }`}
        >
          {charsLeft}
        </span>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!content.trim() || isOverLimit || createPost.isPending}
          className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {createPost.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Post
        </Button>
      </div>
    </motion.div>
  );
}
```

### Step 2: Commit

```bash
git add src/components/feed/PostComposer.tsx
git commit -m "feat: add PostComposer with transit auto-tagging"
```

---

## Task 10: PostCard Component

**Files:**
- Create: `src/components/feed/PostCard.tsx`

Displays a single post with author info, Big Three glyphs, content, transit pills, and like/comment interactions.

### Step 1: Create the component

Create `src/components/feed/PostCard.tsx`:

```tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FeedPost } from "@/hooks/useFeed";
import { useToggleLike } from "@/hooks/useToggleLike";
import { useComments, useAddComment, Comment } from "@/hooks/useComments";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Zodiac sign → glyph
const SIGN_GLYPHS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

function BigThreeGlyphs({ sun, moon, rising }: { sun: string | null; moon: string | null; rising: string | null }) {
  if (!sun && !moon && !rising) return null;
  return (
    <span className="text-muted-foreground text-sm">
      {sun && `☉${SIGN_GLYPHS[sun] ?? ""}`}
      {moon && ` ☽${SIGN_GLYPHS[moon] ?? ""}`}
      {rising && ` ↑${SIGN_GLYPHS[rising] ?? ""}`}
    </span>
  );
}

function TransitPillBadge({ tag }: { tag: FeedPost["transit_tags"][0] }) {
  const colorClass = !tag.is_personal
    ? "bg-blue-500/15 text-blue-300 border-blue-500/25"
    : tag.is_primary
    ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/25"
    : "bg-white/5 text-muted-foreground border-border/20";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClass}`}>
      {tag.display_name}
    </span>
  );
}

function CommentsSection({ postId }: { postId: string }) {
  const [newComment, setNewComment] = useState("");
  const { data: comments, isLoading } = useComments(postId, true);
  const addComment = useAddComment(postId);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    try {
      await addComment.mutateAsync(newComment.trim());
      setNewComment("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Comment failed", description: err.message });
    }
  };

  if (isLoading) return <div className="py-2 text-center text-xs text-muted-foreground">Loading...</div>;

  return (
    <div className="mt-3 pt-3 border-t border-border/20 space-y-2">
      {(comments ?? []).slice(0, 3).map((c: Comment) => (
        <div key={c.id} className="flex gap-2 items-start">
          {c.avatar_url ? (
            <img src={c.avatar_url} alt="" className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5" />
          ) : (
            <div className="w-6 h-6 rounded-full bg-muted flex-shrink-0 mt-0.5" />
          )}
          <div>
            <span className="text-xs font-medium">{c.display_name ?? "Anonymous"}</span>
            <p className="text-xs text-muted-foreground">{c.content}</p>
          </div>
        </div>
      ))}
      {(comments?.length ?? 0) > 3 && (
        <p className="text-xs text-muted-foreground">+ {(comments!.length - 3)} more</p>
      )}
      {user && (
        <div className="flex gap-2 mt-2">
          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            className="resize-none text-xs h-8 min-h-0 py-1.5"
            maxLength={280}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSubmit}
            disabled={!newComment.trim() || addComment.isPending}
            className="h-8 px-2 flex-shrink-0"
          >
            {addComment.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "→"}
          </Button>
        </div>
      )}
    </div>
  );
}

interface PostCardProps {
  post: FeedPost;
  currentUserId?: string;
}

export default function PostCard({ post, currentUserId }: PostCardProps) {
  const toggleLike = useToggleLike();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [isLiked, setIsLiked] = useState(false); // TODO: derive from post_likes query

  const handleLike = async () => {
    if (!user) return;
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    try {
      await toggleLike.mutateAsync({ postId: post.id, isLiked });
    } catch {
      setIsLiked(isLiked); // revert on error
    }
  };

  const timeAgo = (() => {
    const ms = Date.now() - new Date(post.created_at).getTime();
    const m = Math.floor(ms / 60_000);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  })();

  const visibleTags = post.transit_tags.slice(0, 5);
  const extraTagCount = post.transit_tags.length - 5;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel rounded-xl p-4"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {post.avatar_url ? (
          <img src={post.avatar_url} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-muted flex-shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-medium text-sm truncate">
              {post.display_name ?? "Anonymous"}
            </span>
            <BigThreeGlyphs sun={post.sun_sign} moon={post.moon_sign} rising={post.rising_sign} />
            <span className="text-muted-foreground text-xs ml-auto flex-shrink-0">{timeAgo}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>

      {/* Transit tags */}
      {visibleTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {visibleTags.map(tag => (
            <TransitPillBadge key={tag.transit_key} tag={tag} />
          ))}
          {extraTagCount > 0 && (
            <span className="text-xs text-muted-foreground self-center">+{extraTagCount} more</span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/20">
        <button
          onClick={handleLike}
          disabled={!user || toggleLike.isPending}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            isLiked ? "text-rose-400" : "text-muted-foreground hover:text-rose-400"
          }`}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-rose-400" : ""}`} />
          {post.likes_count + (isLiked ? 1 : 0)}
        </button>

        <button
          onClick={() => setShowComments(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          {post.comments_count}
        </button>
      </div>

      {/* Inline comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: "hidden" }}
          >
            <CommentsSection postId={post.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
```

### Step 2: Commit

```bash
git add src/components/feed/PostCard.tsx
git commit -m "feat: add PostCard component"
```

---

## Task 11: Feed Page + Route + Navigation

**Files:**
- Create: `src/pages/Feed.tsx`
- Modify: `src/App.tsx` (add `/feed` route)
- Modify: `src/components/ChartDashboard.tsx` (add Feed tab/link)

### Step 1: Create the Feed page

Create `src/pages/Feed.tsx`:

```tsx
import { useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import DailyHookCard from "@/components/feed/DailyHookCard";
import PostComposer from "@/components/feed/PostComposer";
import PostCard from "@/components/feed/PostCard";
import UserMenu from "@/components/UserMenu";
import { useFeed } from "@/hooks/useFeed";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useEphemeris } from "@/hooks/useEphemeris";
import { BirthData } from "@/components/intake/BirthDataForm";

function FeedList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useFeed();
  const { user } = useAuth();

  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });
    observerRef.current.observe(node);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center text-destructive py-8 text-sm">Failed to load feed. Try refreshing.</p>
    );
  }

  const posts = data?.pages.flat() ?? [];

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="font-serif text-lg mb-2">The cosmos awaits your first post</p>
        <p className="text-sm">Share what's on your mind today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map(post => (
        <PostCard key={post.id} post={post} currentUserId={user?.id} />
      ))}
      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}
      {!hasNextPage && posts.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          You've reached the beginning of time. ✨
        </p>
      )}
    </div>
  );
}

export default function Feed() {
  const { profile } = useProfile();

  // Reconstruct BirthData from profile for transit calculation
  const birthData: BirthData | null = profile?.birth_date && profile?.birth_lat && profile?.birth_lng
    ? {
        name: profile.display_name ?? "You",
        birthDate: profile.birth_date,
        birthTime: profile.birth_time ?? "12:00",
        timeUnknown: profile.time_unknown,
        location: profile.birth_location ?? "",
        latitude: profile.birth_lat,
        longitude: profile.birth_lng,
        timezone: "UTC+0", // approximate; natal chart calculated at birth coords
      }
    : null;

  const { chartData } = useEphemeris(birthData);

  return (
    <div className="min-h-screen">
      {/* Fixed header */}
      <div className="fixed top-4 right-4 z-50">
        <UserMenu />
      </div>

      <main className="container mx-auto px-4 pt-6 pb-24 max-w-2xl">
        {/* Back link */}
        <div className="mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Chart
          </Link>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-serif text-ethereal mb-6"
        >
          Astro Feed
        </motion.h1>

        {/* Sticky Daily Hook */}
        <DailyHookCard />

        {/* Post Composer (only if birth data is loaded) */}
        <PostComposer chartData={chartData} />

        {/* Feed */}
        <FeedList />
      </main>
    </div>
  );
}
```

### Step 2: Add /feed route to App.tsx

In `src/App.tsx`, add:
```tsx
import Feed from "./pages/Feed";
// Inside Routes, before the catch-all:
<Route path="/feed" element={<Feed />} />
```

Full diff for `src/App.tsx`:
```tsx
import Feed from "./pages/Feed";
// Add route:
<Route path="/feed" element={<Feed />} />
```

### Step 3: Add Feed navigation link in ChartDashboard

In `src/components/ChartDashboard.tsx`, import `Link` from react-router-dom and add a "Feed" button to the header area. Add after the `<main>` opening tag or near the UserMenu:

```tsx
import { Link } from "react-router-dom";

// In the JSX, add a Feed link (e.g., near the top action bar):
<Link
  to="/feed"
  className="fixed top-4 left-4 z-50 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
>
  <MessageSquare className="h-4 w-4" />
  Feed
</Link>
```

Import `MessageSquare` from lucide-react at the top of ChartDashboard.tsx.

### Step 4: Verify the app builds

```bash
npm run build
```

Expected: No TypeScript errors, successful build.

### Step 5: Test the feed locally

```bash
npm run dev
```

1. Open http://localhost:8080/feed
2. Daily Hook card should appear (or show loading state)
3. Sign in via Clerk
4. Try posting (requires JWT template configured)
5. Post should appear in feed

### Step 6: Commit

```bash
git add src/pages/Feed.tsx src/App.tsx src/components/ChartDashboard.tsx
git commit -m "feat: add Feed page, route, and navigation link"
```

---

## Known Limitations & Follow-up

| Item | Status | Notes |
|------|--------|-------|
| Clerk JWT template | Manual config required | Steps in Task 1; if Supabase plan doesn't support custom JWKS, use service-role key via Edge Function as fallback |
| `isLiked` state | Approximate | PostCard shows optimistic like state; accurate state requires fetching `post_likes` for current user |
| Supabase types | `(supabase as any)` casts | After migrations, regenerate types with `supabase gen types typescript` and remove casts |
| Transit engine accuracy | ~2ms, good enough | Celestine ecliptic longitudes are accurate; applying/separating uses linear interpolation |
| Feed navigation | Simple back link | Add to a persistent navbar in v2 |
| Vercel deployment | Push triggers auto-deploy | Ensure `VITE_CLERK_PUBLISHABLE_KEY` and Supabase vars are set in Vercel dashboard |
