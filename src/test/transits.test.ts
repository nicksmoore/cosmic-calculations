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
