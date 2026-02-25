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
    vi.spyOn(document, "createElement").mockReturnValue(mockEl as unknown as HTMLElement);
    expect(detectPerformanceTierSync()).toBe(3);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
});
