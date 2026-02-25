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
