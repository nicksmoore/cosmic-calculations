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
