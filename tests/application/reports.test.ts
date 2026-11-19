import { describe, expect, it } from "vitest";
import {
  getCapacityReport,
  getCommercialReport,
  getComplianceReport,
} from "@/application/reports";
import { classifyRoute, classifyRequirement } from "@/domain/reports";

describe("R1 commercial ranking", () => {
  const r = getCommercialReport();

  it("ranks by load factor and keeps new routes out of the cut list", () => {
    for (let i = 1; i < r.rows.length; i += 1) {
      expect(r.rows[i - 1]!.loadFactor).toBeGreaterThanOrEqual(r.rows[i]!.loadFactor);
    }
    const pty = r.rows.filter((row) => row.route === "MTR-PTY");
    expect(pty.length).toBe(2);
    for (const row of pty) expect(row.routeClass).toBe("maduracion");
    expect(r.bottom.some((row) => row.route === "MTR-PTY")).toBe(false);
  });

  it("flags Copa figures as unverified while its manifests are missing", () => {
    const copa = r.rows.find((row) => row.operator === "Copa");
    expect(copa?.dataVerified).toBe(false);
  });

  it("classifies a mature route with low occupancy for an offer adjustment", () => {
    expect(classifyRoute({ loadFactor: 0.6, trendPp: 0, ageWeeks: null, maturationWeeks: 26 })).toBe("ajustar_oferta");
    expect(classifyRoute({ loadFactor: 0.6, trendPp: 0, ageWeeks: 5, maturationWeeks: 26 })).toBe("maduracion");
    expect(classifyRoute({ loadFactor: 0.85, trendPp: 0, ageWeeks: null, maturationWeeks: 26 })).toBe("ampliar");
    expect(classifyRoute({ loadFactor: 0.75, trendPp: -0.06, ageWeeks: null, maturationWeeks: 26 })).toBe("accion_comercial");
  });
});

describe("R2 capacity window", () => {
  const r = getCapacityReport();
  it("orders saturation years by growth rate and decides before saturation", () => {
    const [low, base, high] = r.scenarios;
    expect(high!.year100!).toBeLessThanOrEqual(base!.year100!);
    expect(base!.year100!).toBeLessThanOrEqual(low!.year100!);
    expect(base!.decideBy).toBe(base!.year100! - r.leadTimeYears);
  });
  it("shows a phased build leaves less idle capacity than a full one", () => {
    const full = r.options.find((o) => o.id === "completa")!;
    const phased = r.options.find((o) => o.id === "fases")!;
    expect(phased.utilizationAtOpen).toBeGreaterThan(full.utilizationAtOpen);
    expect(phased.idleAtOpen).toBeLessThan(full.idleAtOpen);
  });
});

describe("R3 compliance risk", () => {
  const r = getComplianceReport();
  it("puts the unloaded feed and the overdue milestone at the top", () => {
    expect(r.items[0]!.state).toBe("no_cargada");
    expect(r.items.some((i) => i.id === "REQ-BODY-SCAN" && i.state === "vencido")).toBe(true);
    expect(r.blockedOperators).toEqual(["Copa"]);
  });
  it("does not count a completed flag without evidence", () => {
    const item = classifyRequirement(
      {
        requirementId: "X",
        authority: "DIAN",
        critical: true,
        applicable: true,
        dueDate: "2026-12-31",
        completedFlag: true,
        evidenceId: null,
        approvalDate: null,
      },
      "2026-11-30",
    );
    expect(item.state).toBe("sin_evidencia");
  });
});
