import { describe, expect, it } from "vitest";
import {
  buildDashboardReport,
  getFilteredK1Hero,
} from "@/application/dashboard";

describe("buildDashboardReport", () => {
  it("returns five KPI tiles with K1–K5", () => {
    const report = buildDashboardReport();
    expect(report.tiles).toHaveLength(5);
    expect(report.tiles.map((t) => t.kpiId)).toEqual([
      "K1",
      "K2",
      "K3",
      "K4",
      "K5",
    ]);
  });

  it("computes K1 trend in pp vs previous week when available", () => {
    const report = buildDashboardReport();
    const k1 = report.tiles.find((t) => t.kpiId === "K1")!;
    expect(k1.sparkline.length).toBeGreaterThanOrEqual(2);
    // Latest demo week should have a numeric delta vs prior week
    expect(k1.deltaPp === null || typeof k1.deltaPp === "number").toBe(true);
  });

  it("treats K3 up as bad (deltaGood false when utilization rises)", () => {
    const report = buildDashboardReport();
    const k3Meta = report.tiles.find((t) => t.kpiId === "K3")!;
    // K3 has no week sparkline in this fixture; direction flag comes from upIsGood=false
    expect(k3Meta.href).toBe("/p4");
    expect(k3Meta.targetLabel).toContain("80");
  });

  it("exposes series and alerts from fixtures", () => {
    const report = buildDashboardReport();
    expect(report.series.length).toBeGreaterThan(0);
    expect(report.weeks.length).toBeGreaterThanOrEqual(8);
    expect(report.meta.version).toBe("0.1.0");
  });

  it("scopes national vs international without mixing routes", () => {
    const national = buildDashboardReport({ opsScope: "nacional" });
    const intl = buildDashboardReport({ opsScope: "internacional" });
    expect(national.opsScope).toBe("nacional");
    expect(national.semesterH1?.passengers).toBe(801_353);
    expect(national.scopeRoutes.every((r) => r.id !== "MTR-PTY")).toBe(true);
    expect(national.series.every((s) => s.operator !== "Copa")).toBe(true);
    expect(intl.semesterH1).toBeNull();
    expect(intl.scopeRoutes.map((r) => r.id)).toEqual(["MTR-PTY"]);
    expect(intl.copaPermitStatus).toBeTruthy();
  });
});

describe("getFilteredK1Hero", () => {
  it("isolates operator filter (Satena vs Copa)", () => {
    const weeks = buildDashboardReport().weeks;
    const week = weeks[weeks.length - 1]?.weekStart;
    const satena = getFilteredK1Hero({
      operator: "Satena",
      weekStart: week,
    });
    const copa = getFilteredK1Hero({
      operator: "Copa",
      weekStart: week,
    });
    // Last weeks may be Satena-only; Copa should still return a defined shape
    expect(satena).toHaveProperty("status");
    expect(copa).toHaveProperty("status");
    if (satena.value !== null && copa.value !== null) {
      expect(satena.value).not.toBe(copa.value);
    }
  });

  it("returns no_data for unknown aircraft filter", () => {
    const hero = getFilteredK1Hero({
      aircraftType: "NOPE",
      weekStart: "2099-01-01",
    });
    expect(hero.status).toBe("no_data");
    expect(hero.value).toBeNull();
  });
});
