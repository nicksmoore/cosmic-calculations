# LinkedIn-Style Navigation Design

**Date:** 2026-02-19
**Project:** Cosmic Calculations
**Phase:** Social — Navigation Overhaul

## Goal

Redesign the app's navigation from a "state-machine on a single URL" model to a resource-oriented routing model. After login, users land on Feed (the social hub). First-time users are routed through a dedicated `/onboarding` page to capture birth data. Profile has tabs for bio/Big Three and the natal chart. The experience mirrors LinkedIn: Feed is home, Profile is a drill-down.

---

## Route Map

| Route | Component | Access |
|-------|-----------|--------|
| `/` | `<RootRedirect>` | Public — redirects: auth+data→`/feed`, auth+no-data→`/onboarding`, anon→`/sign-in` |
| `/sign-in` | `<SignInPage>` | Public (anon only — auth redirects to `/feed`) |
| `/onboarding` | `<Onboarding>` | Auth required; auth+has birth data → redirects to `/feed` |
| `/feed` | `<Feed>` | Auth + birth data required |
| `/profile` | `<ProfilePage>` | Auth + birth data required |
| `/transit` | `<TransitDetail>` | Auth + birth data required |

---

## Auth Guard Logic

A single `<AuthGuard>` component wraps all protected routes. It reads from `useAuth()` (Clerk) and `useProfile()` (Supabase). During profile loading, render a spinner to prevent redirect flicker.

| User State | Requested URL | Guard Result |
|------------|--------------|--------------|
| Loading profile | Any | Spinner (no redirect yet) |
| Not signed in | Any | `<Navigate to="/sign-in" replace />` |
| Signed in + no birth data | Any except `/onboarding` | `<Navigate to={/onboarding?next=<encoded path>} replace />` |
| Signed in + has birth data | `/onboarding` | `<Navigate to="/feed" replace />` |
| Signed in + has birth data | `/` | `<Navigate to="/feed" replace />` |
| Signed in + has birth data | Any other | Render children |

**"Has birth data" check:** `!!profile?.birth_date && !!profile?.birth_lat && !!profile?.birth_lng`

**Deep link redirect-back pattern:**
```
/transit → guard → /onboarding?next=%2Ftransit → save birth data → navigate('/transit', { replace: true })
```

Use `encodeURIComponent(location.pathname + location.search)` for the `next` param to handle paths that contain their own query strings.

Always use `replace: true` on all guard redirects so "Back" never loops through a redirector page.

---

## Components

### `<RootRedirect>` (`src/pages/RootRedirect.tsx`)

Thin component. Reads `useAuth()` + `useProfile()`. Renders nothing; returns a `<Navigate>` immediately based on state. Used only at `/`.

### `<AuthGuard>` (`src/components/AuthGuard.tsx`)

Replaces the old `AuthGate.tsx`. Route-level wrapper (not component-level). Accepts `children`. Implements the truth table above. `useProfile()` loading state returns a centered `<Loader2>` spinner.

### `<SignInPage>` (`src/pages/SignIn.tsx`)

Thin wrapper around Clerk's `<SignIn>` component. Sets:
- `afterSignInUrl="/feed"` — returning users go to Feed
- `afterSignUpUrl="/onboarding"` — new users go to onboarding

### `<Onboarding>` (`src/pages/Onboarding.tsx`)

Extracts `BirthDataForm` from the old `Index.tsx`. On form submission:
1. Save birth data to Supabase via `updateProfile()`
2. Invalidate the `useProfile` query so `AuthGuard` re-reads fresh state
3. `navigate(searchParams.get('next') ?? '/feed', { replace: true })`

Page includes a header ("Tell us when you were born") and the existing `BirthDataForm` component unchanged.

### `<ProfilePage>` (`src/pages/Profile.tsx`) — modified

Add a tab bar at the top with two tabs:

- **Profile tab** — existing content (avatar, Big Three, bio, planetary bios, edit mode)
- **Chart tab** — `<ChartDashboard>` rendered with birth data reconstructed from profile (same pattern as `Feed.tsx`: `useProfile()` → reconstruct `BirthData` → `useEphemeris(birthData)`)

Use Radix `<Tabs>` (already in the project via shadcn/ui). Default tab: `profile`.

### `App.tsx` — modified

```tsx
<Routes>
  <Route path="/" element={<RootRedirect />} />
  <Route path="/sign-in" element={<SignInPage />} />
  <Route path="/onboarding" element={<AuthGuard requireBirthData={false}><Onboarding /></AuthGuard>} />
  <Route path="/feed" element={<AuthGuard><Feed /></AuthGuard>} />
  <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
  <Route path="/transit" element={<AuthGuard><TransitDetail /></AuthGuard>} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

`AuthGuard` accepts an optional `requireBirthData` prop (default `true`). When `false`, skips the birth data check (used for `/onboarding` itself).

---

## Files Deleted

- `src/pages/Index.tsx` — replaced by `RootRedirect.tsx` + `Onboarding.tsx`
- `src/components/AuthGate.tsx` — replaced by `AuthGuard.tsx`

## Files Modified

- `src/App.tsx` — new route tree
- `src/pages/Profile.tsx` — add Chart tab
- `src/components/ChartDashboard.tsx` — remove Feed nav link (nav is now in the layout)

## Files Created

- `src/components/AuthGuard.tsx`
- `src/pages/RootRedirect.tsx`
- `src/pages/SignIn.tsx`
- `src/pages/Onboarding.tsx`

---

## Key Constraints & Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth guard location | Route-level wrapper | Components stay "dumb"; routing logic is co-located with routes |
| Birth data flag source | `useProfile()` (Supabase) | Single source of truth; stays in sync with DB |
| Loading state handling | Spinner in AuthGuard | Prevents redirect flicker during profile fetch |
| `replace: true` on all redirects | Always | Keeps redirector pages out of browser history; no back-button loops |
| Deep link preservation | `?next=` query param | Standard pattern; survives full page loads |
| Chart location | Profile tab (not separate route) | Reduces route surface; Profile is the natural home for chart |
| Clerk `afterSignUpUrl` | `/onboarding` | New users always onboard before hitting feed |
| Clerk `afterSignInUrl` | `/feed` | Returning users land on feed immediately |
| `AuthGuard requireBirthData` prop | Optional, default true | Allows onboarding route to opt out cleanly |
