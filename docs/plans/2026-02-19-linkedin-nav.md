# LinkedIn-Style Navigation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign routing so login lands on Feed, first-time users go through `/onboarding` to enter birth data, and Profile has tabs for bio and the natal chart.

**Architecture:** A new `AuthGuard` route wrapper replaces the old component-level `AuthGate`. `RootRedirect` handles the `/` entry point. `BirthDataForm` moves to a dedicated `/onboarding` page. Profile gets a Tabs UI (Profile | Chart). Old Index.tsx state machine is deleted.

**Tech Stack:** React Router v6, Clerk React, shadcn/ui Tabs (already in project), Vitest, Vite

---

## Context

**Design doc:** `docs/plans/2026-02-19-linkedin-nav-design.md` — read it before starting.

**Key files to understand before touching anything:**
- `src/App.tsx` — current route tree (5 routes)
- `src/components/AuthGate.tsx` — component being replaced
- `src/pages/Index.tsx` — page being deleted
- `src/hooks/useAuth.ts` — returns `{ user, isLoading, signInWithGoogle }`
- `src/hooks/useProfile.ts` — returns `{ profile, isLoading, updateProfile }`; `profile` is `null` while loading or if no birth data saved
- `src/components/intake/BirthDataForm.tsx` — `BirthDataForm` component with `onSubmit: (data: BirthData) => void` prop
- `src/pages/Profile.tsx` — existing Profile page to be modified

**"Has birth data" check:**
```ts
const hasBirthData = !!profile?.birth_date && !!profile?.birth_lat && !!profile?.birth_lng;
```

**Run the dev server to verify each task:**
```bash
npm run dev
```
Open `http://localhost:8080` in the browser.

---

## Task 1: Create `AuthGuard` component

Replaces `src/components/AuthGate.tsx`. Route-level wrapper with flicker-safe loading state and redirect-back deep link pattern.

**Files:**
- Create: `src/components/AuthGuard.tsx`

**Step 1: Create the file**

```tsx
// src/components/AuthGuard.tsx
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface AuthGuardProps {
  children: React.ReactNode;
  requireBirthData?: boolean; // default true
}

export default function AuthGuard({ children, requireBirthData = true }: AuthGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();
  const location = useLocation();

  // Wait for both auth AND profile to resolve before making any redirect decision.
  // Without this, a returning user with birth data would flash /onboarding for a frame.
  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not signed in → sign-in page
  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (requireBirthData) {
    const hasBirthData = !!profile?.birth_date && !!profile?.birth_lat && !!profile?.birth_lng;

    if (!hasBirthData) {
      // Encode the current path so onboarding can redirect back after completion.
      const next = encodeURIComponent(location.pathname + location.search);
      return <Navigate to={`/onboarding?next=${next}`} replace />;
    }
  }

  return <>{children}</>;
}
```

**Step 2: Verify it builds with no TypeScript errors**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors (or only pre-existing errors unrelated to AuthGuard).

**Step 3: Commit**

```bash
git add src/components/AuthGuard.tsx
git commit -m "feat: add AuthGuard route wrapper with flicker-safe loading and redirect-back"
```

---

## Task 2: Create `RootRedirect` page

Handles `/`. Reads auth + profile state and immediately redirects — renders nothing visible.

**Files:**
- Create: `src/pages/RootRedirect.tsx`

**Step 1: Create the file**

```tsx
// src/pages/RootRedirect.tsx
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export default function RootRedirect() {
  const { user, isLoading: authLoading } = useAuth();
  const { profile, isLoading: profileLoading } = useProfile();

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/sign-in" replace />;
  }

  const hasBirthData = !!profile?.birth_date && !!profile?.birth_lat && !!profile?.birth_lng;
  if (!hasBirthData) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/feed" replace />;
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/pages/RootRedirect.tsx
git commit -m "feat: add RootRedirect — auth+data→/feed, auth+no-data→/onboarding, anon→/sign-in"
```

---

## Task 3: Create `SignIn` page

Thin wrapper around Clerk's `<SignIn>`. New and returning users get different post-auth destinations.

**Files:**
- Create: `src/pages/SignIn.tsx`

**Step 1: Create the file**

Clerk's `<SignIn>` component accepts `afterSignInUrl` and `afterSignUpUrl` as props.

```tsx
// src/pages/SignIn.tsx
import { SignIn } from "@clerk/clerk-react";
import StarField from "@/components/StarField";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <StarField />
      <div className="relative z-10">
        <SignIn
          afterSignInUrl="/feed"
          afterSignUpUrl="/onboarding"
          appearance={{
            elements: {
              card: "glass-panel border-border/30 shadow-2xl",
              headerTitle: "font-serif text-ethereal",
              headerSubtitle: "text-muted-foreground",
              formButtonPrimary: "bg-accent hover:bg-accent/90 text-accent-foreground",
              footerActionLink: "text-accent hover:text-accent/80",
            },
          }}
        />
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 3: Commit**

```bash
git add src/pages/SignIn.tsx
git commit -m "feat: add SignIn page — wraps Clerk <SignIn> with afterSignInUrl=/feed, afterSignUpUrl=/onboarding"
```

---

## Task 4: Create `Onboarding` page

Hosts `BirthDataForm`. On submission: saves birth data to Supabase via `updateProfile`, then navigates to `?next` or `/feed`.

**Files:**
- Create: `src/pages/Onboarding.tsx`

**Step 1: Understand BirthDataForm**

The `BirthDataForm` component at `src/components/intake/BirthDataForm.tsx` accepts:
```ts
interface BirthDataFormProps {
  onSubmit: (data: BirthData) => void;
}
```

Where `BirthData` is:
```ts
interface BirthData {
  name: string;
  birthDate: string;     // "YYYY-MM-DD"
  birthTime: string;     // "HH:MM"
  timeUnknown: boolean;
  location: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string;
}
```

`updateProfile` from `useProfile()` accepts `Partial<Profile>` and saves to Supabase. The relevant fields to save are: `display_name`, `birth_date`, `birth_time`, `birth_location`, `birth_lat`, `birth_lng`, `time_unknown`.

**Step 2: Create the file**

```tsx
// src/pages/Onboarding.tsx
import { useSearchParams, useNavigate } from "react-router-dom";
import StarField from "@/components/StarField";
import BirthDataForm, { BirthData } from "@/components/intake/BirthDataForm";
import { useProfile } from "@/hooks/useProfile";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function Onboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateProfile } = useProfile();

  const handleSubmit = async (data: BirthData) => {
    await updateProfile({
      display_name: data.name,
      birth_date: data.birthDate,
      birth_time: data.timeUnknown ? null : data.birthTime,
      birth_location: data.location,
      birth_lat: data.latitude,
      birth_lng: data.longitude,
      time_unknown: data.timeUnknown,
    });

    // Redirect to the page they originally tried to visit, or /feed.
    const next = searchParams.get("next");
    const destination = next ? decodeURIComponent(next) : "/feed";
    navigate(destination, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <StarField />

      <div className="relative z-10 pt-8 pb-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 text-muted-foreground text-sm mb-2"
        >
          <Sparkles className="h-4 w-4" />
          Step 1 of 1
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="text-2xl font-serif text-ethereal"
        >
          Your Cosmic Blueprint
        </motion.h1>
      </div>

      <BirthDataForm onSubmit={handleSubmit} />
    </div>
  );
}
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Commit**

```bash
git add src/pages/Onboarding.tsx
git commit -m "feat: add Onboarding page — BirthDataForm saves to profile, redirects to ?next or /feed"
```

---

## Task 5: Update `App.tsx` with the new route tree

Wire all new pages into React Router. Remove the old `Index` import. Wrap protected routes with `AuthGuard`.

**Files:**
- Modify: `src/App.tsx`

**Step 1: Read the current file**

Current `src/App.tsx` (lines 1-37). The current imports and routes:
```tsx
import Index from "./pages/Index";
// ...
<Route path="/" element={<Index />} />
<Route path="/transit" element={<TransitDetail />} />
<Route path="/profile" element={<Profile />} />
<Route path="/feed" element={<Feed />} />
```

**Step 2: Replace the file content**

```tsx
// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import AuthGuard from "@/components/AuthGuard";
import RootRedirect from "./pages/RootRedirect";
import SignInPage from "./pages/SignIn";
import Onboarding from "./pages/Onboarding";
import TransitDetail from "./pages/TransitDetail";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const App = () => (
  <ClerkProvider publishableKey={clerkKey}>
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
            <Route
              path="/feed"
              element={
                <AuthGuard>
                  <Feed />
                </AuthGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route
              path="/transit"
              element={
                <AuthGuard>
                  <TransitDetail />
                </AuthGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
```

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Start the dev server and test routing**

```bash
npm run dev
```

Verify:
- `http://localhost:8080/` — redirects to `/sign-in` (if logged out) or `/feed` (if logged in with birth data)
- `http://localhost:8080/sign-in` — shows Clerk sign-in
- Signing in → lands on `/feed`

**Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: rewire App.tsx — new route tree with AuthGuard, RootRedirect, SignIn, Onboarding"
```

---

## Task 6: Add Chart tab to `Profile` page

Profile page gets two tabs: **Profile** (existing content) and **Chart** (ChartDashboard). The tab bar sits below the avatar/name header.

**Files:**
- Modify: `src/pages/Profile.tsx`

**Step 1: Understand current Profile.tsx structure**

Current `src/pages/Profile.tsx` structure:
- Imports: `useNavigate`, many UI components, `useProfile`, `useAuth`
- `BigThreeHeader` sub-component
- `PlanetaryBioSection` sub-component
- `ProfilePage` default export: header (Back + Edit buttons), avatar/name section, BigThreeHeader, status, bio, planetary bios section
- The "Back" button currently calls `navigate("/")` — change to `navigate("/feed")`

**Step 2: Add required imports**

At the top of `src/pages/Profile.tsx`, add:
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEphemeris } from "@/hooks/useEphemeris";
import ChartDashboard from "@/components/ChartDashboard";
import { BirthData } from "@/components/intake/BirthDataForm";
```

**Step 3: Build BirthData inside ProfilePage**

Inside the `ProfilePage` component, after the `useProfile()` call, add:

```tsx
// Reconstruct BirthData from profile for the Chart tab (same pattern as Feed.tsx)
const birthData: BirthData | null =
  profile?.birth_date && profile?.birth_lat && profile?.birth_lng
    ? {
        name: profile.display_name ?? "You",
        birthDate: profile.birth_date,
        birthTime: profile.birth_time ?? "12:00",
        timeUnknown: profile.time_unknown ?? false,
        location: profile.birth_location ?? "",
        latitude: profile.birth_lat,
        longitude: profile.birth_lng,
        timezone: "UTC+0",
      }
    : null;
```

**Step 4: Change the Back button destination**

Find (line ~146):
```tsx
<Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
```
Change to:
```tsx
<Button variant="ghost" size="sm" onClick={() => navigate("/feed")} className="gap-2">
```

**Step 5: Wrap the existing profile body in a Tabs component**

The existing profile content (everything below the header div that contains Back + Edit buttons) should be wrapped in a `<Tabs>` component. The structure:

```tsx
return (
  <div className="min-h-screen bg-background text-foreground">
    <StarField />
    <main className="container mx-auto px-4 pt-6 pb-24 max-w-2xl relative z-10">
      {/* Header: Back + Edit buttons — unchanged */}
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate("/feed")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        {/* Edit/Save button — only shown in Profile tab */}
        <Tabs defaultValue="profile" className="w-full">
          {/* ... wait, Tabs wraps everything */}
        </Tabs>
      </div>
```

Actually, it's cleaner to put Tabs outside the header row. Here is the full return structure to use:

```tsx
return (
  <div className="min-h-screen bg-background text-foreground">
    <StarField />

    <main className="container mx-auto px-4 pt-6 pb-24 max-w-2xl relative z-10">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate("/feed")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Avatar & Name — always visible above tabs */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-6">
        <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary/30 nebula-glow">
          <AvatarImage src={user?.user_metadata?.avatar_url || user?.user_metadata?.picture} />
          <AvatarFallback className="bg-primary/20 text-primary text-2xl font-serif">
            {(form.display_name || user?.email || "?").charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {isEditing ? (
          <Input
            value={form.display_name}
            onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
            className="max-w-xs mx-auto text-center text-xl font-serif bg-input/50 border-border/50"
            placeholder="Your display name"
          />
        ) : (
          <h1 className="text-3xl font-serif text-ethereal">{form.display_name || "Cosmic Traveler"}</h1>
        )}

        {/* Visibility toggle — same as before */}
        <div className="flex items-center justify-center gap-2 mt-3">
          {isEditing ? (
            <>
              <Switch checked={form.is_public} onCheckedChange={v => setForm(f => ({ ...f, is_public: v }))} id="public-toggle" />
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
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          <TabsTrigger value="chart" className="flex-1">Chart</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          {/* Edit button */}
          <div className="flex justify-end mb-4">
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              className="gap-2"
            >
              {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
              {isEditing ? "Save" : "Edit"}
            </Button>
          </div>

          {/* Big Three */}
          {profile && <BigThreeHeader profile={profile} />}

          {/* --- paste the rest of the existing profile content here --- */}
          {/* Current status, bio, planetary bios — all unchanged from current Profile.tsx */}
        </TabsContent>

        <TabsContent value="chart">
          {birthData ? (
            <ChartDashboard birthData={birthData} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-40" />
              <p>No birth data yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  </div>
);
```

**Important:** Do NOT rewrite the existing profile tab content — copy it from the current file. Only restructure the outer container to add the Tabs wrapper.

**Step 6: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 7: Test in the browser**

```bash
npm run dev
```

Navigate to `/profile`. Verify:
- "Profile" tab shows existing bio/Big Three content
- "Chart" tab shows the ChartDashboard wheel
- "Back" button goes to `/feed`
- Edit/Save works in Profile tab

**Step 8: Commit**

```bash
git add src/pages/Profile.tsx
git commit -m "feat: add Chart tab to Profile page, update Back→/feed"
```

---

## Task 7: Cleanup — delete old files, remove dead Feed link

Delete the files that are now replaced by the new architecture, and remove the Feed nav link from ChartDashboard (nav now lives in the AuthGuard/route layer, not in components).

**Files:**
- Delete: `src/pages/Index.tsx`
- Delete: `src/components/AuthGate.tsx`
- Modify: `src/components/ChartDashboard.tsx` (remove Feed link block)

**Step 1: Delete old files**

```bash
git rm src/pages/Index.tsx src/components/AuthGate.tsx
```

**Step 2: Remove Feed link from ChartDashboard**

In `src/components/ChartDashboard.tsx`, find and remove the following block (lines 120–129):

```tsx
      {/* Feed Link - Top Left */}
      <div className="fixed top-4 left-4 z-50">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors glass-panel px-3 py-1.5 rounded-lg"
        >
          <MessageSquare className="h-4 w-4" />
          Feed
        </Link>
      </div>
```

Also remove the now-unused imports from line 3–4 of ChartDashboard.tsx:
- `MessageSquare` from the lucide-react import
- `Link` from `react-router-dom` (only if it has no other usages — grep first: `grep -n "Link" src/components/ChartDashboard.tsx`)

**Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 4: Run lint**

```bash
npm run lint 2>&1 | head -30
```

Fix any lint errors (unused imports are the most likely issue).

**Step 5: Test the full flow in the browser**

```bash
npm run dev
```

Test these scenarios:
1. **Logged out user visits `/`** → redirected to `/sign-in` ✓
2. **Logged out user visits `/feed`** → redirected to `/sign-in` ✓
3. **New user signs up** → lands on `/onboarding` → fills form → lands on `/feed` ✓
4. **Returning user with birth data signs in** → lands on `/feed` ✓
5. **User visits `/profile`** → sees Profile and Chart tabs ✓
6. **User on Profile clicks Back** → goes to `/feed` ✓
7. **Deep link: logged-out visits `/transit`** → `/sign-in` → sign in → `/transit` (Clerk handles this via `afterSignInUrl` — note: for the `next` param pattern, this only triggers for already-authed users with no birth data, not sign-in redirects)

**Step 6: Commit**

```bash
git add src/components/ChartDashboard.tsx
git commit -m "chore: remove Feed nav link from ChartDashboard, delete Index.tsx and AuthGate.tsx"
```

---

## Final Verification

**Full smoke test:**

1. Open `http://localhost:8080/`
2. Verify redirect to `/sign-in`
3. Sign in with Google
4. If profile has birth data: lands on `/feed`
5. If no birth data: lands on `/onboarding` → complete form → `/feed`
6. From Feed header (UserMenu), navigate to `/profile`
7. Switch between Profile and Chart tabs
8. Click Back → `/feed`

**TypeScript and lint clean:**

```bash
npx tsc --noEmit && npm run lint
```

Both should pass with no errors.

**Build check:**

```bash
npm run build
```

Should complete with no errors.
