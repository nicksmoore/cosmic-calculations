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
