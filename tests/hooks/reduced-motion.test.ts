import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

describe("reduced-motion support", () => {
  it("hook module exists and checks matchMedia prefers-reduced-motion", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/hooks/usePrefersReducedMotion.ts"),
      "utf8",
    );
    expect(src).toContain("prefers-reduced-motion");
    expect(src).toContain("matchMedia");
  });

  it("ApronCanvas respects reduced motion", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/components/ambiance/ApronCanvas.tsx"),
      "utf8",
    );
    expect(src).toContain("usePrefersReducedMotion");
    expect(src).toContain("if (!host || reduced) return");
  });
});
