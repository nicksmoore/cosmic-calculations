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
    // orb=0.001, orbChange=0.002/day → would be ~500 days; capped at 365
    expect(computeCollectiveDuration(0.001, 0.002)).toBe(365);
  });
});
