import { describe, expect, it } from "vitest";
import { calculateBreakEven, projectDemand2045 } from "@/domain/dss";
import { dssDefaults } from "@/config/dss-defaults";

describe("calculateBreakEven", () => {
  it("computes LF_eq = cost / (revenuePerPax × seats)", () => {
    const result = calculateBreakEven({
      aircraftId: "E145",
      revenuePerPax: 50_000,
      costPerFlight: 1_000_000,
      weeklyFrequencies: 3,
      currentLoadFactor: 0.5,
    });
    // 1_000_000 / (50_000 × 50) = 0.4
    expect(result.lfEquilibrium).toBe(0.4);
    expect(result.minPassengers).toBe(20);
    expect(result.status).toBe("feasible");
    expect(result.comparison).toBe("above_break_even");
    expect(result.thresholdPax).toEqual({
      alert65: 33,
      target70: 35,
      target80: 40,
    });
  });

  it("uses ceil for minimum passengers", () => {
    const result = calculateBreakEven({
      aircraftId: "E145",
      revenuePerPax: 40_000,
      costPerFlight: 1_000_000,
      weeklyFrequencies: 1,
    });
    // 1e6 / (40e3 × 50) = 0.5 → 25 pax exact
    expect(result.minPassengers).toBe(25);

    const uneven = calculateBreakEven({
      aircraftId: "E145",
      revenuePerPax: 45_000,
      costPerFlight: 1_000_000,
      weeklyFrequencies: 1,
    });
    // 1e6 / (45e3 × 50) ≈ 0.444… → ceil(22.222) = 23
    expect(uneven.lfEquilibrium!).toBeCloseTo(1_000_000 / (45_000 * 50), 10);
    expect(uneven.minPassengers).toBe(23);
  });

  it("marks LF_eq > 1 as infeasible without capping", () => {
    const result = calculateBreakEven({
      aircraftId: "E145",
      revenuePerPax: 10_000,
      costPerFlight: 1_000_000,
      weeklyFrequencies: 3,
    });
    // 1e6 / (10e3 × 50) = 2.0
    expect(result.lfEquilibrium).toBe(2);
    expect(result.status).toBe("infeasible");
  });

  it("returns no_data when revenuePerPax is zero", () => {
    const result = calculateBreakEven({
      aircraftId: "B738",
      revenuePerPax: 0,
      costPerFlight: 1_000_000,
      weeklyFrequencies: 2,
    });
    expect(result.status).toBe("no_data");
    expect(result.lfEquilibrium).toBeNull();
  });

  it("does not invent passenger LF for A350F cargo", () => {
    const result = calculateBreakEven({
      aircraftId: "A350F",
      revenuePerPax: 85_000,
      costPerFlight: 5_000_000,
      weeklyFrequencies: 2,
      currentLoadFactor: 0.7,
    });
    expect(result.status).toBe("cargo_n_a");
    expect(result.lfEquilibrium).toBeNull();
    expect(result.minPassengers).toBeNull();
  });

  it("exposes A350K-ULR in the passenger catalog path", () => {
    const result = calculateBreakEven({
      aircraftId: "A350K-ULR",
      revenuePerPax: 100_000,
      costPerFlight: 8_000_000,
      weeklyFrequencies: 1,
    });
    expect(result.seats).toBe(350);
    expect(result.status).toBe("feasible");
    expect(result.lfEquilibrium).toBeCloseTo(8_000_000 / (100_000 * 350), 10);
  });
});

describe("projectDemand2045", () => {
  it("projects with low/base/high rates and reports baseline trigger already met", () => {
    const result = projectDemand2045();
    expect(result.scenarios).toHaveLength(3);
    expect(result.scenarios.map((s) => s.rate)).toEqual([0.025, 0.039, 0.055]);

    const baselineUtil =
      dssDefaults.projection.baselinePassengers /
      dssDefaults.projection.declaredAnnualCapacity;
    expect(result.baselineUtilization).toBeCloseTo(baselineUtil, 10);
    expect(result.baselineUtilization).toBeGreaterThanOrEqual(0.8);

    for (const scenario of result.scenarios) {
      const plan = scenario.triggers.find((t) => t.level === 0.8)!;
      const exec = scenario.triggers.find((t) => t.level === 0.9)!;
      expect(plan.alreadyMet).toBe(true);
      expect(plan.year).toBeNull();
      // ~87% baseline — 90% not yet met at base
      expect(exec.alreadyMet).toBe(false);
      expect(exec.year).toBeTypeOf("number");
    }
  });

  it("computes P(t) = P(base) × (1+r)^(t-baseYear)", () => {
    const result = projectDemand2045({
      baseYear: 2024,
      horizonYear: 2026,
      baselinePassengers: 1_000_000,
      declaredAnnualCapacity: 2_000_000,
      rates: { low: 0.025, base: 0.039, high: 0.055 },
    });
    const base = result.scenarios.find((s) => s.id === "base")!;
    const y2026 = base.series.find((p) => p.year === 2026)!;
    expect(y2026.passengers).toBeCloseTo(1_000_000 * 1.039 ** 2, 6);
    expect(y2026.utilization).toBeCloseTo(y2026.passengers / 2_000_000, 10);
  });

  it("finds first year crossing 80% when baseline is below", () => {
    const result = projectDemand2045({
      baseYear: 2024,
      horizonYear: 2045,
      baselinePassengers: 1_000_000,
      declaredAnnualCapacity: 1_700_000,
      rates: { low: 0.025, base: 0.039, high: 0.055 },
    });
    expect(result.baselineUtilization).toBeLessThan(0.8);
    const base = result.scenarios.find((s) => s.id === "base")!;
    const plan = base.triggers.find((t) => t.level === 0.8)!;
    expect(plan.alreadyMet).toBe(false);
    expect(plan.year).toBeGreaterThan(2024);
    const point = base.series.find((p) => p.year === plan.year)!;
    expect(point.utilization).toBeGreaterThanOrEqual(0.8);
  });
});
