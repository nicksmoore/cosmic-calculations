# Astro-Profile & Living Feed Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the app into a premium social astrology network with a floating bottom nav, a redesigned single-scroll profile (Trinity Widget + Planetary Drawer), a living feed with Transit Stamps and a Sky Header, and a user-discovery Match page.

**Architecture:** All heavy components (NatalChartWheel, AspectLines, PlanetDetails, HouseDetails, CompatibilityScorecard, TodaysPlanetaryBar, DailyInsightPanel) already exist — this plan is about wiring them into new surfaces. One Supabase migration adds a `transit_snapshot` JSONB column. The Match page introduces a `calculateChartForProfile` helper (extracted from useEphemeris) for batch compatibility scoring.

**Tech Stack:** React 18, React Router v6, shadcn/ui (Drawer + Sheet already installed), Tailwind CSS, Supabase (anon client for public reads), Clerk auth, `celestine` ephemeris library.

---

## Context for every task

Key files:
- `src/App.tsx` — route tree and ClerkProvider
- `src/components/AuthGuard.tsx` — auth wrapper for protected routes
- `src/pages/Feed.tsx` — main feed page
- `src/pages/Profile.tsx` — own profile page (to be rewritten)
- `src/components/feed/PostCard.tsx` — individual post card
- `src/components/feed/PostComposer.tsx` — post creation form
- `src/hooks/useCreatePost.ts` — post insert mutation
- `src/hooks/useFeed.ts` — infinite feed query + FeedPost type
- `src/hooks/useEphemeris.ts` — natal chart calc (wraps `celestine.calculateChart`)
- `src/hooks/useProfile.ts` — own profile fetch/update
- `src/hooks/useDailyTransits.ts` — today's collective transits
- `src/lib/synastry/compatibility.ts` — `calculateCompatibility(natalPlanets, partnerPlanets)` → score 0-100
- `src/components/ui/drawer.tsx` — shadcn Drawer (vaul-based) ✅ already installed
- `src/components/ui/sheet.tsx` — shadcn Sheet ✅ already installed
- `src/components/NatalChartWheel.tsx` — accepts `onSelectPlanet`, `onSelectHouse` callbacks
- `src/components/PlanetDetails.tsx` — renders planet details
- `src/components/HouseDetails.tsx` — renders house details

Design doc: `docs/plans/2026-02-19-astro-profile-redesign-design.md`

---

## Task 1: BottomNav component + App.tsx wiring

**Files:**
- Create: `src/components/BottomNav.tsx`
- Modify: `src/App.tsx`

**What it does:** Floating glass bottom bar with 4 tabs: Sky (`/feed`), Match (`/match`), Post (opens Sheet), You (`/profile`). Renders on all authenticated pages via App.tsx layout. Post tab sheet wiring happens in Task 6.

### Step 1: Create BottomNav.tsx

```tsx
// src/components/BottomNav.tsx
import { NavLink, useLocation } from "react-router-dom";

const tabs = [
  { label: "Sky",   icon: "✦", to: "/feed" },
  { label: "Match", icon: "⚝", to: "/match" },
  { label: "You",   icon: "👤", to: "/profile" },
] as const;

interface BottomNavProps {
  onOpenPost: () => void;
}

export default function BottomNav({ onOpenPost }: BottomNavProps) {
  const location = useLocation();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 inset-x-0 z-40 pb-safe"
    >
      <div className="mx-auto max-w-2xl px-4 pb-4">
        <div className="glass-panel border border-border/30 rounded-2xl flex items-center justify-around px-2 py-3 backdrop-blur-xl shadow-2xl">
          {tabs.slice(0, 2).map((tab) => {
            const isActive = location.pathname === tab.to;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                aria-label={tab.label}
                className={`flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-xl transition-all ${
                  isActive
                    ? "text-accent [text-shadow:0_0_12px_hsl(var(--accent)/0.8)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className="text-[10px] hidden sm:block">{tab.label}</span>
              </NavLink>
            );
          })}

          {/* Post button — center */}
          <button
            onClick={onOpenPost}
            aria-label="Create post"
            className="flex flex-col items-center justify-center min-w-[44px] min-h-[44px] rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors px-3 py-2 shadow-lg"
          >
            <span className="text-xl leading-none">⊕</span>
            <span className="text-[10px] hidden sm:block">Post</span>
          </button>

          {tabs.slice(2).map((tab) => {
            const isActive = location.pathname === tab.to;
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                aria-label={tab.label}
                className={`flex flex-col items-center gap-0.5 min-w-[44px] min-h-[44px] justify-center rounded-xl transition-all ${
                  isActive
                    ? "text-accent [text-shadow:0_0_12px_hsl(var(--accent)/0.8)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="text-xl leading-none">{tab.icon}</span>
                <span className="text-[10px] hidden sm:block">{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
```

### Step 2: Add a layout wrapper in App.tsx

Wrap authenticated routes with an `AuthedLayout` that renders BottomNav and manages the PostComposer sheet open state. For now, `onOpenPost` is a no-op — it will be wired in Task 6.

Modify `src/App.tsx`:

```tsx
// src/App.tsx
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import AuthGuard from "@/components/AuthGuard";
import BottomNav from "@/components/BottomNav";
import RootRedirect from "./pages/RootRedirect";
import SignInPage from "./pages/SignIn";
import Onboarding from "./pages/Onboarding";
import TransitDetail from "./pages/TransitDetail";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Match from "./pages/Match";
import PublicProfile from "./pages/PublicProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function AuthedLayout() {
  const [postOpen, setPostOpen] = useState(false);

  return (
    <>
      <Outlet context={{ postOpen, setPostOpen }} />
      <BottomNav onOpenPost={() => setPostOpen(true)} />
    </>
  );
}

const App = () => (
  <ClerkProvider
    publishableKey={clerkKey}
    signInForceRedirectUrl="/feed"
    signUpForceRedirectUrl="/onboarding"
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route
              path="/onboarding"
              element={
                <AuthGuard requireBirthData={false}>
                  <Onboarding />
                </AuthGuard>
              }
            />
            {/* Authenticated routes with bottom nav */}
            <Route
              element={
                <AuthGuard>
                  <AuthedLayout />
                </AuthGuard>
              }
            >
              <Route path="/feed" element={<Feed />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/match" element={<Match />} />
              <Route path="/profile/:userId" element={<PublicProfile />} />
              <Route path="/transit" element={<TransitDetail />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
```

**Note:** `Match` and `PublicProfile` pages don't exist yet — create stub files so the app builds:

```tsx
// src/pages/Match.tsx (stub)
export default function Match() {
  return <div className="min-h-screen p-8 text-center text-muted-foreground">Match coming soon</div>;
}

// src/pages/PublicProfile.tsx (stub)
export default function PublicProfile() {
  return <div className="min-h-screen p-8 text-center text-muted-foreground">Profile coming soon</div>;
}
```

### Step 3: Verify build

```bash
cd /Users/nickmoore/cosmic-calculations && npm run build 2>&1 | tail -20
```

Expected: No TypeScript errors. The app builds.

### Step 4: Clean up Feed.tsx old navigation

Remove the `ArrowLeft` back link and the `UserMenu` fixed header from `src/pages/Feed.tsx` (BottomNav replaces them). The `UserMenu` import and usage can be deleted entirely.

In `Feed.tsx`, remove:
```tsx
// REMOVE these:
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import UserMenu from "@/components/UserMenu";

// REMOVE from JSX:
<div className="fixed top-4 right-4 z-50">
  <UserMenu />
</div>
<div className="mb-4">
  <Link to="/" ...>...</Link>
</div>
<motion.h1 ...>Astro Feed</motion.h1>
```

### Step 5: Clean up Profile.tsx old navigation

In `src/pages/Profile.tsx`, the Back button currently goes to `/feed` — keep it but note the full page rewrite happens in Task 7.

### Step 6: Commit

```bash
git add src/components/BottomNav.tsx src/App.tsx src/pages/Match.tsx src/pages/PublicProfile.tsx src/pages/Feed.tsx
git commit -m "feat: add floating BottomNav and authenticated layout with stub Match/PublicProfile pages"
```

---

## Task 2: DB migration — transit_snapshot column

**Files:**
- Modify: `src/hooks/useCreatePost.ts`
- Modify: `src/hooks/useFeed.ts`

**What it does:** Adds `transit_snapshot JSONB` to the `posts` table. Updates the Supabase query and type definitions.

### Step 1: Run migration in Supabase dashboard

Go to your Supabase project → SQL Editor → run:

```sql
ALTER TABLE posts ADD COLUMN IF NOT EXISTS transit_snapshot JSONB;
```

Expected: Success. Old posts will have `transit_snapshot = null`.

### Step 2: Update FeedPost type in useFeed.ts

Add `transit_snapshot` to the `FeedPost` interface and include it in the select query.

In `src/hooks/useFeed.ts`:

```tsx
// In the FeedPost interface, add:
transit_snapshot: Array<{ planet: string; display_name: string; vibe: string }> | null;

// In the Supabase query, change:
.select("id, user_id, content, likes_count, comments_count, created_at")
// TO:
.select("id, user_id, content, likes_count, comments_count, created_at, transit_snapshot")

// In the posts.map() return, add:
transit_snapshot: post.transit_snapshot ?? null,
```

### Step 3: Update CreatePostInput in useCreatePost.ts

```tsx
// In useCreatePost.ts, update CreatePostInput:
interface CreatePostInput {
  content: string;
  transitTags: TransitTag[];
  transitSnapshot?: Array<{ planet: string; display_name: string; vibe: string }>;
}

// In the insert call, add transit_snapshot:
.insert({
  user_id:          user.id,
  content,
  is_public:        true,
  transit_snapshot: transitSnapshot ?? null,
})
```

### Step 4: Verify build

```bash
npm run build 2>&1 | tail -10
```

Expected: No TypeScript errors.

### Step 5: Commit

```bash
git add src/hooks/useFeed.ts src/hooks/useCreatePost.ts
git commit -m "feat: add transit_snapshot column support to posts (DB migration + types)"
```

---

## Task 3: Feed Sky Header (TodaysPlanetaryBar + Mercury retrograde indicator)

**Files:**
- Modify: `src/pages/Feed.tsx`
- Modify: `src/components/TodaysPlanetaryBar.tsx`

**What it does:** Moves `TodaysPlanetaryBar` to the very top of the feed. Adds amber background when Mercury is retrograde.

### Step 1: Add TodaysPlanetaryBar to Feed.tsx

`Feed.tsx` already calls `useEphemeris(birthData)` and has `chartData`. Add the bar at the top of the `<main>` element:

```tsx
// In Feed.tsx JSX, at the top of <main>, before DailyHookCard:
{chartData && (
  <div className="mb-4">
    <TodaysPlanetaryBar chartData={chartData} />
  </div>
)}
```

Import `TodaysPlanetaryBar` at the top of Feed.tsx:
```tsx
import TodaysPlanetaryBar from "@/components/TodaysPlanetaryBar";
```

### Step 2: Add Mercury retrograde detection to TodaysPlanetaryBar

Look at `src/components/TodaysPlanetaryBar.tsx`. It already renders planet chips. We need to detect if Mercury is retrograde by checking the `TransitPlanet` data. 

Find where the planets are mapped — look for Mercury in the planets array. `TransitPlanet` may have a `retrograde` boolean. Search for it:

```bash
grep -n "retrograde" src/components/TodaysPlanetaryBar.tsx src/lib/astrocartography/transits.ts 2>/dev/null | head -20
```

If `TransitPlanet` has `retrograde: boolean`, wrap the bar container in a conditional class:

```tsx
// In TodaysPlanetaryBar, find the outer container div and add:
const mercuryIsRetrograde = transits.find(p => p.name === "Mercury")?.retrograde === true;

// Add to the container className:
className={`... ${mercuryIsRetrograde ? "bg-amber-500/10 border-amber-500/20" : ""}`}
```

If `retrograde` doesn't exist on `TransitPlanet`, skip the indicator — don't add it. YAGNI.

### Step 3: Verify visually

Run the dev server: `npm run dev`

Navigate to `/feed`. The planetary bar should appear at the top before the post feed.

### Step 4: Commit

```bash
git add src/pages/Feed.tsx src/components/TodaysPlanetaryBar.tsx
git commit -m "feat: add TodaysPlanetaryBar Sky Header to feed with Mercury retrograde indicator"
```

---

## Task 4: Vibe Progress Bar in DailyInsightPanel

**Files:**
- Modify: `src/components/DailyInsightPanel.tsx`

**What it does:** Adds a "Vibe" gradient bar below the daily insight text. Reads collective transit aspects from `useDailyTransits` and scores them.

### Step 1: Add VibeBar component inside DailyInsightPanel.tsx

Add this above the `DailyInsightPanel` component in the same file:

```tsx
import { useDailyTransits } from "@/hooks/useDailyTransits";

function VibeBar() {
  const { data: dailyTransits } = useDailyTransits();

  const score = useMemo(() => {
    if (!dailyTransits?.transits?.length) return 50;
    let total = 0;
    for (const t of dailyTransits.transits) {
      switch (t.aspect) {
        case "trine":   total += 1; break;
        case "sextile": total += 1; break;
        case "square":  total -= 1; break;
        case "opposition": total -= 1; break;
        // conjunction and others: 0
      }
    }
    // Normalize: map [-transits.length, +transits.length] to [0, 100]
    const max = dailyTransits.transits.length;
    return Math.round(((total + max) / (2 * max)) * 100);
  }, [dailyTransits]);

  const hasPluto = dailyTransits?.transits.some(t =>
    t.transiting_planet === "Pluto" || t.target_planet === "Pluto"
  );

  const label =
    hasPluto ? "Transformative" :
    score >= 75 ? "Smooth" :
    score >= 50 ? "Active" :
    "Electric";

  return (
    <div className="mt-4 pt-4 border-t border-border/20">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
        <span>← Smooth</span>
        <span className="font-medium text-foreground">{label}</span>
        <span>Electric →</span>
      </div>
      <div className="h-2 rounded-full bg-border/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score}%`,
            background: `linear-gradient(to right, hsl(var(--accent)), ${score < 40 ? "#f97316" : score < 60 ? "#eab308" : "#34d399"})`,
          }}
        />
      </div>
    </div>
  );
}
```

Add `import { useMemo } from "react";` if not already present.

### Step 2: Render VibeBar inside DailyInsightPanel

Find the return JSX in `DailyInsightPanel` and add `<VibeBar />` just before the closing `</motion.div>` of the main container:

```tsx
// Inside DailyInsightPanel's JSX, at the end of the main panel:
<VibeBar />
```

### Step 3: Verify

Run `npm run dev`, navigate to `/feed`, expand the daily insight panel. The Vibe Bar should appear with the gradient.

### Step 4: Commit

```bash
git add src/components/DailyInsightPanel.tsx
git commit -m "feat: add Vibe Progress Bar to DailyInsightPanel"
```

---

## Task 5: Transit Stamp on posts

**Files:**
- Modify: `src/components/feed/PostComposer.tsx`
- Modify: `src/components/feed/PostCard.tsx`

**What it does:** PostComposer captures the top 3 collective transits at post time and passes them to `useCreatePost`. PostCard shows a tappable glyph in the top-right that opens a Popover with the transit snapshot.

### Step 1: Update PostComposer to capture and pass transitSnapshot

In `src/components/feed/PostComposer.tsx`, find `handleSubmit`. The `dailyTransits` from `useDailyTransits()` is already available. Build the snapshot array and pass it to `createPost.mutateAsync`.

```tsx
// In handleSubmit, before the mutateAsync call:
const transitSnapshot = dailyTransits?.transits.slice(0, 3).map(t => ({
  planet:       t.transiting_planet,
  display_name: t.display_name,
  vibe:         t.vibe ?? "",
})) ?? [];

await createPost.mutateAsync({
  content: content.trim(),
  transitTags: allTags,
  transitSnapshot,
});
```

### Step 2: Add Transit Stamp to PostCard

In `src/components/feed/PostCard.tsx`:

1. Add planet glyph map at the top:

```tsx
const PLANET_GLYPHS: Record<string, string> = {
  Sun: "☀", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇",
};
```

2. Import Popover components:

```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
```

3. Add `TransitStamp` component in the file:

```tsx
function TransitStamp({
  snapshot,
}: {
  snapshot: NonNullable<FeedPost["transit_snapshot"]>;
}) {
  const glyphs = snapshot.map(s => PLANET_GLYPHS[s.planet] ?? s.planet[0]).join(" ");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="View sky snapshot at time of post"
          className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors ml-auto flex-shrink-0 px-1"
        >
          {glyphs}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 glass-panel border-border/30 p-3" side="top">
        <p className="text-xs font-medium text-foreground mb-2">Sky at time of post</p>
        <ul className="space-y-1.5">
          {snapshot.map((s, i) => (
            <li key={i} className="text-xs text-muted-foreground">
              <span className="mr-1">{PLANET_GLYPHS[s.planet] ?? "✦"}</span>
              <span className="font-medium text-foreground">{s.display_name}</span>
              {s.vibe && <span> — {s.vibe}</span>}
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
```

4. In the `PostCard` JSX, find the timestamp line and add the stamp next to it:

```tsx
// In the flex row that has the timestamp:
<div className="flex items-baseline gap-2 flex-wrap">
  <span className="font-medium text-sm truncate">
    {post.display_name ?? "Anonymous"}
  </span>
  <BigThreeGlyphs sun={post.sun_sign} moon={post.moon_sign} rising={post.rising_sign} />
  <div className="flex items-center gap-1 ml-auto flex-shrink-0">
    {post.transit_snapshot && post.transit_snapshot.length > 0 && (
      <TransitStamp snapshot={post.transit_snapshot} />
    )}
    <span className="text-muted-foreground text-xs">{timeAgo}</span>
  </div>
</div>
```

### Step 3: Verify build

```bash
npm run build 2>&1 | tail -10
```

Expected: No errors.

### Step 4: Commit

```bash
git add src/components/feed/PostComposer.tsx src/components/feed/PostCard.tsx
git commit -m "feat: add Transit Stamp — capture sky snapshot at post time, display glyph popover in PostCard"
```

---

## Task 6: PostComposer Sheet (Post tab in BottomNav)

**Files:**
- Create: `src/components/PostComposerSheet.tsx`
- Modify: `src/App.tsx`
- Modify: `src/pages/Feed.tsx` (remove inline PostComposer)

**What it does:** The Post tab in BottomNav opens a bottom Drawer containing a self-contained PostComposer. PostComposer is removed from Feed.tsx's inline position.

### Step 1: Create PostComposerSheet.tsx

This component is self-contained — it calls `useProfile` and `useEphemeris` internally to get `chartData`.

```tsx
// src/components/PostComposerSheet.tsx
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import PostComposer from "@/components/feed/PostComposer";
import { useProfile } from "@/hooks/useProfile";
import { useEphemeris } from "@/hooks/useEphemeris";
import { BirthData } from "@/components/intake/BirthDataForm";

interface PostComposerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PostComposerSheet({ open, onOpenChange }: PostComposerSheetProps) {
  const { profile } = useProfile();

  const birthData: BirthData | null =
    profile?.birth_date && profile?.birth_lat && profile?.birth_lng
      ? {
          name:        profile.display_name ?? "You",
          birthDate:   profile.birth_date,
          birthTime:   profile.birth_time ?? "12:00",
          timeUnknown: profile.time_unknown ?? false,
          location:    profile.birth_location ?? "",
          latitude:    profile.birth_lat,
          longitude:   profile.birth_lng,
          timezone:    "UTC+0",
        }
      : null;

  const { chartData } = useEphemeris(birthData);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="glass-panel border-border/30 max-w-2xl mx-auto">
        <DrawerHeader>
          <DrawerTitle className="font-serif text-ethereal">Share with the cosmos</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <PostComposer chartData={chartData} onPosted={() => onOpenChange(false)} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

**Note:** `PostComposer` doesn't have an `onPosted` callback yet — add it in the next step.

### Step 2: Add onPosted callback to PostComposer

In `src/components/feed/PostComposer.tsx`:

```tsx
// Update interface:
interface PostComposerProps {
  chartData: NatalChartData | null;
  onPosted?: () => void;   // <-- add this
}

// In handleSubmit, after the successful post:
toast({ title: "Posted to the cosmos ✨" });
onPosted?.();             // <-- call it
```

### Step 3: Wire PostComposerSheet into AuthedLayout in App.tsx

```tsx
// In App.tsx AuthedLayout:
import PostComposerSheet from "@/components/PostComposerSheet";

function AuthedLayout() {
  const [postOpen, setPostOpen] = useState(false);

  return (
    <>
      <Outlet context={{ postOpen, setPostOpen }} />
      <BottomNav onOpenPost={() => setPostOpen(true)} />
      <PostComposerSheet open={postOpen} onOpenChange={setPostOpen} />
    </>
  );
}
```

### Step 4: Remove PostComposer from Feed.tsx

In `src/pages/Feed.tsx`, delete:
```tsx
// REMOVE this import:
import PostComposer from "@/components/feed/PostComposer";

// REMOVE this JSX:
<PostComposer chartData={chartData} />
```

Also remove `chartData` usage if it's now only used by TodaysPlanetaryBar (keep `useEphemeris` call if TodaysPlanetaryBar still needs it).

### Step 5: Verify

```bash
npm run build 2>&1 | tail -10
```

Then `npm run dev`, go to `/feed`, tap the `⊕` button — the Drawer should open with the composer.

### Step 6: Commit

```bash
git add src/components/PostComposerSheet.tsx src/App.tsx src/components/feed/PostComposer.tsx src/pages/Feed.tsx
git commit -m "feat: move PostComposer to BottomNav Sheet — self-contained with useProfile + useEphemeris"
```

---

## Task 7: Profile page redesign (single scroll — Trinity Widget, Planetary Drawer, pill tags)

**Files:**
- Modify: `src/pages/Profile.tsx` (major rewrite)

**What it does:** Replaces the two-tab layout with a single scrollable page:
- **Zone 1:** Trinity Widget (Sun/Moon/Rising cards with pulse animation) + Mercury/Venus/Mars pill chips + Vibe status
- **Zone 2:** NatalChartWheel inline (full-width) + Planetary Drawer (vaul Drawer showing PlanetDetails or HouseDetails on tap)
- **Zone 3:** Astro-Bio cards (About, Mercury, Venus, Mars)

### Step 1: Write the new Profile.tsx

Replace the entire file:

```tsx
// src/pages/Profile.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Edit2, Save, Globe, Lock, Sparkles, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import StarField from "@/components/StarField";
import { useProfile, Profile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useEphemeris } from "@/hooks/useEphemeris";
import NatalChartWheel from "@/components/NatalChartWheel";
import PlanetDetails from "@/components/PlanetDetails";
import HouseDetails from "@/components/HouseDetails";
import { Planet, House } from "@/data/natalChartData";
import { BirthData } from "@/components/intake/BirthDataForm";
import GlossaryPopover from "@/components/GlossaryPopover";

// --- Constants ---

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

const SIGN_COLORS: Record<string, string> = {
  Aries: "text-red-400", Taurus: "text-emerald-400", Gemini: "text-yellow-300",
  Cancer: "text-blue-300", Leo: "text-orange-400", Virgo: "text-emerald-300",
  Libra: "text-pink-300", Scorpio: "text-red-500", Sagittarius: "text-orange-300",
  Capricorn: "text-stone-300", Aquarius: "text-cyan-400", Pisces: "text-indigo-300",
};

// --- Trinity Widget ---

function TrinityCard({
  label, glyph, sign,
}: { label: string; glyph: string; sign: string | null }) {
  const symbol = sign ? SIGN_SYMBOLS[sign] ?? "?" : "?";
  const color  = sign ? SIGN_COLORS[sign] ?? "text-foreground" : "text-muted-foreground";

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* Pulsing ring + glyph */}
      <div className="relative">
        <div
          className={`w-16 h-16 rounded-full glass-panel flex items-center justify-center ${
            sign ? "animate-[pulse-ring_3s_ease-in-out_infinite]" : "opacity-50"
          }`}
        >
          <span className={`text-2xl ${color}`}>{symbol}</span>
        </div>
      </div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="text-sm font-serif font-bold uppercase tracking-wide text-foreground">
        {sign ?? "—"}
      </p>
    </div>
  );
}

// --- Pill Chip ---

function PlanetChip({
  glyph, label, sign, house,
}: { glyph: string; label: string; sign: string; house?: number }) {
  const color = SIGN_COLORS[sign] ?? "text-muted-foreground";
  const text  = house ? `${sign} · ${house}th` : sign;

  return (
    <button className="flex-shrink-0 flex items-center gap-1 text-xs bg-white/5 border border-border/30 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors">
      <span>{glyph}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${color}`}>{text}</span>
    </button>
  );
}

// --- Main ---

export default function ProfilePage() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const { profile, isLoading, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    display_name:  "",
    bio:           "",
    mercury_bio:   "",
    venus_bio:     "",
    mars_bio:      "",
    current_status:"",
    is_public:     true,
  });
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedHouse,  setSelectedHouse]  = useState<House | null>(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);

  const birthData: BirthData | null =
    profile?.birth_date && profile?.birth_lat && profile?.birth_lng
      ? {
          name:        profile.display_name ?? "You",
          birthDate:   profile.birth_date,
          birthTime:   profile.birth_time ?? "12:00",
          timeUnknown: profile.time_unknown ?? false,
          location:    profile.birth_location ?? "",
          latitude:    profile.birth_lat,
          longitude:   profile.birth_lng,
          timezone:    "UTC+0",
        }
      : null;

  const { chartData } = useEphemeris(birthData);

  // Derived Mercury/Venus/Mars from chartData
  const mercuryPlanet = chartData?.planets.find(p => p.name === "Mercury");
  const venusPlanet   = chartData?.planets.find(p => p.name === "Venus");
  const marsPlanet    = chartData?.planets.find(p => p.name === "Mars");

  useEffect(() => {
    if (profile) {
      setForm({
        display_name:   profile.display_name   ?? "",
        bio:            profile.bio             ?? "",
        mercury_bio:    profile.mercury_bio     ?? "",
        venus_bio:      profile.venus_bio       ?? "",
        mars_bio:       profile.mars_bio        ?? "",
        current_status: profile.current_status  ?? "",
        is_public:      profile.is_public,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    const success = await updateProfile({
      ...form,
      status_updated_at:
        form.current_status !== (profile?.current_status ?? "")
          ? new Date().toISOString()
          : profile?.status_updated_at ?? null,
    });
    if (success) setIsEditing(false);
  };

  const handleSelectPlanet = (planet: Planet | null) => {
    setSelectedPlanet(planet);
    setSelectedHouse(null);
    if (planet) setDrawerOpen(true);
  };

  const handleSelectHouse = (house: House | null) => {
    setSelectedHouse(house);
    setSelectedPlanet(null);
    if (house) setDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="container mx-auto px-4 pt-6 pb-28 max-w-2xl relative z-10">

        {/* ── Zone 1: Identity Header ── */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          {/* Avatar */}
          <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary/30 nebula-glow">
            <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} />
            <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
              {(form.display_name || user?.email || "?").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Display name */}
          {isEditing ? (
            <Input
              value={form.display_name}
              onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
              className="max-w-xs mx-auto text-center text-xl font-serif bg-input/50 border-border/50 mb-3"
              placeholder="Your display name"
            />
          ) : (
            <h1 className="text-3xl font-serif text-ethereal mb-3">
              {form.display_name || "Cosmic Traveler"}
            </h1>
          )}

          {/* Visibility */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {isEditing ? (
              <>
                <Switch
                  checked={form.is_public}
                  onCheckedChange={v => setForm(f => ({ ...f, is_public: v }))}
                  id="public-toggle"
                />
                <Label htmlFor="public-toggle" className="text-xs text-muted-foreground">
                  {form.is_public ? "Public profile" : "Private profile"}
                </Label>
              </>
            ) : (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {form.is_public ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                {form.is_public ? "Public" : "Private"}
              </span>
            )}
          </div>

          {/* Trinity Widget */}
          <div className="flex justify-center gap-6 sm:gap-10 mb-6">
            <TrinityCard label="Sun"    glyph="☀" sign={profile?.sun_sign    ?? null} />
            <TrinityCard label="Moon"   glyph="☽" sign={profile?.moon_sign   ?? null} />
            <TrinityCard label="Rising" glyph="↑" sign={profile?.rising_sign ?? null} />
          </div>

          {/* Pill Tags: Mercury / Venus / Mars */}
          {chartData && (
            <ScrollArea className="w-full mb-6">
              <div className="flex gap-2 pb-2 justify-center">
                {mercuryPlanet && (
                  <PlanetChip
                    glyph="☿" label="Mercury"
                    sign={mercuryPlanet.sign} house={mercuryPlanet.house}
                  />
                )}
                {venusPlanet && (
                  <PlanetChip
                    glyph="♀" label="Venus"
                    sign={venusPlanet.sign} house={venusPlanet.house}
                  />
                )}
                {marsPlanet && (
                  <PlanetChip
                    glyph="♂" label="Mars"
                    sign={marsPlanet.sign} house={marsPlanet.house}
                  />
                )}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}

          {/* Current Vibe */}
          <div className="glass-panel rounded-xl p-3 text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="h-3 w-3 text-accent" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Current Vibe</span>
            </div>
            {isEditing ? (
              <Input
                value={form.current_status}
                onChange={e => setForm(f => ({ ...f, current_status: e.target.value }))}
                placeholder='e.g., "Surviving my Saturn Return"'
                className="text-center bg-input/50 border-border/50 text-sm"
              />
            ) : (
              <p className="text-sm font-serif text-foreground italic">
                {form.current_status || "No status set..."}
              </p>
            )}
          </div>

          {/* Edit / Save button */}
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            className="gap-2"
          >
            {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
            {isEditing ? "Save" : "Edit Profile"}
          </Button>
        </motion.div>

        {/* ── Zone 2: The Living Chart ── */}
        {birthData && chartData ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <NatalChartWheel
              onSelectPlanet={handleSelectPlanet}
              onSelectHouse={handleSelectHouse}
              selectedPlanet={selectedPlanet}
              selectedHouse={selectedHouse}
              houseSystem="placidus"
              chartData={chartData}
              partnerChartData={null}
              partnerName={undefined}
            />
          </motion.div>
        ) : profile && !profile.sun_sign ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 glass-panel p-4 rounded-xl text-center cosmic-border"
          >
            <p className="text-sm text-muted-foreground">
              🌟 Your Big Three aren't set yet! Generate your natal chart to populate them.
            </p>
            <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => navigate("/")}>
              <Sparkles className="h-4 w-4" />
              Generate My Chart
            </Button>
          </motion.div>
        ) : null}

        {/* ── Zone 3: Astro-Bio ── */}
        <div className="space-y-4">
          {/* About */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 sm:p-6 rounded-xl">
            <h3 className="font-serif text-lg text-foreground mb-3">About</h3>
            {isEditing ? (
              <Textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                placeholder="Tell the cosmos about yourself..."
                className="bg-input/50 border-border/50 min-h-[100px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground">{form.bio || "No bio yet..."}</p>
            )}
          </motion.div>

          {/* Mercury */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 sm:p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">☿</span>
              <div>
                <h3 className="font-serif text-foreground">My Mercury</h3>
                <p className="text-xs text-muted-foreground">How I communicate</p>
              </div>
            </div>
            {isEditing ? (
              <Textarea
                value={form.mercury_bio}
                onChange={e => setForm(f => ({ ...f, mercury_bio: e.target.value }))}
                placeholder="How I communicate..."
                className="bg-input/50 border-border/50 min-h-[80px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {form.mercury_bio || "No Mercury description yet..."}
              </p>
            )}
          </motion.div>

          {/* Venus */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 sm:p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">♀</span>
              <div>
                <h3 className="font-serif text-foreground">My Venus</h3>
                <p className="text-xs text-muted-foreground">How I love</p>
              </div>
            </div>
            {isEditing ? (
              <Textarea
                value={form.venus_bio}
                onChange={e => setForm(f => ({ ...f, venus_bio: e.target.value }))}
                placeholder="How I love..."
                className="bg-input/50 border-border/50 min-h-[80px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {form.venus_bio || "No Venus description yet..."}
              </p>
            )}
          </motion.div>

          {/* Mars */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel p-4 sm:p-6 rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">♂</span>
              <div>
                <h3 className="font-serif text-foreground">My Mars</h3>
                <p className="text-xs text-muted-foreground">How I work & fight</p>
              </div>
            </div>
            {isEditing ? (
              <Textarea
                value={form.mars_bio}
                onChange={e => setForm(f => ({ ...f, mars_bio: e.target.value }))}
                placeholder="How I work & fight..."
                className="bg-input/50 border-border/50 min-h-[80px]"
              />
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {form.mars_bio || "No Mars description yet..."}
              </p>
            )}
          </motion.div>
        </div>
      </main>

      {/* ── Planetary Drawer ── */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="glass-panel border-border/30 max-h-[60vh]">
          <DrawerHeader>
            <DrawerTitle className="font-serif text-ethereal">
              {selectedPlanet
                ? `${selectedPlanet.symbol} ${selectedPlanet.name} in ${selectedPlanet.sign}`
                : selectedHouse
                ? `${selectedHouse.number}th House`
                : "Details"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {selectedPlanet && chartData && (
              <PlanetDetails planet={selectedPlanet} />
            )}
            {selectedHouse && chartData && (
              <HouseDetails house={selectedHouse} planets={chartData.planets} />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
```

**Important:** Add the CSS keyframe for the pulse ring in `src/index.css` or `src/App.css`:

```css
@keyframes pulse-ring {
  0%, 100% { box-shadow: 0 0 0 0 hsl(var(--accent) / 0.4); }
  50%       { box-shadow: 0 0 0 8px hsl(var(--accent) / 0); }
}
```

### Step 2: Verify build

```bash
npm run build 2>&1 | tail -15
```

Fix any TypeScript errors (likely `GlossaryPopover` import not used — remove it if unused).

### Step 3: Verify visually

`npm run dev` → navigate to `/profile`. Check:
- Trinity Widget shows three cards with sign symbols
- Pill chips show Mercury/Venus/Mars (if birth data is present)
- Tapping a planet on the chart opens the Drawer

### Step 4: Commit

```bash
git add src/pages/Profile.tsx src/index.css
git commit -m "feat: redesign Profile as single-scroll page — Trinity Widget, Planetary Drawer, pill chips"
```

---

## Task 8: Match page + useMatchFeed + Public Profile page

**Files:**
- Create: `src/hooks/useMatchFeed.ts`
- Create: `src/lib/calculateChartForProfile.ts`
- Modify: `src/pages/Match.tsx` (replace stub)
- Modify: `src/pages/PublicProfile.tsx` (replace stub)

**What it does:** Fetches up to 50 public profiles, calculates compatibility score against current user's chart, sorts descending. Match page shows card list. PublicProfile shows their profile (read-only) with CompatibilityPulse.

### Step 1: Create calculateChartForProfile.ts

Extract the calculation logic from `useEphemeris.ts` into a standalone function that can be called outside of a React hook:

```ts
// src/lib/calculateChartForProfile.ts
import { calculateChart as celestineCalculateChart } from "celestine";
import { NatalChartData, Planet, House, ChartAngles, zodiacSigns } from "@/data/natalChartData";
import { BirthData } from "@/components/intake/BirthDataForm";

// Re-export the same calculation logic from useEphemeris, minus the useMemo wrapper.
// Copy the body of useEphemeris's useMemo callback here as a plain function.
// Key parts to copy: longitudeToSign, findHouseForPlanet, the celestineCalculateChart call,
// and the planet/house/angle mapping logic.
export function calculateChartForProfile(birthData: BirthData): NatalChartData | null {
  if (!birthData.latitude || !birthData.longitude) return null;
  try {
    // --- COPY the entire calculation body from useEphemeris.ts ---
    // (the part inside the useMemo, starting from "const [year, month, day]...")
    // Return the final chartData object.
    // Do NOT import or call any React hooks here.
  } catch {
    return null;
  }
}
```

**Implementation note:** Open `src/hooks/useEphemeris.ts`, copy the entire body of the `useMemo` callback (lines ~147–end), paste it into `calculateChartForProfile`, and return the final `chartData` variable. The logic is pure computation — no hooks used inside it.

### Step 2: Create useMatchFeed.ts

```ts
// src/hooks/useMatchFeed.ts
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, Profile } from "@/hooks/useProfile";
import { useEphemeris } from "@/hooks/useEphemeris";
import { calculateChartForProfile } from "@/lib/calculateChartForProfile";
import { calculateCompatibility } from "@/lib/synastry/compatibility";
import { BirthData } from "@/components/intake/BirthDataForm";

export interface MatchProfile {
  profile:    Profile;
  score:      number;   // 0–100
}

function profileToBirthData(p: Profile): BirthData | null {
  if (!p.birth_date || !p.birth_lat || !p.birth_lng) return null;
  return {
    name:        p.display_name ?? "Unknown",
    birthDate:   p.birth_date,
    birthTime:   p.birth_time ?? "12:00",
    timeUnknown: p.time_unknown ?? false,
    location:    p.birth_location ?? "",
    latitude:    p.birth_lat,
    longitude:   p.birth_lng,
    timezone:    "UTC+0",
  };
}

export function useMatchFeed() {
  const { profile: myProfile } = useProfile();
  const myBirthData = myProfile ? profileToBirthData(myProfile) : null;
  const { chartData: myChartData } = useEphemeris(myBirthData);

  return useQuery<MatchProfile[]>({
    queryKey: ["match-feed", myProfile?.user_id],
    enabled:  !!myChartData && !!myProfile,
    staleTime: 5 * 60 * 1000,  // cache for 5 mins — scoring is expensive
    queryFn: async () => {
      const { data: profiles, error } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("is_public", true)
        .not("birth_date", "is", null)
        .not("birth_lat", "is", null)
        .neq("user_id", myProfile!.user_id)
        .limit(50);

      if (error || !profiles) return [];

      const results: MatchProfile[] = [];
      for (const p of profiles as Profile[]) {
        const bd = profileToBirthData(p);
        if (!bd) continue;
        const theirChart = calculateChartForProfile(bd);
        if (!theirChart) continue;
        const { overall } = calculateCompatibility(myChartData!.planets, theirChart.planets);
        results.push({ profile: p, score: overall });
      }

      return results.sort((a, b) => b.score - a.score);
    },
  });
}
```

**Note:** Check what `calculateCompatibility` returns — look at `src/lib/synastry/compatibility.ts` for the `CompatibilityResult` type. It likely has an `overall` field. Adjust the destructuring accordingly.

### Step 3: Build Match.tsx

```tsx
// src/pages/Match.tsx
import { motion } from "framer-motion";
import { Loader2, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import StarField from "@/components/StarField";
import { useMatchFeed, MatchProfile } from "@/hooks/useMatchFeed";

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

function scoreColor(score: number) {
  if (score >= 70) return "bg-gradient-to-r from-emerald-500 to-teal-400";
  if (score >= 45) return "bg-gradient-to-r from-amber-500 to-yellow-400";
  return "bg-gradient-to-r from-rose-500 to-pink-400";
}

function MatchCard({ match, onClick }: { match: MatchProfile; onClick: () => void }) {
  const { profile, score } = match;
  const bigThree = [
    profile.sun_sign    ? `☀${SIGN_SYMBOLS[profile.sun_sign]    ?? ""}` : null,
    profile.moon_sign   ? `☽${SIGN_SYMBOLS[profile.moon_sign]   ?? ""}` : null,
    profile.rising_sign ? `↑${SIGN_SYMBOLS[profile.rising_sign] ?? ""}` : null,
  ].filter(Boolean).join("  ");

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="w-full text-left glass-panel rounded-xl p-4 hover:bg-white/5 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border border-border/30">
          <AvatarImage src={profile.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-serif">
            {(profile.display_name ?? "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{profile.display_name ?? "Cosmic Traveler"}</p>
          {bigThree && <p className="text-muted-foreground text-xs">{bigThree}</p>}
          {/* Compatibility bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-border/30 overflow-hidden">
              <div
                className={`h-full rounded-full ${scoreColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums flex-shrink-0">
              {score}% synastry
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

export default function Match() {
  const navigate = useNavigate();
  const { data: matches, isLoading, isError } = useMatchFeed();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="container mx-auto px-4 pt-6 pb-28 max-w-2xl relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-serif text-ethereal mb-6"
        >
          Cosmic Match
        </motion.h1>

        {isLoading && (
          <div className="flex justify-center py-12" role="status" aria-label="Loading matches">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        )}

        {isError && (
          <p className="text-center text-destructive py-8 text-sm">
            Could not load matches. Try refreshing.
          </p>
        )}

        {!isLoading && !isError && (!matches || matches.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-40" aria-hidden="true" />
            <p>No public profiles to match with yet.</p>
            <p className="text-xs mt-1">Be the first to make your profile public!</p>
          </div>
        )}

        <div className="space-y-3">
          {(matches ?? []).map((match) => (
            <MatchCard
              key={match.profile.user_id}
              match={match}
              onClick={() => navigate(`/profile/${match.profile.user_id}`)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
```

### Step 4: Build PublicProfile.tsx

```tsx
// src/pages/PublicProfile.tsx
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import StarField from "@/components/StarField";
import { supabase } from "@/integrations/supabase/client";
import { Profile, useProfile } from "@/hooks/useProfile";
import { useEphemeris } from "@/hooks/useEphemeris";
import { calculateChartForProfile } from "@/lib/calculateChartForProfile";
import { calculateCompatibility } from "@/lib/synastry/compatibility";
import { BirthData } from "@/components/intake/BirthDataForm";
import NatalChartWheel from "@/components/NatalChartWheel";
import PlanetDetails from "@/components/PlanetDetails";
import HouseDetails from "@/components/HouseDetails";
import { Planet, House } from "@/data/natalChartData";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from "@/components/ui/drawer";

const SIGN_SYMBOLS: Record<string, string> = {
  Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋",
  Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏",
  Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓",
};

function scoreRing(score: number) {
  if (score >= 70) return "border-emerald-400 shadow-[0_0_16px_hsl(152,60%,50%/0.5)]";
  if (score >= 45) return "border-amber-400 shadow-[0_0_16px_hsl(38,92%,50%/0.5)]";
  return "border-rose-400 shadow-[0_0_16px_hsl(346,77%,50%/0.4)]";
}

function profileToBirthData(p: Profile): BirthData | null {
  if (!p.birth_date || !p.birth_lat || !p.birth_lng) return null;
  return {
    name:        p.display_name ?? "Unknown",
    birthDate:   p.birth_date,
    birthTime:   p.birth_time ?? "12:00",
    timeUnknown: p.time_unknown ?? false,
    location:    p.birth_location ?? "",
    latitude:    p.birth_lat,
    longitude:   p.birth_lng,
    timezone:    "UTC+0",
  };
}

export default function PublicProfile() {
  const { userId }  = useParams<{ userId: string }>();
  const navigate    = useNavigate();
  const { profile: myProfile } = useProfile();

  const [theirProfile, setTheirProfile] = useState<Profile | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);
  const [selectedHouse,  setSelectedHouse]  = useState<House | null>(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);

  useEffect(() => {
    if (!userId) return;
    (supabase as any)
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }: { data: Profile | null }) => {
        setTheirProfile(data);
        setLoading(false);
      });
  }, [userId]);

  const myBirthData    = myProfile ? profileToBirthData(myProfile) : null;
  const theirBirthData = theirProfile ? profileToBirthData(theirProfile) : null;
  const { chartData: myChartData } = useEphemeris(myBirthData);
  const { chartData: theirChartData } = useEphemeris(theirBirthData);

  const compatScore = myChartData && theirChartData
    ? calculateCompatibility(myChartData.planets, theirChartData.planets).overall
    : null;

  const handleSelectPlanet = (planet: Planet | null) => {
    setSelectedPlanet(planet);
    setSelectedHouse(null);
    if (planet) setDrawerOpen(true);
  };

  const handleSelectHouse = (house: House | null) => {
    setSelectedHouse(house);
    setSelectedPlanet(null);
    if (house) setDrawerOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    );
  }

  if (!theirProfile || !theirProfile.is_public) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center p-8">
        <Lock className="h-10 w-10 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">This profile is private.</p>
        <Button variant="ghost" onClick={() => navigate("/match")}>← Back to Match</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StarField />
      <main className="container mx-auto px-4 pt-6 pb-28 max-w-2xl relative z-10">

        <Button variant="ghost" size="sm" onClick={() => navigate("/match")} className="gap-2 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Identity Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          {/* Avatar with CompatibilityPulse ring */}
          <div className="relative inline-block mb-4">
            <Avatar
              className={`h-24 w-24 border-4 ${
                compatScore !== null ? scoreRing(compatScore) : "border-primary/30"
              }`}
            >
              <AvatarImage src={theirProfile.avatar_url ?? undefined} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
                {(theirProfile.display_name ?? "?").charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {compatScore !== null && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background border border-border/50 rounded-full px-2 py-0.5 text-[10px] font-medium">
                {compatScore}% match
              </div>
            )}
          </div>

          <h1 className="text-2xl font-serif text-ethereal mb-2">
            {theirProfile.display_name ?? "Cosmic Traveler"}
          </h1>

          {/* Big Three */}
          <div className="flex justify-center gap-6 mb-4">
            {[
              { label: "Sun",    sign: theirProfile.sun_sign },
              { label: "Moon",   sign: theirProfile.moon_sign },
              { label: "Rising", sign: theirProfile.rising_sign },
            ].map(({ label, sign }) => (
              <div key={label} className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-sm font-serif">{sign ? `${SIGN_SYMBOLS[sign] ?? ""} ${sign}` : "—"}</p>
              </div>
            ))}
          </div>

          {theirProfile.current_status && (
            <p className="text-sm font-serif italic text-muted-foreground">
              "{theirProfile.current_status}"
            </p>
          )}
        </motion.div>

        {/* Chart */}
        {theirChartData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
            <NatalChartWheel
              onSelectPlanet={handleSelectPlanet}
              onSelectHouse={handleSelectHouse}
              selectedPlanet={selectedPlanet}
              selectedHouse={selectedHouse}
              houseSystem="placidus"
              chartData={theirChartData}
              partnerChartData={null}
              partnerName={undefined}
            />
          </motion.div>
        )}

        {/* Bio sections (read-only) */}
        {theirProfile.bio && (
          <div className="glass-panel p-4 rounded-xl mb-4">
            <h3 className="font-serif text-lg text-foreground mb-2">About</h3>
            <p className="text-sm text-muted-foreground">{theirProfile.bio}</p>
          </div>
        )}
        {theirProfile.mercury_bio && (
          <div className="glass-panel p-4 rounded-xl mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span>☿</span>
              <h3 className="font-serif text-foreground">Mercury</h3>
            </div>
            <p className="text-sm text-muted-foreground italic">{theirProfile.mercury_bio}</p>
          </div>
        )}
        {theirProfile.venus_bio && (
          <div className="glass-panel p-4 rounded-xl mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span>♀</span>
              <h3 className="font-serif text-foreground">Venus</h3>
            </div>
            <p className="text-sm text-muted-foreground italic">{theirProfile.venus_bio}</p>
          </div>
        )}
        {theirProfile.mars_bio && (
          <div className="glass-panel p-4 rounded-xl mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span>♂</span>
              <h3 className="font-serif text-foreground">Mars</h3>
            </div>
            <p className="text-sm text-muted-foreground italic">{theirProfile.mars_bio}</p>
          </div>
        )}
      </main>

      {/* Planetary Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="glass-panel border-border/30 max-h-[60vh]">
          <DrawerHeader>
            <DrawerTitle className="font-serif text-ethereal">
              {selectedPlanet
                ? `${selectedPlanet.symbol} ${selectedPlanet.name} in ${selectedPlanet.sign}`
                : selectedHouse
                ? `${selectedHouse.number}th House`
                : "Details"}
            </DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto">
            {selectedPlanet && theirChartData && (
              <PlanetDetails planet={selectedPlanet} />
            )}
            {selectedHouse && theirChartData && (
              <HouseDetails house={selectedHouse} planets={theirChartData.planets} />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
```

### Step 5: Check calculateCompatibility return type

```bash
grep -n "overall\|CompatibilityResult" src/lib/synastry/compatibility.ts | head -20
```

If the return type uses a different field name (e.g., `score` instead of `overall`), update `useMatchFeed.ts` and `PublicProfile.tsx` accordingly.

### Step 6: Verify build

```bash
npm run build 2>&1 | tail -20
```

Fix any TypeScript errors.

### Step 7: Commit

```bash
git add src/lib/calculateChartForProfile.ts src/hooks/useMatchFeed.ts src/pages/Match.tsx src/pages/PublicProfile.tsx
git commit -m "feat: Match page with useMatchFeed compatibility scoring + PublicProfile read-only view"
```

---

## Final verification

After all tasks are complete:

```bash
# Full build check
npm run build 2>&1 | tail -20

# Deploy to Vercel
vercel --prod 2>&1 | tail -10
```

Navigate and verify:
1. `/feed` — BottomNav visible, Sky header shows planetary bar, posts show transit stamps
2. `/feed` → tap `⊕` — PostComposer Drawer opens
3. `/profile` — Trinity Widget, pill chips, tapping chart planet opens Drawer
4. `/match` — list of users sorted by score (may be empty in dev with only one user)
5. `/profile/:userId` — read-only profile with CompatibilityPulse ring
