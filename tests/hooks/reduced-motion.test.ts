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

  it("AerodromeCanvas respects reduced motion", () => {
    const src = readFileSync(
      path.join(process.cwd(), "src/components/aero/AerodromeCanvas.tsx"),
      "utf8",
    );
    expect(src).toContain("prefers-reduced-motion");
    expect(src).toContain('if (!animate || reduced)');
  });
});
