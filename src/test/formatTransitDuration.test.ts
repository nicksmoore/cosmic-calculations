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
