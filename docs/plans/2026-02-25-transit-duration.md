# Transit Duration Display Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show how long each active transit will last, both in the Daily Feed card (collective planet-planet transits) and in the Transit Detail page (personal transits to natal chart).

**Architecture:** Two separate duration-calculation paths: (1) collective transits in `transitEngine.ts` use the already-computed daily orb-change rate for precise remaining-days; (2) personal transits in `transits.ts` use a lookup table of approximate planetary daily motion to estimate the total transit window. A shared `formatTransitDuration` utility formats both into human-readable labels. Display sites are `DailyHookCard` (transit list section) and `TransitDetail` `AspectCard`.

**Tech Stack:** TypeScript, Vitest (tests), React + Tailwind (display)

---

## Background: Key Files

| File | Role |
|------|------|
| `src/lib/transitEngine.ts` | Computes collective planet-planet transits; already has `orbNow`, `orbNext`, `orbChange = orbNow - orbNext` per transit |
| `src/lib/astrocartography/transits.ts` | Computes personal (transiting planet → natal point) aspects; aspect orb limits in `ASPECT_ORBS` |
| `src/components/feed/DailyHookCard.tsx` | Renders collective transit data from `useDailyTransits()` |
| `src/pages/TransitDetail.tsx` | Renders personal transit aspects via `AspectCard` |
| `src/test/` | Vitest tests (run with `npx vitest run`) |

---

### Task 1: `formatTransitDuration` utility

**Files:**
- Create: `src/lib/formatTransitDuration.ts`
- Create: `src/test/formatTransitDuration.test.ts`

**Step 1: Write the failing test**

```ts
// src/test/formatTransitDuration.test.ts
import { describe, it, expect } from "vitest";
import { formatTransitDuration } from "@/lib/formatTransitDuration";

describe("formatTransitDuration", () => {
  it("returns '< 1 day' for fractional days below 1", () => {
    expect(formatTransitDuration(0.4)).toBe("< 1 day");
  });

  it("returns '~1 day' for exactly 1 day", () => {
    expect(formatTransitDuration(1)).toBe("~1 day");
  });

  it("returns '~3 days' for 3 days", () => {
    expect(formatTransitDuration(3)).toBe("~3 days");
  });

  it("returns '~2 weeks' for 14 days", () => {
    expect(formatTransitDuration(14)).toBe("~2 weeks");
  });

  it("returns '~3 months' for 90 days", () => {
    expect(formatTransitDuration(90)).toBe("~3 months");
  });

  it("returns '~1 year' for 365 days", () => {
    expect(formatTransitDuration(365)).toBe("~1 year");
  });

  it("returns '~2 years' for 730 days", () => {
    expect(formatTransitDuration(730)).toBe("~2 years");
  });

  it("returns null for null input", () => {
    expect(formatTransitDuration(null)).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/formatTransitDuration.test.ts
```
Expected: FAIL — module not found

**Step 3: Write minimal implementation**

```ts
// src/lib/formatTransitDuration.ts
export function formatTransitDuration(days: number | null): string | null {
  if (days === null || days === undefined) return null;

  if (days < 1) return "< 1 day";
  if (days < 7) {
    const d = Math.round(days);
    return `~${d} ${d === 1 ? "day" : "days"}`;
  }
  if (days < 30) {
    const w = Math.round(days / 7);
    return `~${w} ${w === 1 ? "week" : "weeks"}`;
  }
  if (days < 365) {
    const m = Math.round(days / 30);
    return `~${m} ${m === 1 ? "month" : "months"}`;
  }
  const y = Math.round(days / 365);
  return `~${y} ${y === 1 ? "year" : "years"}`;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/formatTransitDuration.test.ts
```
Expected: All 8 tests PASS

**Step 5: Commit**

```bash
git add src/lib/formatTransitDuration.ts src/test/formatTransitDuration.test.ts
git commit -m "feat: add formatTransitDuration utility"
```

---

### Task 2: Add `duration_days` to collective transits in `transitEngine.ts`

**Files:**
- Modify: `src/lib/transitEngine.ts`
- Create: `src/test/transitEngine.test.ts`

**Background:**
In `getDailyCollectiveTransits()`, each transit already computes:
```ts
const orbNow  = Math.abs(angularDiff(posA.lon, posB.lon) - aspect.angle);
const orbNext = Math.abs(angularDiff(posANext.lon, posB.lon) - aspect.angle);
const orbChange = orbNow - orbNext; // positive = applying, negative = separating
```
`COLLECTIVE_ORB = 1` (the allowed orb limit in degrees).

Duration formula:
- **Applying** (`orbChange > 0.001`): days remaining = `(orbNow + COLLECTIVE_ORB) / orbChange`
  - Explanation: orb must close to 0 (exact) then open back to `COLLECTIVE_ORB` to exit
- **Separating** (`orbChange < -0.001`): days remaining = `(COLLECTIVE_ORB - orbNow) / Math.abs(orbChange)`
  - Explanation: orb must open from current position to `COLLECTIVE_ORB` limit
- **Stationary** (`|orbChange| <= 0.001`): return `null` (indeterminate, outer planet station)
- Cap result at 365 days

**Step 1: Write the failing test**

```ts
// src/test/transitEngine.test.ts
import { describe, it, expect } from "vitest";
import { computeCollectiveDuration } from "@/lib/transitEngine";

describe("computeCollectiveDuration", () => {
  it("returns null when orbChange is near zero (stationary)", () => {
    expect(computeCollectiveDuration(0.5, 0.0001)).toBeNull();
  });

  it("applying transit: days remaining includes time to exact + exit", () => {
    // orb=0.5, orbChange=0.1/day, COLLECTIVE_ORB=1
    // days = (0.5 + 1) / 0.1 = 15
    expect(computeCollectiveDuration(0.5, 0.1)).toBeCloseTo(15, 1);
  });

  it("separating transit: days remaining until exit of orb", () => {
    // orb=0.3, orbChange=-0.1/day, COLLECTIVE_ORB=1
    // days = (1 - 0.3) / 0.1 = 7
    expect(computeCollectiveDuration(0.3, -0.1)).toBeCloseTo(7, 1);
  });

  it("caps at 365 days for extremely slow-moving aspects", () => {
    // orb=0.001, orbChange=0.000001/day → would be ~1001000 days
    expect(computeCollectiveDuration(0.001, 0.000001)).toBe(365);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/transitEngine.test.ts
```
Expected: FAIL — `computeCollectiveDuration` not exported

**Step 3: Add `duration_days` to the `CollectiveTransit` interface and export `computeCollectiveDuration`**

In `src/lib/transitEngine.ts`:

1. Update the `CollectiveTransit` interface to add `duration_days`:
```ts
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
  duration_days: number | null;  // ADD THIS
}
```

2. Add the exported helper function (add before `getDailyCollectiveTransits`):
```ts
/** Exposed for testing. Computes remaining days for a collective transit. */
export function computeCollectiveDuration(orb: number, orbChange: number): number | null {
  if (Math.abs(orbChange) <= 0.001) return null;
  const days = orbChange > 0
    ? (orb + COLLECTIVE_ORB) / orbChange
    : (COLLECTIVE_ORB - orb) / Math.abs(orbChange);
  return Math.min(Math.max(0, days), 365);
}
```

3. In `getDailyCollectiveTransits()`, inside the loop where `collectiveTransits.push(...)`, add `duration_days` to the pushed object:
```ts
duration_days: computeCollectiveDuration(orb, orbChange),
```
The `orbChange` is already computed on the line just above as `const orbChange = orbNow - orbNext;`.

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/transitEngine.test.ts
```
Expected: All 4 tests PASS

**Step 5: Commit**

```bash
git add src/lib/transitEngine.ts src/test/transitEngine.test.ts
git commit -m "feat: add duration_days to CollectiveTransit"
```

---

### Task 3: Add `durationDays` to personal transit aspects in `transits.ts`

**Files:**
- Modify: `src/lib/astrocartography/transits.ts`
- Create: `src/test/transits.test.ts`

**Background:**
`TransitAspect` is built in `findAspects()`. We know the `orb` (how far from exact) and `aspectType` (which gives `ASPECT_ORBS` limit). Duration formula (total window, not remaining):
```
durationDays = (2 * orbLimit) / approxDailyMotion
```
Use approximate direct daily motion; retrograde state is unknown here and the approximation is good enough for display.

Approximate daily motions (degrees per day, direct):
```ts
const APPROX_DAILY_MOTION: Record<string, number> = {
  Sun: 1.0, Moon: 13.0, Mercury: 1.2, Venus: 1.2,
  Mars: 0.52, Jupiter: 0.083, Saturn: 0.033,
  Uranus: 0.012, Neptune: 0.006, Pluto: 0.004, Chiron: 0.05,
};
```

**Step 1: Write the failing test**

```ts
// src/test/transits.test.ts
import { describe, it, expect } from "vitest";
import { computePersonalTransitDuration } from "@/lib/astrocartography/transits";

describe("computePersonalTransitDuration", () => {
  it("Sun conjunction (orb limit 8°): total window ~16 days", () => {
    // 2 * 8 / 1.0 = 16
    expect(computePersonalTransitDuration("Sun", "conjunction")).toBeCloseTo(16, 0);
  });

  it("Saturn trine (orb limit 6°): total window ~364 days", () => {
    // 2 * 6 / 0.033 ≈ 364
    expect(computePersonalTransitDuration("Saturn", "trine")).toBeCloseTo(364, 0);
  });

  it("Moon sextile (orb limit 4°): total window < 1 day", () => {
    // 2 * 4 / 13.0 ≈ 0.6
    expect(computePersonalTransitDuration("Moon", "sextile")).toBeLessThan(1);
  });

  it("returns null for unknown planet", () => {
    expect(computePersonalTransitDuration("Eris", "trine")).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run src/test/transits.test.ts
```
Expected: FAIL — `computePersonalTransitDuration` not exported

**Step 3: Add `durationDays` to `TransitAspect` and export the helper**

In `src/lib/astrocartography/transits.ts`:

1. Add constants near the top (after `ASPECT_ORBS`):
```ts
const APPROX_DAILY_MOTION: Record<string, number> = {
  Sun: 1.0, Moon: 13.0, Mercury: 1.2, Venus: 1.2,
  Mars: 0.52, Jupiter: 0.083, Saturn: 0.033,
  Uranus: 0.012, Neptune: 0.006, Pluto: 0.004, Chiron: 0.05,
};
```

2. Add exported helper (near the top, after constants):
```ts
/** Exposed for testing. Total transit window in days (entry to exit). */
export function computePersonalTransitDuration(
  planet: string,
  aspectType: TransitAspectType,
): number | null {
  const speed = APPROX_DAILY_MOTION[planet];
  if (!speed) return null;
  const orbLimit = ASPECT_ORBS[aspectType];
  return (2 * orbLimit) / speed;
}
```

3. Update `TransitAspect` interface to add `durationDays`:
```ts
export interface TransitAspect {
  transitPlanet: string;
  transitSign: string;
  transitDegree: number;
  natalPlanet: string;
  natalSign: string;
  aspectType: TransitAspectType;
  orb: number;
  isExact: boolean;
  isBenefic: boolean;
  durationDays: number | null;  // ADD THIS
}
```

4. In `findAspects()`, add `durationDays` to each pushed aspect:
```ts
aspects.push({
  // ... existing fields ...
  durationDays: computePersonalTransitDuration(transitPos.name, aspectType as TransitAspectType),
});
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run src/test/transits.test.ts
```
Expected: All 4 tests PASS

**Step 5: Run full test suite to confirm no regressions**

```bash
npx vitest run
```
Expected: All tests PASS (the existing `santa-monica-chart.test.ts` etc. still pass)

**Step 6: Commit**

```bash
git add src/lib/astrocartography/transits.ts src/test/transits.test.ts
git commit -m "feat: add durationDays to personal TransitAspect"
```

---

### Task 4: Show transit list with durations in `DailyHookCard`

**Files:**
- Modify: `src/components/feed/DailyHookCard.tsx`

**Background:**
`data.transits` is a `CollectiveTransit[]`. It now has `duration_days`. We want to render a compact table beneath the existing content (but before the progress bar).

Cached Supabase rows won't have `duration_days` on `CollectiveTransit` objects. Guard with `transit.duration_days ?? null`.

**Step 1: Import `formatTransitDuration`**

Add to the imports at the top of `DailyHookCard.tsx`:
```ts
import { formatTransitDuration } from "@/lib/formatTransitDuration";
```

**Step 2: Add `TransitList` section inside the card's `<div className="p-5 sm:p-6">`**

After the `{forecast?.details?.length ? (...) : null}` block and before the `{data.aspect_precision && (...)}` progress bar block, add:

```tsx
{data.transits?.length > 0 && (
  <div className="mt-4 space-y-1.5">
    <p className="text-xs uppercase tracking-widest text-purple-300/60 mb-2">Active Transits</p>
    {data.transits.map((t) => {
      const dur = formatTransitDuration(t.duration_days ?? null);
      return (
        <div
          key={t.transit_key}
          className="flex items-center justify-between text-xs text-purple-100/80"
        >
          <span className="truncate pr-2">{t.display_name}</span>
          <span className="shrink-0 text-purple-300/60 font-mono">
            {dur ?? "—"}
          </span>
        </div>
      );
    })}
  </div>
)}
```

**Step 3: Verify visually in the browser**

Run `npm run dev`, navigate to Feed. The `DailyHookCard` should now show an "Active Transits" section listing each transit with its duration. If `data.transits` is empty, the section is hidden.

**Step 4: Commit**

```bash
git add src/components/feed/DailyHookCard.tsx
git commit -m "feat: show active transits with duration in DailyHookCard"
```

---

### Task 5: Show duration in `TransitDetail` `AspectCard`

**Files:**
- Modify: `src/pages/TransitDetail.tsx`

**Background:**
`AspectCard` receives a `TransitAspect` which now has `durationDays`. Show it next to the existing orb display as a badge.

**Step 1: Import `formatTransitDuration`**

Add to imports at the top of `TransitDetail.tsx`:
```ts
import { formatTransitDuration } from "@/lib/formatTransitDuration";
```

**Step 2: Update the orb line inside `AspectCard`**

Find this line (around line 73):
```tsx
{aspect.transitPlanet} in {aspect.transitSign} {aspect.aspectType} your natal {aspect.natalPlanet} • {aspect.orb.toFixed(1)}° orb
```

Replace with:
```tsx
{aspect.transitPlanet} in {aspect.transitSign} {aspect.aspectType} your natal {aspect.natalPlanet} • {aspect.orb.toFixed(1)}° orb
{aspect.durationDays != null && (
  <> • <span className="text-muted-foreground/60">{formatTransitDuration(aspect.durationDays)} window</span></>
)}
```

**Step 3: Verify visually in the browser**

Navigate to Feed → tap any planet chip → `TransitDetail`. Each `AspectCard` should now show e.g. `"Sun in Pisces trine your natal Venus • 2.3° orb • ~16 days window"`.

**Step 4: Commit**

```bash
git add src/pages/TransitDetail.tsx
git commit -m "feat: show transit window duration in TransitDetail AspectCard"
```

---

### Task 6: Lint and type-check

**Step 1: Run lint**

```bash
npm run lint
```
Fix any errors before proceeding.

**Step 2: Run full test suite one final time**

```bash
npx vitest run
```
Expected: All tests PASS

**Step 3: Build check**

```bash
npm run build
```
Expected: No TypeScript errors, build succeeds.

**Step 4: Commit if any lint fixes were needed**

```bash
git add -A
git commit -m "fix: lint cleanup for transit duration feature"
```

---

## Success Criteria

- [ ] `formatTransitDuration` formats days into human-readable strings (< 1 day → years)
- [ ] `CollectiveTransit.duration_days` is populated for all active collective transits
- [ ] `TransitAspect.durationDays` is populated for all personal transit aspects
- [ ] `DailyHookCard` shows "Active Transits" section with name + duration per transit
- [ ] `TransitDetail` `AspectCard` shows "~X days window" next to the orb
- [ ] All existing tests pass, no new regressions
- [ ] TypeScript build passes with no errors
