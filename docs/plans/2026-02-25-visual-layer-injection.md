# Visual Layer Injection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the existing Vite + React app into an immersive "award-winning" experience by adding smooth scroll, page transitions, magnetic buttons, scroll-spy reveals, a persistent R3F cosmic background, and GSAP hero sequences — without touching any auth, data, or routing logic.

**Architecture:** A `GlobalLayout` component (inside `<BrowserRouter>`) wraps all routes with three persistent layers: Lenis smooth scroll, a full-screen R3F `<Canvas>`, and Framer Motion `<AnimatePresence>`. Pages render inside `<AnimatePresence>` using `location.pathname` as the key so exit animations fire before the new page enters. The R3F canvas adapts to hardware tier and sleeps when the user scrolls deep into the feed.

**Tech Stack:** Lenis, GSAP + @gsap/react, split-type (new); Framer Motion v11, React Three Fiber + Drei, Tailwind (existing)

**Design doc:** `docs/plans/2026-02-25-visual-layer-injection-design.md`

---

## Background: Current App Structure

`src/App.tsx` layout (lines 147–196):
```
<ClerkProvider>
  <QueryClientProvider>
    <TooltipProvider>
      <BrowserRouter>
        <Routes>           ← GlobalLayout wraps this
          <Route "/" />
          <Route "/sign-in" />
          <Route "/onboarding" />
          <Route element={<AuthGuard><AuthedLayout /></AuthGuard>}>
            /feed, /profile, /friends, /bazaar, /live, /transit, ...
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
</ClerkProvider>
```

`GlobalLayout` must live **inside** `<BrowserRouter>` so it can call `useLocation()`.

---

## Phase 1 — Foundation: Lenis + Page Transitions

### Task 1: Install packages

**Files:** `package.json`

**Step 1: Install**
```bash
npm install lenis gsap @gsap/react split-type
npm install --save-dev @types/split-type
```

**Step 2: Verify install**
```bash
node -e "require('lenis'); require('gsap'); require('split-type'); console.log('ok')"
```
Expected: `ok`

**Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add lenis, gsap, @gsap/react, split-type"
```

---

### Task 2: Create PageTransition component

**Files:**
- Create: `src/components/layout/PageTransition.tsx`
- Test: `src/test/PageTransition.test.tsx`

**Step 1: Write failing test**

```tsx
// src/test/PageTransition.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PageTransition from "@/components/layout/PageTransition";

describe("PageTransition", () => {
  it("renders children", () => {
    render(
      <PageTransition>
        <p>hello</p>
      </PageTransition>
    );
    expect(screen.getByText("hello")).toBeTruthy();
  });
});
```

**Step 2: Run to confirm FAIL**
```bash
npx vitest run src/test/PageTransition.test.tsx
```

**Step 3: Implement**

```tsx
// src/components/layout/PageTransition.tsx
import { motion } from "framer-motion";
import { ReactNode } from "react";

const variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
  exit:    { opacity: 0, y: -8,  transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ pointerEvents: "auto" }}
    >
      {children}
    </motion.div>
  );
}
```

**Step 4: Run to confirm PASS**
```bash
npx vitest run src/test/PageTransition.test.tsx
```

**Step 5: Commit**
```bash
git add src/components/layout/PageTransition.tsx src/test/PageTransition.test.tsx
git commit -m "feat: add PageTransition component"
```

---

### Task 3: Create GlobalLayout component

**Files:**
- Create: `src/components/layout/GlobalLayout.tsx`

No unit test needed — this is a composition wrapper. Visual verification via `npm run dev`.

**Step 1: Create the file**

```tsx
// src/components/layout/GlobalLayout.tsx
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ReactLenis from "lenis/react";
import PageTransition from "./PageTransition";

interface GlobalLayoutProps {
  children: ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const location = useLocation();

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {/* Canvas layer lives here in Phase 3 */}
      <div
        className="relative z-10"
        style={{ pointerEvents: "none" }}
      >
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </AnimatePresence>
      </div>
    </ReactLenis>
  );
}
```

**Step 2: Verify it compiles**
```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors relating to `GlobalLayout.tsx`

**Step 3: Commit**
```bash
git add src/components/layout/GlobalLayout.tsx
git commit -m "feat: add GlobalLayout with Lenis + AnimatePresence"
```

---

### Task 4: Wire GlobalLayout into App.tsx

**Files:**
- Modify: `src/App.tsx`

**Step 1: Add import** at line 7 (after existing imports):
```tsx
import GlobalLayout from "@/components/layout/GlobalLayout";
```

**Step 2: Wrap `<Routes>` with GlobalLayout**

Find this block (lines 158–190):
```tsx
<BrowserRouter>
  <Routes>
    ...
  </Routes>
</BrowserRouter>
```

Replace with:
```tsx
<BrowserRouter>
  <GlobalLayout>
    <Routes>
      ...
    </Routes>
  </GlobalLayout>
</BrowserRouter>
```

**Step 3: Run full test suite**
```bash
npx vitest run
```
All existing tests must pass.

**Step 4: Visual check**
```bash
npm run dev
```
Navigate between `/feed` → `/profile` → `/transit`. You should see a smooth fade+slide transition instead of an instant swap.

**Step 5: Commit**
```bash
git add src/App.tsx
git commit -m "feat: wire GlobalLayout into App — Lenis + page transitions live"
```

---

### Task 5: Fix pointer-events in AuthedLayout

The `GlobalLayout` wrapper has `pointer-events: none` on its container. The `AuthedLayout` in `App.tsx` (line 40–144) must restore `pointer-events: auto` on its outermost div so the sidebar, nav, and content are all clickable.

**Files:**
- Modify: `src/App.tsx:43`

**Step 1: Find the outer div in AuthedLayout**

Line 43:
```tsx
<div className="min-h-screen md:grid md:grid-cols-[18rem_minmax(0,1fr)] lg:grid-cols-[20rem_minmax(0,1fr)]">
```

**Step 2: Add pointer-events-auto**
```tsx
<div className="min-h-screen md:grid md:grid-cols-[18rem_minmax(0,1fr)] lg:grid-cols-[20rem_minmax(0,1fr)] pointer-events-auto">
```

Also add `pointer-events-auto` to the fixed aurora bar (line 42):
```tsx
<div className="aurora-bar fixed top-0 left-0 right-0 z-50 pointer-events-none" aria-hidden="true" />
```

Also find the unauthenticated page wrappers (Onboarding, SignIn — they render directly without AuthedLayout). Each of those page components' outermost div needs `pointer-events-auto` or the class `pointer-events-auto` added. Check `src/pages/Onboarding.tsx` and `src/pages/SignIn.tsx` and add the class to their root elements.

**Step 3: Manual test**
```bash
npm run dev
```
Verify all buttons, links, and form inputs in the sidebar, feed, and nav are clickable.

**Step 4: Commit**
```bash
git add src/App.tsx src/pages/Onboarding.tsx src/pages/SignIn.tsx
git commit -m "fix: restore pointer-events on authenticated and public page layouts"
```

---

## Phase 2 — Scroll Motion: Magnetic Buttons + Scroll Reveals

### Task 6: Create useMagneticButton hook

**Files:**
- Create: `src/hooks/useMagneticButton.ts`
- Test: `src/test/useMagneticButton.test.ts`

**Step 1: Write failing test**

```ts
// src/test/useMagneticButton.test.ts
import { describe, it, expect } from "vitest";
import { computeMagneticOffset } from "@/hooks/useMagneticButton";

describe("computeMagneticOffset", () => {
  it("returns zero offset when mouse is far away", () => {
    // rect centered at (100, 100), 50px radius, mouse at (300, 300)
    const rect = { left: 75, top: 75, width: 50, height: 50 };
    const { x, y } = computeMagneticOffset(300, 300, rect, 0.4);
    expect(x).toBe(0);
    expect(y).toBe(0);
  });

  it("returns proportional offset when mouse is inside radius", () => {
    // rect centered at (100, 100), mouse at (110, 105) — close
    const rect = { left: 75, top: 75, width: 50, height: 50 };
    const { x, y } = computeMagneticOffset(110, 105, rect, 0.4);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeGreaterThan(0);
  });
});
```

**Step 2: Run to confirm FAIL**
```bash
npx vitest run src/test/useMagneticButton.test.ts
```

**Step 3: Implement**

```ts
// src/hooks/useMagneticButton.ts
import { useRef, useCallback } from "react";
import { useMotionValue, useSpring } from "framer-motion";

const RADIUS_MULTIPLIER = 1.5; // how far outside the button the magnet activates

interface Rect { left: number; top: number; width: number; height: number }

/** Pure function exposed for testing */
export function computeMagneticOffset(
  mouseX: number,
  mouseY: number,
  rect: Rect,
  strength: number,
): { x: number; y: number } {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const radius = Math.max(rect.width, rect.height) * RADIUS_MULTIPLIER;
  const dx = mouseX - cx;
  const dy = mouseY - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > radius) return { x: 0, y: 0 };
  return { x: dx * strength, y: dy * strength };
}

export function useMagneticButton(strength = 0.4) {
  const ref = useRef<HTMLElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 200, damping: 20 });
  const y = useSpring(rawY, { stiffness: 200, damping: 20 });

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const offset = computeMagneticOffset(e.clientX, e.clientY, rect, strength);
    rawX.set(offset.x);
    rawY.set(offset.y);
  }, [rawX, rawY, strength]);

  const onMouseLeave = useCallback(() => {
    rawX.set(0);
    rawY.set(0);
  }, [rawX, rawY]);

  return { ref, x, y, onMouseMove, onMouseLeave };
}
```

**Step 4: Run to confirm PASS**
```bash
npx vitest run src/test/useMagneticButton.test.ts
```

**Step 5: Commit**
```bash
git add src/hooks/useMagneticButton.ts src/test/useMagneticButton.test.ts
git commit -m "feat: add useMagneticButton hook"
```

---

### Task 7: Apply magnetic effect to primary CTAs

Apply `useMagneticButton` to the `BottomNav` "New Post" button and the `DesktopSidebar` "New Post" button. These are the two highest-value CTAs.

**Files:**
- Modify: `src/components/BottomNav.tsx`
- Modify: `src/components/DesktopSidebar.tsx`

**Step 1: Read both files** to find the New Post button in each.

**Step 2: Update BottomNav.tsx**

Find the "New Post" / post button element. Import and apply the hook:
```tsx
import { motion } from "framer-motion";
import { useMagneticButton } from "@/hooks/useMagneticButton";

// Inside the component:
const magnetic = useMagneticButton(0.3);

// Wrap the button:
<motion.div
  ref={magnetic.ref as React.RefObject<HTMLDivElement>}
  style={{ x: magnetic.x, y: magnetic.y }}
  onMouseMove={magnetic.onMouseMove}
  onMouseLeave={magnetic.onMouseLeave}
>
  {/* existing button */}
</motion.div>
```

**Step 3: Repeat for DesktopSidebar.tsx** — same pattern on the New Post button.

**Step 4: Visual check**
```bash
npm run dev
```
Hover over the New Post button — it should subtly pull toward the cursor.

**Step 5: Commit**
```bash
git add src/components/BottomNav.tsx src/components/DesktopSidebar.tsx
git commit -m "feat: add magnetic cursor effect to New Post CTAs"
```

---

### Task 8: Create useScrollReveal hook

**Files:**
- Create: `src/hooks/useScrollReveal.ts`
- Test: `src/test/useScrollReveal.test.ts`

This hook returns Framer Motion props (`initial`, `whileInView`, `viewport`) for consistent scroll-reveal behavior.

**Step 1: Write failing test**

```ts
// src/test/useScrollReveal.test.ts
import { describe, it, expect } from "vitest";
import { getRevealProps } from "@/hooks/useScrollReveal";

describe("getRevealProps", () => {
  it("returns initial with opacity 0", () => {
    const props = getRevealProps();
    expect(props.initial.opacity).toBe(0);
  });

  it("whileInView has opacity 1", () => {
    const props = getRevealProps();
    expect(props.whileInView.opacity).toBe(1);
  });

  it("accepts custom delay", () => {
    const props = getRevealProps({ delay: 0.2 });
    expect(props.transition.delay).toBe(0.2);
  });

  it("viewport triggers once by default", () => {
    const props = getRevealProps();
    expect(props.viewport.once).toBe(true);
  });
});
```

**Step 2: Run to confirm FAIL**
```bash
npx vitest run src/test/useScrollReveal.test.ts
```

**Step 3: Implement**

```ts
// src/hooks/useScrollReveal.ts
interface RevealOptions {
  delay?: number;
  y?: number;
  duration?: number;
}

/** Pure function: returns Framer Motion props for scroll-reveal. Exported for testing. */
export function getRevealProps(opts: RevealOptions = {}) {
  const { delay = 0, y = 20, duration = 0.5 } = opts;
  return {
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    transition: { duration, delay, ease: [0.25, 0.1, 0.25, 1] as const },
    viewport: { once: true, margin: "-60px" },
  } as const;
}

/** Hook alias for components that want to destructure directly */
export function useScrollReveal(opts?: RevealOptions) {
  return getRevealProps(opts);
}
```

**Step 4: Run to confirm PASS**
```bash
npx vitest run src/test/useScrollReveal.test.ts
```

**Step 5: Commit**
```bash
git add src/hooks/useScrollReveal.ts src/test/useScrollReveal.test.ts
git commit -m "feat: add useScrollReveal hook"
```

---

### Task 9: Apply scroll reveals to Feed post cards

**Files:**
- Modify: `src/components/feed/PostCard.tsx`

**Step 1: Read the file**
```bash
# Inspect current PostCard root element
```

**Step 2: Add scroll reveal to the card wrapper**

In `PostCard.tsx`, import and apply:
```tsx
import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";

// Inside component — pass index as delay multiplier:
const reveal = useScrollReveal({ delay: Math.min(index * 0.05, 0.3) });

// Wrap the outermost div with motion.div:
<motion.div {...reveal} className="pointer-events-auto">
  {/* existing card content unchanged */}
</motion.div>
```

Note: `PostCard` already receives an `index` prop (visible in `Feed.tsx`). Cap the delay at 0.3s so deep-scroll cards don't lag.

**Step 3: Run full test suite**
```bash
npx vitest run
```

**Step 4: Visual check**
```bash
npm run dev
```
Feed cards should fade+slide up as they enter the viewport.

**Step 5: Commit**
```bash
git add src/components/feed/PostCard.tsx
git commit -m "feat: scroll-reveal animation on feed post cards"
```

---

## Phase 3 — Cosmic Canvas: R3F Background + Adaptive Performance

### Task 10: Create performance tier detection

**Files:**
- Create: `src/lib/performance.ts`
- Test: `src/test/performance.test.ts`

**Step 1: Write failing test**

```ts
// src/test/performance.test.ts
import { describe, it, expect, vi } from "vitest";
import { detectPerformanceTierSync } from "@/lib/performance";

describe("detectPerformanceTierSync", () => {
  it("returns 3 when prefers-reduced-motion is set", () => {
    vi.stubGlobal("window", {
      matchMedia: (q: string) => ({ matches: q.includes("reduce") }),
    });
    expect(detectPerformanceTierSync()).toBe(3);
    vi.unstubAllGlobals();
  });

  it("returns 3 when no WebGL context available", () => {
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: false }),
    });
    const mockEl = { getContext: () => null };
    vi.spyOn(document, "createElement").mockReturnValue(mockEl as any);
    expect(detectPerformanceTierSync()).toBe(3);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});
```

**Step 2: Run to confirm FAIL**
```bash
npx vitest run src/test/performance.test.ts
```

**Step 3: Implement**

```ts
// src/lib/performance.ts

export type PerformanceTier = 1 | 2 | 3;

/** Synchronous tier check (no battery API). Used in tests and as fallback. */
export function detectPerformanceTierSync(): PerformanceTier {
  if (typeof window === "undefined") return 3;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return 3;

  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  if (!gl) return 3;

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  if (debugInfo) {
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string;
    if (/intel hd|intel uhd|mali|adreno [34]/i.test(renderer)) return 2;
  }

  return 1;
}

/** Full async check including Battery API. */
export async function detectPerformanceTier(): Promise<PerformanceTier> {
  const sync = detectPerformanceTierSync();
  if (sync === 3) return 3;

  if ("getBattery" in navigator) {
    try {
      const battery = await (navigator as any).getBattery();
      if (!battery.charging && battery.level < 0.2) return 3;
    } catch {
      // getBattery not supported or blocked — ignore
    }
  }

  return sync;
}
```

**Step 4: Run to confirm PASS**
```bash
npx vitest run src/test/performance.test.ts
```

**Step 5: Commit**
```bash
git add src/lib/performance.ts src/test/performance.test.ts
git commit -m "feat: add performance tier detection with battery and WebGL checks"
```

---

### Task 11: Create AdaptivePerformance context

**Files:**
- Create: `src/components/canvas/AdaptivePerformance.tsx`

```tsx
// src/components/canvas/AdaptivePerformance.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { detectPerformanceTier, PerformanceTier } from "@/lib/performance";

const Ctx = createContext<PerformanceTier>(1);

export function AdaptivePerformanceProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<PerformanceTier>(1);

  useEffect(() => {
    detectPerformanceTier().then(setTier);
  }, []);

  return <Ctx.Provider value={tier}>{children}</Ctx.Provider>;
}

export function usePerformanceTier(): PerformanceTier {
  return useContext(Ctx);
}
```

**Step 1: Verify it compiles**
```bash
npx tsc --noEmit 2>&1 | head -20
```

**Step 2: Commit**
```bash
git add src/components/canvas/AdaptivePerformance.tsx
git commit -m "feat: add AdaptivePerformance context provider"
```

---

### Task 12: Create CosmicBackground R3F scene

**Files:**
- Create: `src/components/canvas/CosmicBackground.tsx`

This is the R3F scene. It renders:
- A field of ~800 star particles (Points)
- A soft mouse-follow bloom glow (PointLight that tracks the mouse in world space)
- Tier 1: full scene. Tier 2: 400 particles, no mouse glow. Tier 3: null (CSS fallback).

```tsx
// src/components/canvas/CosmicBackground.tsx
import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { usePerformanceTier } from "./AdaptivePerformance";

const STAR_COUNT_TIER1 = 800;
const STAR_COUNT_TIER2 = 300;

function StarField({ count }: { count: number }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return arr;
  }, [count]);

  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.02;
      ref.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        color="#a855f7"
        size={0.025}
        sizeAttenuation
        depthWrite={false}
        opacity={0.7}
      />
    </Points>
  );
}

function MouseGlow() {
  const lightRef = useRef<THREE.PointLight>(null);
  const { viewport } = useThree();

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!lightRef.current) return;
    const x = (e.clientX / window.innerWidth)  * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    lightRef.current.position.set(
      x  * viewport.width  / 2,
      y  * viewport.height / 2,
      2
    );
  }, [viewport]);

  // Attach to window so it works through pointer-events:none layers
  useFrame(() => {});
  // Use useEffect for event listener
  const { gl } = useThree();
  // Attach once
  useMemo(() => {
    window.addEventListener("pointermove", handlePointerMove);
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [handlePointerMove]);

  return (
    <pointLight
      ref={lightRef}
      color="#c084fc"
      intensity={2}
      distance={6}
      decay={2}
    />
  );
}

function Scene({ tier }: { tier: 1 | 2 }) {
  const count = tier === 1 ? STAR_COUNT_TIER1 : STAR_COUNT_TIER2;
  return (
    <>
      <ambientLight intensity={0.1} />
      <StarField count={count} />
      {tier === 1 && <MouseGlow />}
    </>
  );
}

export default function CosmicBackground() {
  const tier = usePerformanceTier();
  if (tier === 3) return null; // CSS fallback handles Tier 3

  return (
    <div
      className="fixed inset-0 z-0"
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        gl={{ antialias: false, alpha: true }}
        dpr={[1, tier === 1 ? 2 : 1]}
        frameloop="always"
        style={{ background: "transparent" }}
      >
        <Scene tier={tier as 1 | 2} />
      </Canvas>
    </div>
  );
}
```

**Step 1: Verify it compiles**
```bash
npx tsc --noEmit 2>&1 | head -30
```
Fix any type errors before proceeding.

**Step 2: Commit**
```bash
git add src/components/canvas/CosmicBackground.tsx
git commit -m "feat: add CosmicBackground R3F scene with star particles and mouse glow"
```

---

### Task 13: Add Tier 3 CSS glow fallback

For devices that can't run WebGL, add a pure-CSS animated gradient that mimics the ambient glow.

**Files:**
- Modify: `src/index.css`

**Step 1: Add these custom properties and class after the existing `:root` block**

```css
/* ── Tier-3 Cosmic Fallback (CSS-only ambient glow) ─────────────── */
.cosmic-bg-fallback {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 80% 60% at 20% 30%, hsl(275 80% 20% / 0.35) 0%, transparent 70%),
    radial-gradient(ellipse 60% 80% at 80% 70%, hsl(275 60% 15% / 0.25) 0%, transparent 70%);
  animation: cosmicPulse 8s ease-in-out infinite alternate;
}

@keyframes cosmicPulse {
  from { opacity: 0.6; }
  to   { opacity: 1; }
}
```

**Step 2: Add the fallback div to CosmicBackground.tsx**

In `src/components/canvas/CosmicBackground.tsx`, update the early return:
```tsx
if (tier === 3) {
  return <div className="cosmic-bg-fallback" aria-hidden="true" />;
}
```

**Step 3: Commit**
```bash
git add src/index.css src/components/canvas/CosmicBackground.tsx
git commit -m "feat: add CSS-only Tier 3 cosmic glow fallback"
```

---

### Task 14: Wire CosmicBackground into GlobalLayout

**Files:**
- Modify: `src/components/layout/GlobalLayout.tsx`
- Modify: `src/App.tsx`

**Step 1: Update GlobalLayout.tsx** to import and render the canvas:

```tsx
// src/components/layout/GlobalLayout.tsx
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ReactLenis from "lenis/react";
import PageTransition from "./PageTransition";
import CosmicBackground from "@/components/canvas/CosmicBackground";

interface GlobalLayoutProps {
  children: ReactNode;
}

export default function GlobalLayout({ children }: GlobalLayoutProps) {
  const location = useLocation();

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {/* z-0: persistent R3F canvas */}
      <CosmicBackground />

      {/* z-10: motion layer + content */}
      <div className="relative z-10" style={{ pointerEvents: "none" }}>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            {children}
          </PageTransition>
        </AnimatePresence>
      </div>
    </ReactLenis>
  );
}
```

**Step 2: Wrap App.tsx with AdaptivePerformanceProvider**

In `src/App.tsx`, add import:
```tsx
import { AdaptivePerformanceProvider } from "@/components/canvas/AdaptivePerformance";
```

Wrap the outermost provider:
```tsx
const App = () => (
  <AdaptivePerformanceProvider>
    <ClerkProvider ...>
      ...
    </ClerkProvider>
  </AdaptivePerformanceProvider>
);
```

**Step 3: Run full test suite**
```bash
npx vitest run
```

**Step 4: Visual check — 3 things to verify**
```bash
npm run dev
```
- [ ] Stars visible rotating slowly in background
- [ ] Moving mouse creates a soft purple glow that follows cursor
- [ ] Navigating between routes: canvas stays, page slides in/out

**Step 5: Commit**
```bash
git add src/components/layout/GlobalLayout.tsx src/App.tsx
git commit -m "feat: wire CosmicBackground and AdaptivePerformance into GlobalLayout"
```

---

## Phase 4 — GSAP Hero: Sequenced Reveals

### Task 15: GSAP text reveal on Onboarding

**Files:**
- Modify: `src/pages/Onboarding.tsx`

The Onboarding page has a heading and subtitle. We animate them with a GSAP stagger using `split-type`.

**Step 1: Read Onboarding.tsx** to find the heading and subtitle elements.

**Step 2: Add the hero reveal**

At the top of the `Onboarding` component:
```tsx
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import SplitType from "split-type";
import { useRef } from "react";
```

Inside the component body, before the return:
```tsx
const heroRef = useRef<HTMLDivElement>(null);

useGSAP(() => {
  if (!heroRef.current) return;

  const headings = heroRef.current.querySelectorAll("[data-gsap-heading]");
  headings.forEach((el) => {
    const split = new SplitType(el as HTMLElement, { types: "chars" });
    gsap.from(split.chars, {
      opacity: 0,
      y: 30,
      stagger: 0.03,
      duration: 0.6,
      ease: "power3.out",
      delay: 0.2,
    });
  });
}, { scope: heroRef });
```

Add `data-gsap-heading` attribute to the main heading element in the JSX. Add `ref={heroRef}` to the section wrapper.

**Step 3: Visual check**
```bash
npm run dev
```
Navigate to `/onboarding` — heading letters should stagger in from below.

**Step 4: Run full test suite**
```bash
npx vitest run
```

**Step 5: Commit**
```bash
git add src/pages/Onboarding.tsx
git commit -m "feat: GSAP split-type stagger reveal on Onboarding heading"
```

---

### Task 16: GSAP entrance for TodaysPlanetaryBar

**Files:**
- Modify: `src/components/TodaysPlanetaryBar.tsx`

The planetary bar already uses Framer Motion for the chip animations. We add a GSAP entrance sequence for the outer container so the whole widget "arrives" on the Feed with a cinematic feel.

**Step 1: Read TodaysPlanetaryBar.tsx** — find the outer `<motion.div>` wrapper (line ~176).

**Step 2: Replace Framer Motion initial animation with GSAP**

The current wrapper has `initial={{ opacity: 0, y: -10 }}`. Replace that with a `ref` + `useGSAP` sequence:

```tsx
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";
```

In the component:
```tsx
const containerRef = useRef<HTMLDivElement>(null);

useGSAP(() => {
  if (!containerRef.current) return;
  gsap.from(containerRef.current, {
    opacity: 0,
    y: -16,
    duration: 0.8,
    ease: "power3.out",
    delay: 0.1,
  });
}, { scope: containerRef });
```

On the outermost `motion.div`, remove `initial` and `animate` props (GSAP owns the entrance now). Add `ref={containerRef}`. Keep `motion.div` for any ongoing animations (like planet chip pulses — those stay as Framer Motion).

**Step 3: Run full test suite**
```bash
npx vitest run
```

**Step 4: Visual check**
```bash
npm run dev
```
The planetary bar should glide in from the top with a smooth ease on Feed load.

**Step 5: Commit**
```bash
git add src/components/TodaysPlanetaryBar.tsx
git commit -m "feat: GSAP cinematic entrance for TodaysPlanetaryBar"
```

---

### Task 17: Final validation

**Step 1: Full test suite**
```bash
npx vitest run
```
Expected: all tests pass (36+ tests).

**Step 2: Lint**
```bash
npm run lint
```
Fix any errors.

**Step 3: Build**
```bash
npm run build
```
No TypeScript errors. Bundle warning about size is acceptable (pre-existing).

**Step 4: Lighthouse audit** (optional but recommended)
Open Chrome DevTools → Lighthouse → Performance.
Target: 90+.

**Step 5: Final commit if needed**
```bash
git add -A
git commit -m "fix: visual layer injection final polish"
```

---

## Success Criteria Checklist

- [ ] Page transitions: smooth fade+Y-slide on all route changes, no white flash
- [ ] Lenis: buttery scroll on desktop; native on `prefers-reduced-motion`
- [ ] Magnetic buttons: New Post CTAs pull toward cursor
- [ ] Scroll-spy: Feed cards reveal on scroll
- [ ] R3F background: star particles + mouse glow persist through navigation
- [ ] Tier 3 CSS fallback renders on mobile/battery-saver devices
- [ ] Onboarding heading: GSAP split-type stagger reveal
- [ ] TodaysPlanetaryBar: cinematic GSAP entrance
- [ ] All existing tests pass
- [ ] TypeScript build clean
