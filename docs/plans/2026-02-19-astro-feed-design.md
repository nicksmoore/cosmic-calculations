# Astro-Feed (Transit Feed) Design

**Date:** 2026-02-19
**Project:** CelestialSync (cosmic-calculations)
**Phase:** Social — Phase 2B (Transit Feed first)

## Goal

Transform CelestialSync from a calculation utility into a daily-use social destination. The Transit Feed is the "daily hook" — a global post stream where every entry is automatically tagged with the user's active personal transits plus the collective day's dominant transit energy. Over time, users discover their own patterns: "I always post about being drained when Saturn is within 3° of my natal Moon."

---

## Architecture

### Auth: Clerk → Supabase JWT Template

We use Clerk for auth (already in place). Supabase row-level security requires its own `auth.uid()`. We bridge them via Clerk's Supabase JWT template:

1. **Clerk Dashboard:** Create JWT Template named `supabase`. Map `sub` claim to Clerk user ID.
2. **Supabase Dashboard:** Add Clerk JWKS URL to Auth → JWT Settings (custom signing key).
3. **Frontend:** Replace bare anon key usage with `await clerk.session.getToken({ template: 'supabase' })` when making authenticated Supabase calls. Read-only (public feed) calls continue using the anon key.
4. **Profiles table:** Change `user_id` column type from `uuid` → `text` to accommodate Clerk IDs (`user_2abc...`).

RLS then works transparently: `auth.uid()` returns the Clerk user ID as a string.

---

## Database Schema

### Modify existing: `profiles`
- Change `user_id uuid` → `user_id text`
- Update all RLS policies to compare `auth.uid()::text = user_id`

### New: `posts`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     text NOT NULL                          -- Clerk user ID
content     text NOT NULL CHECK (char_length(content) <= 280)
is_public   boolean NOT NULL DEFAULT true
likes_count integer NOT NULL DEFAULT 0            -- denormalized
comments_count integer NOT NULL DEFAULT 0         -- denormalized
deleted_at  timestamptz                           -- soft delete
report_count integer NOT NULL DEFAULT 0           -- moderation
created_at  timestamptz NOT NULL DEFAULT now()
updated_at  timestamptz NOT NULL DEFAULT now()
```

RLS:
```sql
SELECT: is_public = true OR auth.uid() = user_id
INSERT: auth.uid() = user_id
UPDATE: auth.uid() = user_id
DELETE: auth.uid() = user_id  -- (soft delete preferred)
```

### New: `post_transit_tags`
```sql
id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
post_id           uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE
transit_key       text NOT NULL    -- e.g. "saturn_cnj_moon" (indexed)
transiting_planet text NOT NULL    -- e.g. "Saturn"
aspect            text NOT NULL    -- e.g. "conjunction"
natal_point       text NOT NULL    -- e.g. "Moon"
display_name      text NOT NULL    -- e.g. "Saturn conjunct Moon"
orb               numeric NOT NULL -- degrees, lower = tighter
is_primary        boolean NOT NULL -- true if orb ≤ 3°
is_personal       boolean NOT NULL -- true = natal hit, false = collective
is_applying       boolean NOT NULL -- true = moving toward exact
```

Index: `transit_key` for feed filtering ("show all posts with this transit").
RLS: publicly readable; insert allowed when `auth.uid() = (SELECT user_id FROM posts WHERE id = post_id)`.

### New: `post_likes`
```sql
post_id   uuid REFERENCES posts(id) ON DELETE CASCADE
user_id   text NOT NULL
created_at timestamptz NOT NULL DEFAULT now()
PRIMARY KEY (post_id, user_id)
```

Trigger on insert/delete: increments/decrements `posts.likes_count`.

### New: `post_comments`
```sql
id         uuid PRIMARY KEY DEFAULT gen_random_uuid()
post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE
user_id    text NOT NULL
content    text NOT NULL CHECK (char_length(content) <= 280)
created_at timestamptz NOT NULL DEFAULT now()
```

RLS: publicly readable; insert when `auth.uid() = user_id`.
Trigger on insert: increments `posts.comments_count`.

### New: `daily_transits`
```sql
date             date PRIMARY KEY
dominant_transit text NOT NULL       -- e.g. "Saturn square Pluto"
transit_key      text NOT NULL       -- e.g. "saturn_sq_pluto"
description      text                -- one-line vibe description
aspect_precision timestamptz         -- UTC moment of exact aspect (for countdown)
transits         jsonb NOT NULL      -- full array of significant collective transits
computed_at      timestamptz NOT NULL DEFAULT now()
```

JSONB shape for `transits`:
```json
[
  {
    "transit_key": "saturn_sq_pluto",
    "display_name": "Saturn square Pluto",
    "transiting_planet": "Saturn",
    "aspect": "square",
    "target_planet": "Pluto",
    "orb": 0.8,
    "is_applying": true,
    "aspect_precision": "2026-02-19T14:32:00Z",
    "vibe": "Power struggles and pressure to restructure."
  }
]
```

UPSERT uses `ON CONFLICT (date) DO NOTHING` to handle the race condition when multiple users trigger the first-write simultaneously at midnight UTC.

---

## Transit Calculation Engine

Two separate calculations, both running client-side in the main thread (celestine library, already in bundle — ~2ms per calculation on modern devices).

### A) Collective Daily Energy (once per day, cached)

1. On app load, fetch `daily_transits` for today's date (anon key, public read).
2. If row exists → use it.
3. If not → compute in browser:
   - Get today's transiting planet positions via celestine.
   - Calculate aspects between transiting planets only (not natal).
   - Filter: major aspects (conjunction 0°, opposition 180°, square 90°, trine 120°, sextile 60°), within 1° orb.
   - Score by impact: outer planets (Saturn, Uranus, Neptune, Pluto) score 3×; Jupiter/Mars score 2×; inner planets score 1×.
   - Highest scorer = dominant transit. Store `aspect_precision` for countdown.
   - UPSERT to `daily_transits` with `ON CONFLICT DO NOTHING`.
4. Display in the sticky Daily Hook card.

### B) Personal Transit Tags (per user, at post time)

Runs when user opens the composer (not on every keystroke).

1. Pull birth data from `profiles` (already in local state post-login).
2. Compute natal chart positions once via celestine.
3. Get today's transiting planet positions (reuse from step A).
4. For each transiting planet × each natal point (planets + AC + MC):
   - Compute aspect and orb.
   - Collect all within 6° orb.
5. Sort by:
   - Primary sort: `is_applying` true first (applying transit > separating).
   - Secondary sort: `orb` ascending (tightest first).
6. Cap at 5 tags. Mark top entries with `is_primary = true` if orb ≤ 3°.
7. Build `transit_key` as `"{planet}_{aspect_abbr}_{natal_point}"` (lowercase, e.g., `saturn_cnj_moon`).
8. Display as pill badges in composer before posting.

Aspect abbreviations: `cnj` (conjunction), `opp` (opposition), `sq` (square), `tri` (trine), `sxt` (sextile).

---

## Feed UI/UX

### Daily Hook Card (sticky top)
- Gradient background (nebula theme), pulsing glow animation.
- Shows dominant transit name + one-line vibe description.
- **Peak Intensity:** Progress bar + countdown (`HHh MMm`) to `aspect_precision`. Bar fills and glow intensifies as the moment approaches.
- Tapping opens a "Collective Forecast" bottom sheet with full `transits` array.

### Post Composer
- 280-char textarea.
- Personal transit pills appear below input when composer is focused (calculated once on focus).
- Pills: gold background = primary (orb ≤ 3°), muted = secondary, blue = collective daily transit (auto-appended).
- Tap a pill to remove it before posting.
- Collective daily transit is always appended as a non-removable pill (marks communal context).
- Character counter bottom-right.

### Post Card
- **Header:** Avatar (32px) + display name + Big Three as glyphs (`☀️♈ 🌙♋ ↑♏`) — glyphs only, no text labels. Tapping header opens user mini-profile popover.
- **Content:** Post text.
- **Tags row:** Color-coded pills — gold (primary personal), muted gray (secondary personal), soft blue (collective). Max 5 visible, "+N more" overflow.
  - Tapping any tag opens a bottom sheet with: transit name, one-sentence meaning, and "See all posts with this transit" link.
- **Actions:** ♡ count | 💬 count. Tapping 💬 expands inline comments (3 visible, "Load more" link).

### Feed
- Reverse-chronological, no algorithmic ranking in v1.
- Infinite scroll (page size 20).
- Feed is publicly readable (no auth required to view).
- Posting requires auth.

---

## Key Constraints & Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Transit calc location | Client-side, main thread | <2ms, zero latency, celestine already bundled |
| Daily energy sync | First-writer-of-day UPSERT | Ensures communal consistency across all users |
| Algorithmic ranking | None (v1) | Trust and simplicity; add in v2 |
| Web Workers | No (v1) | YAGNI — profile in production first |
| AI sentiment tagging | No (v1) | Rule-based tags build clean dataset for v2 AI |
| Applying vs separating | Sort applying first | "Buildup" feels more relevant than "yesterday's news" |
| Moderation | `deleted_at` + `report_count` columns | Future-proof without building UI today |
| Post visibility | `is_public` field on posts | Enables private journal mode without schema change |
