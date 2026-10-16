import { describe, expect, it } from "vitest";
import {
  calculateK1,
  calculateK2,
  calculateK3,
  calculateK4,
  calculateK5,
  evaluateTrafficLight,
} from "@/domain";
import type {
  CapacitySnapshot,
  DemandSnapshot,
  FlightRecord,
  QualityRecord,
  RequirementRecord,
} from "@/domain";

describe("evaluateTrafficLight", () => {
  it("maps K1 boundaries with raw values", () => {
    expect(evaluateTrafficLight("K1", 0.7)).toBe("green");
    expect(evaluateTrafficLight("K1", 0.65)).toBe("yellow");
    expect(evaluateTrafficLight("K1", 0.649999)).toBe("red");
  });

  it("maps K3 inverted thresholds", () => {
    expect(evaluateTrafficLight("K3", 0.799)).toBe("green");
    expect(evaluateTrafficLight("K3", 0.8)).toBe("yellow");
    expect(evaluateTrafficLight("K3", 0.9)).toBe("red");
  });
});

describe("calculateK1", () => {
  it("uses sum of passengers / sum of seats, not mean of flight percentages", () => {
    const flights: FlightRecord[] = [
      {
        route: "MTR-PTY",
        operator: "Satena",
        aircraftType: "E145",
        weekStart: "2026-10-26",
        weekEnd: "2026-11-01",
        passengersBoarded: 50,
        seatsOffered: 50,
      },
      {
        route: "MTR-PTY",
        operator: "Satena",
        aircraftType: "E145",
        weekStart: "2026-10-26",
        weekEnd: "2026-11-01",
        passengersBoarded: 10,
        seatsOffered: 50,
      },
    ];

    const [result] = calculateK1(flights);
    // sum = 60/100 = 0.6 (red). mean of 1.0 and 0.2 would be 0.6 coincidentally,
    // so use unbalanced flights: 49/50 and 0/50 → sum 49/100=0.49; mean ~0.49.
    // Better assertion: three flights where mean ≠ sum ratio.
    expect(result.value).toBe(0.6);
    expect(result.status).toBe("red");
    expect(result.meta).toEqual({ numerator: 60, denominator: 100 });
  });

  it("does not average percentages when mean would differ from aggregate", () => {
    const flights: FlightRecord[] = [
      {
        route: "MTR-PTY",
        operator: "Satena",
        aircraftType: "E145",
        weekStart: "2026-10-26",
        weekEnd: "2026-11-01",
        passengersBoarded: 40,
        seatsOffered: 50,
      },
      {
        route: "MTR-PTY",
        operator: "Satena",
        aircraftType: "E145",
        weekStart: "2026-10-26",
        weekEnd: "2026-11-01",
        passengersBoarded: 40,
        seatsOffered: 50,
      },
      {
        route: "MTR-PTY",
        operator: "Satena",
        aircraftType: "E145",
        weekStart: "2026-10-26",
        weekEnd: "2026-11-01",
        passengersBoarded: 10,
        seatsOffered: 100,
      },
    ];
    // Aggregate: 90/200 = 0.45. Mean of (0.8, 0.8, 0.1) = 0.566…
    const [result] = calculateK1(flights);
    expect(result.value).toBe(0.45);
    expect(result.status).toBe("red");
  });

  it("returns no_data when seats are zero", () => {
    const [result] = calculateK1([
      {
        route: "MTR-PTY",
        operator: "Satena",
        aircraftType: "E145",
        weekStart: "2026-10-26",
        weekEnd: "2026-11-01",
        passengersBoarded: 0,
        seatsOffered: 0,
      },
    ]);
    expect(result.status).toBe("no_data");
    expect(result.value).toBeNull();
  });
});

describe("calculateK2", () => {
  const period = { start: "2026-10-01", end: "2026-12-31" };

  it("does not count completed without evidence and approval date", () => {
    const requirements: RequirementRecord[] = [
      {
        requirementId: "REQ-1",
        authority: "Aerocivil",
        critical: true,
        applicable: true,
        dueDate: "2026-12-01",
        completedFlag: true,
        evidenceId: null,
        approvalDate: null,
      },
      {
        requirementId: "REQ-2",
        authority: "DIAN",
        critical: true,
        applicable: true,
        dueDate: "2026-12-01",
        completedFlag: true,
        evidenceId: "EV-2",
        approvalDate: "2026-09-01",
      },
    ];

    const result = calculateK2(requirements, "2026-11-15", period);
    expect(result.meta?.numerator).toBe(1);
    expect(result.meta?.denominator).toBe(2);
    expect(result.value).toBe(0.5);
  });

  it("forces red when a critical requirement is overdue", () => {
    const requirements: RequirementRecord[] = [
      {
        requirementId: "REQ-CRIT",
        authority: "ICA",
        critical: true,
        applicable: true,
        dueDate: "2026-10-01",
        completedFlag: false,
        evidenceId: null,
        approvalDate: null,
      },
      {
        requirementId: "REQ-OK",
        authority: "DIAN",
        critical: true,
        applicable: true,
        dueDate: "2026-12-01",
        completedFlag: true,
        evidenceId: "EV-OK",
        approvalDate: "2026-09-01",
      },
    ];

    const result = calculateK2(requirements, "2026-11-15", period);
    expect(result.status).toBe("red");
    expect(result.meta?.overrideReason).toBe("critical_overdue");
  });

  it("returns no_data when no applicable requirements", () => {
    const result = calculateK2([], "2026-11-15", period);
    expect(result.status).toBe("no_data");
  });
});

describe("calculateK3", () => {
  it("returns yellow at 85.5% baseline", () => {
    const snapshot: CapacitySnapshot = {
      periodStart: "2025-01-01",
      periodEnd: "2025-12-31",
      rolling12MonthPassengers: 1_452_689,
      declaredAnnualCapacity: 1_700_000,
    };
    const result = calculateK3(snapshot);
    expect(result.value).toBeCloseTo(1_452_689 / 1_700_000, 10);
    expect(result.status).toBe("yellow");
  });

  it("returns no_data for zero capacity", () => {
    const result = calculateK3({
      periodStart: "2026-01-01",
      periodEnd: "2026-12-31",
      rolling12MonthPassengers: 100,
      declaredAnnualCapacity: 0,
    });
    expect(result.status).toBe("no_data");
  });
});

describe("calculateK4", () => {
  it("maps capture ratio to traffic light", () => {
    const snapshot: DemandSnapshot = {
      periodStart: "2026-10-01",
      periodEnd: "2026-12-31",
      directInternationalDeparturesFromMtr: 150,
      catchmentInternationalTravelers: 1000,
    };
    const result = calculateK4(snapshot);
    expect(result.value).toBe(0.15);
    expect(result.status).toBe("yellow");
  });

  it("returns no_data when catchment is zero", () => {
    const result = calculateK4({
      periodStart: "2026-10-01",
      periodEnd: "2026-12-31",
      directInternationalDeparturesFromMtr: 10,
      catchmentInternationalTravelers: 0,
    });
    expect(result.status).toBe("no_data");
  });
});

describe("calculateK5", () => {
  it("forces red on unresolved technical conflict even if ratio is green", () => {
    const records: QualityRecord[] = [
      {
        sourceId: "ARINC",
        sourceName: "ARINC AirDB",
        owner: "TI",
        expectedCriticalRecords: 100,
        loadedOnTimeAndValidated: 99,
        unresolvedTechnicalConflict: true,
        loaded: true,
        periodStart: "2026-11-01",
        periodEnd: "2026-11-01",
      },
    ];
    const result = calculateK5(records);
    expect(result.value).toBe(0.99);
    expect(result.status).toBe("red");
    expect(result.meta?.overrideReason).toBe("unresolved_technical_conflict");
  });

  it("returns green at or above 98%", () => {
    const result = calculateK5([
      {
        sourceId: "ARINC",
        sourceName: "ARINC AirDB",
        owner: "TI",
        expectedCriticalRecords: 100,
        loadedOnTimeAndValidated: 98,
        unresolvedTechnicalConflict: false,
        loaded: true,
        periodStart: "2026-11-01",
        periodEnd: "2026-11-01",
      },
    ]);
    expect(result.status).toBe("green");
  });
});
