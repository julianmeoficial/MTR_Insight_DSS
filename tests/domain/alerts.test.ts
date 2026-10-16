import { describe, expect, it } from "vitest";
import {
  calculateK1,
  evaluateAlerts,
  evaluateK1RedStreak,
  evaluateSourceNotLoaded,
} from "@/domain";
import type { FlightRecord, KpiResult, QualityRecord } from "@/domain";
import { alertPolicies } from "@/config/alert-policies";

function weeklyFlight(
  weekStart: string,
  weekEnd: string,
  passengers: number,
  seats = 50,
): FlightRecord {
  return {
    route: "MTR-PTY",
    operator: "Satena",
    aircraftType: "E145",
    weekStart,
    weekEnd,
    passengersBoarded: passengers,
    seatsOffered: seats,
  };
}

describe("evaluateK1RedStreak", () => {
  it("fires after configured consecutive red weeks (default 2)", () => {
    const results = calculateK1([
      weeklyFlight("2026-11-16", "2026-11-22", 30), // 0.6 red
      weeklyFlight("2026-11-23", "2026-11-29", 31), // 0.62 red
    ]);

    const alerts = evaluateK1RedStreak(results);
    expect(alertPolicies.k1RedStreak.redStreakWeeks).toBe(2);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].trigger).toBe("K1_RED_STREAK");
    expect(alerts[0].severity).toBe("red");
    expect(alerts[0].entity).toContain("Satena");
  });

  it("does not fire for a single red week", () => {
    const results = calculateK1([
      weeklyFlight("2026-11-16", "2026-11-22", 30),
      weeklyFlight("2026-11-23", "2026-11-29", 40), // 0.8 green — breaks streak
    ]);
    expect(evaluateK1RedStreak(results)).toHaveLength(0);
  });

  it("produces stable ids on reruns", () => {
    const results = calculateK1([
      weeklyFlight("2026-11-16", "2026-11-22", 30),
      weeklyFlight("2026-11-23", "2026-11-29", 31),
    ]);
    const first = evaluateK1RedStreak(results);
    const second = evaluateK1RedStreak(results);
    expect(first.map((a) => a.id)).toEqual(second.map((a) => a.id));
  });
});

describe("evaluateSourceNotLoaded", () => {
  it("emits SOURCE_NOT_LOADED for unloaded critical sources", () => {
    const records: QualityRecord[] = [
      {
        sourceId: "MANIFEST-SAT",
        sourceName: "Manifiestos Satena",
        owner: "TI",
        expectedCriticalRecords: 10,
        loadedOnTimeAndValidated: 0,
        unresolvedTechnicalConflict: false,
        loaded: false,
        periodStart: "2026-11-01",
        periodEnd: "2026-11-01",
      },
      {
        sourceId: "ARINC",
        sourceName: "ARINC AirDB",
        owner: "TI",
        expectedCriticalRecords: 10,
        loadedOnTimeAndValidated: 10,
        unresolvedTechnicalConflict: false,
        loaded: true,
        periodStart: "2026-11-01",
        periodEnd: "2026-11-01",
      },
    ];

    const alerts = evaluateSourceNotLoaded(records);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].trigger).toBe("SOURCE_NOT_LOADED");
    expect(alerts[0].kpiId).toBe("K5");
    expect(alerts[0].entity).toBe("MANIFEST-SAT");
  });
});

describe("evaluateAlerts", () => {
  it("combines both minimum rules", () => {
    const k1Results: KpiResult[] = calculateK1([
      weeklyFlight("2026-11-16", "2026-11-22", 30),
      weeklyFlight("2026-11-23", "2026-11-29", 31),
    ]);
    const qualityRecords: QualityRecord[] = [
      {
        sourceId: "ERP",
        sourceName: "ERP costos",
        owner: "TI",
        expectedCriticalRecords: 5,
        loadedOnTimeAndValidated: 0,
        unresolvedTechnicalConflict: false,
        loaded: false,
        periodStart: "2026-11-30",
        periodEnd: "2026-11-30",
      },
    ];

    const alerts = evaluateAlerts({ k1Results, qualityRecords });
    expect(alerts.map((a) => a.trigger).sort()).toEqual([
      "K1_RED_STREAK",
      "SOURCE_NOT_LOADED",
    ]);
  });
});
