import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadActiveDemoAlerts } from "@/data/fixtures/load-demo-alerts";
import { SCREENS } from "@/lib/screens";

describe("prototype smoke", () => {
  it("exposes navigation for P1–P7 and alert center", () => {
    const codes = SCREENS.map((s) => s.code);
    expect(codes).toEqual(
      expect.arrayContaining(["P1", "P2", "P3", "P4", "P5", "P6", "P7", "Alertas"]),
    );
    for (const screen of SCREENS) {
      expect(screen.title.length).toBeGreaterThan(0);
      expect(screen.purpose.length).toBeGreaterThan(0);
    }
  });

  it("has local demo fixture files (no PostgreSQL)", () => {
    const dir = path.join(process.cwd(), "data", "fixtures", "demo");
    expect(existsSync(path.join(dir, "flights.json"))).toBe(true);
    expect(existsSync(path.join(dir, "quality.json"))).toBe(true);
    const flights = JSON.parse(
      readFileSync(path.join(dir, "flights.json"), "utf8"),
    ) as { vuelos: unknown[] };
    expect(flights.vuelos.length).toBeGreaterThanOrEqual(2);
  });

  it("alert center domain path yields at least 2 active alerts", () => {
    const alerts = loadActiveDemoAlerts();
    expect(alerts.length).toBeGreaterThanOrEqual(2);
    const triggers = new Set(alerts.map((a) => a.trigger));
    expect(triggers.has("K1_RED_STREAK")).toBe(true);
    expect(triggers.has("SOURCE_NOT_LOADED")).toBe(true);
  });

  it("app routes for screens exist as page modules", () => {
    const sigDir = path.join(process.cwd(), "src", "app", "(sig)");
    for (const segment of [
      "p1",
      "p2",
      "p3",
      "p4",
      "p5",
      "p6",
      "p7",
      "alertas",
      "escenarios",
      "decisiones",
    ]) {
      expect(existsSync(path.join(sigDir, segment, "page.tsx"))).toBe(true);
    }
    expect(existsSync(path.join(process.cwd(), "src", "app", "page.tsx"))).toBe(
      true,
    );
  });
});
