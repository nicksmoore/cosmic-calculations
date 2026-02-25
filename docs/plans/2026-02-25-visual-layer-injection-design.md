# Visual Layer Injection — Design Doc

**Date:** 2026-02-25
**Status:** Green-lit
**Goal:** Transform the existing Vite + React app into a high-end immersive experience by injecting a persistent 4-layer architecture — without a framework migration.

---

## The Core Insight

The app already owns the heavy hitters: Framer Motion v11, React Three Fiber + Drei, Tailwind. Adding only **Lenis** (smooth scroll) and **GSAP** (timeline sequencing) bridges the gap from "animated" to "award-winning" without touching Clerk, Supabase, or any data logic.

---

## Architecture: The Four Layers

```
┌─────────────────────────────────────┐
│  SCROLL LAYER   Lenis (root)        │  z: base — owns wheel events
│  CANVAS LAYER   R3F <Canvas>        │  z: 0    — persists across all routes
│  MOTION LAYER   AnimatePresence     │  z: 10   — drives page transitions
│  CONTENT LAYER  React Router pages  │  z: 20   — swaps per URL
└─────────────────────────────────────┘
```

The Canvas Layer is a "stage" — it never unmounts. Pages are "actors" that swap on stage. This is how high-end sites maintain ambient vibe during navigation.

### Pointer-Events Strategy

The Content Layer wrapper (`z: 20`) must use `pointer-events: none` on its **container** and `pointer-events: auto` on **all interactive children** (buttons, links, inputs). This lets the R3F mouse-follow glow "feel" the cursor through transparent regions of the layout without blocking Canvas mouse events.

---

## Packages Added (3 only)

| Package | Purpose | Bundle impact |
|---|---|---|
| `lenis` | Smooth inertial scroll foundation | ~7 KB |
| `gsap` | Hero timeline sequencing + stagger | ~70 KB |
| `@gsap/react` | `useGSAP` hook with auto-cleanup | ~2 KB |
| `split-type` | Text splitting for GSAP char/word stagger | ~5 KB |

**Not added:** `@theatre/core` — background is procedural/ambient, not cinematically choreographed. Skipped to keep bundle lean.

---

## New Files

```
src/
├── components/
│   ├── layout/
│   │   ├── GlobalLayout.tsx          ← Lenis + Canvas + AnimatePresence master wrapper
│   │   └── PageTransition.tsx        ← per-route Framer Motion wrapper
│   └── canvas/
│       ├── CosmicBackground.tsx      ← R3F scene: particles + mouse-follow glow
│       └── AdaptivePerformance.tsx   ← tier detection + R3F frameloop control
├── hooks/
│   ├── useMagneticButton.ts          ← magnetic cursor pull on hover
│   └── useScrollReveal.ts            ← Framer Motion whileInView helper
└── lib/
    └── performance.ts                ← device tier detection
```

**Modified files:**
- `src/App.tsx` — wrap with GlobalLayout
- Page components — wrap with `<PageTransition>`
- CTA buttons — opt-in magnetic behavior
- `src/index.css` — CSS custom properties for Tier 3 glow fallback

---

## AnimatePresence + React Router: The Key Fix

In Vite + React Router, `AnimatePresence` must receive `location.pathname` as the `key` on the `PageTransition` wrapper. Without this, React Router swaps components before Framer Motion can capture the exit animation.

```tsx
// GlobalLayout.tsx
const location = useLocation();
<AnimatePresence mode="wait">
  <PageTransition key={location.pathname}>
    <Outlet />
  </PageTransition>
</AnimatePresence>
```

---

## Animation Tool Assignment

| Use case | Tool | Reason |
|---|---|---|
| Page transitions | Framer Motion AnimatePresence | Clean route-aware exit/enter |
| Hero big reveal (text) | GSAP + split-type | Staggered char/word control |
| Feed/card scroll reveals | Framer Motion `whileInView` | Simpler than GSAP ScrollTrigger for 100s of elements |
| Magnetic buttons | Framer Motion `useMotionValue` | Smooth spring physics |
| R3F background animation | R3F `useFrame` + `useSpring` | Native to Three.js render loop |
| 3D cursor glow | R3F `useThree` + raycasting | Full WebGL mouse tracking |

---

## Adaptive Performance: Three Tiers

Detected once on mount, stored in React context:

| Tier | Condition | What runs |
|---|---|---|
| **1 — High** | Desktop, WebGL2, no battery saver | Full R3F shaders + particles, mouse glow |
| **2 — Mid** | Mobile WebGL or mid-range GPU | Reduced particle count, no fragment shaders |
| **3 — Low** | No WebGL, `prefers-reduced-motion`, or battery saver | CSS `backdrop-filter` blur gradient only |

### Detection Logic

```ts
// lib/performance.ts
export async function detectPerformanceTier(): Promise<1 | 2 | 3> {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 3;

  // Battery Saver check
  if ('getBattery' in navigator) {
    const battery = await (navigator as any).getBattery();
    if (battery.charging === false && battery.level < 0.2) return 3;
  }

  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  if (!gl) return 3;

  // Rough GPU tier via renderer string
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo
    ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string
    : '';
  if (/intel|mali|adreno 3|adreno 4/i.test(renderer)) return 2;

  return 1;
}
```

### R3F Sleep State

The R3F `frameloop` switches `"always"` → `"demand"` when:
- Scroll position > 300px into the feed
- `document.hidden === true` (tab loses focus)
- Device is Tier 2/3

---

## Implementation Phases

### Phase 1 — Foundation (~4 hrs)
- Install `lenis`, `gsap`, `@gsap/react`, `split-type`
- Create `GlobalLayout.tsx`: Lenis root + AnimatePresence with `location.pathname` key
- Create `PageTransition.tsx`: fade + Y-slide exit/enter
- Wire into `App.tsx`

### Phase 2 — Scroll Motion (~4 hrs)
- Create `useMagneticButton.ts` hook, apply to primary CTAs
- Create `useScrollReveal.ts`, apply to Feed cards, Profile sections
- Add `pointer-events` strategy to content layer wrapper

### Phase 3 — Cosmic Canvas (~1 day)
- Create `performance.ts` tier detection (including `getBattery`)
- Create `AdaptivePerformance.tsx` context provider
- Create `CosmicBackground.tsx`: R3F particles + mouse-follow glow
- Tier 3 CSS fallback in `index.css`
- Integrate into GlobalLayout

### Phase 4 — GSAP Hero (~4 hrs)
- Add `split-type` text reveal to Onboarding intro
- Add GSAP timeline to Feed sky header (TodaysPlanetaryBar entrance)
- Ensure GSAP instances are cleaned up via `useGSAP` context

---

## Success Criteria

- [ ] Page transitions: no white flash, smooth slide/fade on all routes
- [ ] Lenis: scroll feels buttery on desktop; disabled/native on `prefers-reduced-motion`
- [ ] Magnetic buttons: cursor pull on all primary CTAs
- [ ] Scroll-spy: Feed cards + Profile sections reveal on scroll
- [ ] R3F background: persists through navigation, mouse-follow glow on Tier 1
- [ ] Tier 3 fallback renders correctly on mobile / battery saver
- [ ] Lighthouse Performance: 90+ maintained
- [ ] `npx vitest run`: all existing tests pass
