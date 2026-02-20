# Astro-Profile & Living Feed Redesign — Design Document

**Date:** 2026-02-19
**Scope:** Tiers 1 + 2 — Profile redesign, Feed enhancements, Match discovery, Floating nav
**Status:** Approved

---

## Goal

Transform Cosmic Calculations from a chart calculator into a premium social astrology network. Move from static data dumps to a "living" experience where the natal chart is an interactive identity, the feed has cosmic context, and users can discover compatible souls.

## Architecture Overview

All existing heavy components (`NatalChartWheel`, `AspectLines`, `PlanetDetails`, `HouseDetails`, `GlossaryPopover`, `CompatibilityScorecard`, `TodaysPlanetaryBar`, `DailyInsightPanel`) are retained and re-surfaced. New work is primarily layout, wiring, one schema migration, and two new pages.

**Tech Stack:** React 18, React Router v6, shadcn/ui (vaul Drawer), Tailwind CSS, Supabase, Clerk auth

---

## Section 1: Navigation Architecture

### BottomNav Component (`src/components/BottomNav.tsx`)

A single global floating bottom bar renders on all authenticated pages. It uses a `backdrop-blur` glass panel so content scrolls underneath.

**4 tabs:**

| Tab | Icon | Route/Action | Active Color |
|-----|------|-------------|--------------|
| Sky | `✦` | `/feed` | Deep violet |
| Match | `⚝` | `/match` | Soft gold |
| Post | `⊕` | Opens PostComposer sheet (no route change) | — |
| You | `👤` | `/profile` | Solar yellow |

**Behavior:**
- Post tab opens `PostComposer` as a vaul bottom sheet; does not navigate away, preserving feed scroll position. The composer pre-populates with the current transit metadata from `useDailyTransits`.
- Active tab displays with accent glow. Icons only on mobile (`< sm`); icons + labels at `sm:` breakpoint.
- Touch targets: minimum 44×44px on all tab items.
- Z-index: BottomNav sits above page content but below vaul Drawer sheets and GlossaryPopover modals.
- `pb-safe` padding for iOS home indicator.
- Compatibility badge: if any Match score exceeds 85%, a pulsing gold dot appears on the `⚝` icon. Computed by `useMatchFeed`, stored in component state.

**Route changes:** `App.tsx` renders `<BottomNav />` inside `AuthGuard` wrapper routes. It does not appear on `/sign-in` or `/onboarding`.

---

## Section 2: The Digital Soul (Profile Redesign)

### Layout change: tabs → single scrollable page

The existing two-tab layout (Profile | Chart) is replaced with one continuous scroll. This turns the profile into a scrollable narrative rather than a settings page.

### Zone 1 — Identity Header (sticky)

```
[ Avatar ]  Display Name
            [ CompatibilityPulse ring — other profiles only ]

[ ☀ LEO ] [ ☽ SCORPIO ] [ ↑ GEMINI ]    ← Trinity Widget
[ ☿ Virgo · 3rd ] [ ♀ Libra · 7th ] [ ♂ Aries · 1st ]  ← ScrollArea pill chips

[ ✦ "Surviving my Saturn Return" ]       ← Current Vibe status
```

**Trinity Widget:**
- Three cards in a row, each shows planet glyph + sign name in bold caps + house number
- Subtle CSS `@keyframes` pulse ring around each card (no external animation library)
- Tapping any card opens the `GlossaryPopover` for that placement

**Pill Tags (Mercury / Venus / Mars):**
- Horizontal `<ScrollArea>` of chip components: `☿ Virgo · 3rd`, `♀ Libra · 7th`, `♂ Aries · 1st`
- Tapping a chip opens `GlossaryPopover` explaining that placement inline

**CompatibilityPulse:**
- Appears only when `userId !== currentUser.id` (viewing someone else's profile)
- Renders synastry score as a colored ring around the avatar: gold/green for high scores, muted for low
- Uses existing `CompatibilityScorecard` logic, result passed as a prop

**Sticky collapse behavior:**
- As user scrolls down past Zone 1, the header shrinks to a slim bar showing only the Big Three glyphs (e.g., `☀♌ ☽♏ ↑♊`) — keeping identity visible throughout the scroll

### Zone 2 — The Living Chart (inline)

```
┌─────────────────────────────────────┐
│        NatalChartWheel              │
│   (full-width, square aspect ratio) │
│  [ghost: Aspects toggle] [ghost: House selector] │
└─────────────────────────────────────┘
```

- `NatalChartWheel` renders full-width. Aspect toggle and House System selector move inside the chart card as ghost icon buttons, keeping the chart as the visual focal point.
- Tapping a planet or house slice fires `onPlanetSelect(planet)` or `onHouseSelect(house)` → opens a vaul `Drawer` from the bottom
- **Drawer contents:** planet glyph + sign + degree + house label + one-sentence interpretation + "Learn more" that expands `GlossaryPopover` inline
- Existing `PlanetDetails`, `HouseDetails`, and `GlossaryPopover` components are composed inside the Drawer — no new interpretation logic

### Zone 3 — The Astro-Bio (below chart)

- About section (`bio` field) — unchanged
- Mercury / Venus / Mars bio cards — refreshed visual: pill icon header (glyph + label) instead of emoji text prefix
- These serve as the narrative "why" to the chart's "what"

### Edit mode
Edit controls (Edit button, Save, display name input, visibility toggle) remain, but only render for own profile (`userId === currentUser.id`). No change to save logic.

---

## Section 3: The Living Feed (Transit Journal)

### 3a — Sky Header

`TodaysPlanetaryBar` moves to the very top of `/feed` as a one-line horizontal "weather strip."

- Mercury retrograde → bar background shifts to amber; serves as a passive mood-setter
- Tapping the bar expands `DailyInsightPanel` as a full-width vaul Drawer (same pattern as chart Drawer)

### 3b — Vibe Progress Bar

Lives inside the expanded `DailyInsightPanel` (not in the main feed — keeps feed clean).

```
← Smooth ————[●]————————— Electric →
   Trines/Sextiles          Squares/Oppositions
```

**Logic:**
1. Pull current aspects from `useEphemeris`
2. Score: trine/sextile = +1, square/opposition = −1, conjunction = 0
3. Sum → normalize to 0–100
4. Label thresholds: 0–25 = `Smooth`, 26–50 = `Active`, 51–75 = `Electric`, 76–100 = `Transformative` (triggered when a Pluto aspect is present)

**Implementation:** single CSS gradient bar, no chart library.

### 3c — Transit Stamp on Posts

**Schema migration (Supabase):**
```sql
ALTER TABLE posts ADD COLUMN transit_snapshot JSONB;
-- example value: [{"planet":"Moon","sign":"Libra","glyph":"☽♎"},{"planet":"Mercury","sign":"Virgo","glyph":"☿♍"},{"planet":"Sun","sign":"Aquarius","glyph":"☀♒"}]
```

**PostComposer change:** at submit time, auto-captures top 3 transits from `useDailyTransits` and includes them in the insert payload. No user action required.

**PostCard change:** if `transit_snapshot` is non-null, render a tiny glyph string in the top-right corner of the card (e.g., `☽♎ ☿♍ ☀♒`). Tapping opens a popover showing the 3 transits with one-liners. Old posts (null) render nothing — no backfill.

---

## Section 4: Match / User Discovery

### New pages and routes

```tsx
// App.tsx additions
<Route path="/match" element={<AuthGuard><Match /></AuthGuard>} />
<Route path="/profile/:userId" element={<AuthGuard><PublicProfile /></AuthGuard>} />
```

### `/match` — Discovery Feed

**`useMatchFeed` hook:**
1. Fetch up to 50 public profiles from Supabase: `WHERE is_public = true AND birth_date IS NOT NULL AND birth_lat IS NOT NULL`
2. Exclude current user
3. For each profile, run existing synastry scoring logic against current user's chart
4. Sort descending by score
5. Memoize results for the session (no recompute on tab switch)

**Card layout (vertical list, not grid):**
```
[ Avatar ]  Display Name
            ☀ Leo · ☽ Scorpio · ↑ Gemini
            [ ████████░░ 78% Synastry ]
```

- Score bar uses the same accent color logic as CompatibilityPulse (gold/green for high)
- Tapping a card navigates to `/profile/:userId`
- Compatibility badge on BottomNav `⚝`: if any score > 85%, pulsing gold dot

### `/profile/:userId` — Public Profile View

Identical layout to own profile (Zones 1–3) with these differences:
- No edit controls
- CompatibilityPulse ring visible next to avatar
- Back button returns to `/match`
- If `is_public = false`: render a "This profile is private" state (not a full 404)

---

## Deferred (v2)

**Shared History Filter** ("Our Mercury Retrograde Moments"): the `transit_snapshot` column will have the data by the time this is built. Requires a date-range query across two users' posts filtered by transit type. Defer to a future sprint.

**Haptic feedback**: `navigator.vibrate()` calls on tab switch, pill tap, and Drawer open. Low-effort add-on after core UI is stable.

**Synastry Chat / DMs**: requires real-time backend (Supabase Realtime or similar). Out of scope for this sprint.

---

## Open Questions (resolved)

- Match tab → User Discovery (not manual entry) ✓
- Vibe Bar → inside DailyInsightPanel, not main feed ✓
- Profile → single scrollable page, tabs removed ✓
- Post tab → sheet (no route change), pre-populated with current transits ✓
