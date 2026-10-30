import { describe, expect, it } from "vitest";
import { calculateK1, evaluateTrafficLight } from "@/domain";
import {
  flightsForScope,
  parseOpsScope,
  routeIdsForScope,
} from "@/domain/ops-scope";
import type { FlightRecord } from "@/domain/types";
import { loadDashboardBundle } from "@/data/fixtures/load-dashboard";
import {
  resolveOperatorFilter,
  visibleOperators,
} from "@/domain/access";

const ROUTES = [
  { id: "MTR-BOG", international: false, operators: ["Avianca"], stage: "operating" },
  { id: "MTR-MDE", international: false, operators: ["LATAM"], stage: "operating" },
  { id: "MTR-EOH", international: false, operators: ["Clic"], stage: "operating" },
  { id: "MTR-BAQ", international: false, operators: ["Satena"], stage: "operating" },
  { id: "MTR-PTY", international: true, operators: ["Satena", "Copa"], stage: "operating" },
] as const;

function flight(
  route: string,
  operator: string,
  pax: number,
  seats: number,
): FlightRecord {
  return {
    route,
    operator,
    aircraftType: "A320",
    weekStart: "2026-11-23",
    weekEnd: "2026-11-29",
    passengersBoarded: pax,
    seatsOffered: seats,
  };
}

describe("ops scope", () => {
  it("defaults to nacional and only accepts internacional as alt", () => {
    expect(parseOpsScope(undefined)).toBe("nacional");
    expect(parseOpsScope(null)).toBe("nacional");
    expect(parseOpsScope("nacional")).toBe("nacional");
    expect(parseOpsScope("internacional")).toBe("internacional");
    expect(parseOpsScope("other")).toBe("nacional");
  });

  it("does not mix PTY into nacional or domestic into internacional", () => {
    const rows = [
      flight("MTR-BOG", "Avianca", 100, 180),
      flight("MTR-PTY", "Satena", 40, 50),
    ];
    const national = flightsForScope(rows, ROUTES, "nacional");
    const intl = flightsForScope(rows, ROUTES, "internacional");
    expect(national.every((f) => f.route !== "MTR-PTY")).toBe(true);
    expect(intl.every((f) => f.route === "MTR-PTY")).toBe(true);
    expect(routeIdsForScope(ROUTES, "nacional")).toEqual([
      "MTR-BOG",
      "MTR-MDE",
      "MTR-EOH",
      "MTR-BAQ",
    ]);
    expect(routeIdsForScope(ROUTES, "internacional")).toEqual(["MTR-PTY"]);
  });

  it("computes national K1 as sum/sum and returns no_data on zero seats", () => {
    const rows = [
      flight("MTR-BOG", "Avianca", 150, 180),
      flight("MTR-MDE", "LATAM", 140, 180),
    ];
    const scoped = flightsForScope(rows, ROUTES, "nacional");
    const pax = scoped.reduce((a, f) => a + f.passengersBoarded, 0);
    const seats = scoped.reduce((a, f) => a + f.seatsOffered, 0);
    const value = pax / seats;
    expect(value).toBeCloseTo(290 / 360, 6);
    expect(evaluateTrafficLight("K1", value)).toBe("green");

    const empty = calculateK1([
      flight("MTR-BOG", "Avianca", 0, 0),
    ]);
    expect(empty[0]?.status).toBe("no_data");
  });

  it("keeps H1 snapshot out of K3 capacity math", () => {
    const bundle = loadDashboardBundle();
    expect(bundle.semesterH1.passengers).toBe(801_353);
    expect(bundle.semesterH1.operations).toBe(10_502);
    // K3 inputs stay on rolling capacity fixture, not H1 × 2.
    expect(bundle.capacity.rolling12MonthPassengers).not.toBe(
      bundle.semesterH1.passengers * 2,
    );
  });

  it("isolates airline roles when the national catalog is wider", () => {
    expect(visibleOperators("satena", "nacional")).toEqual(["Satena"]);
    expect(visibleOperators("copa", "nacional")).toEqual(["Copa"]);
    expect(visibleOperators("comercial", "nacional")).toContain("Avianca");
    expect(visibleOperators("comercial", "nacional")).toContain("JetSMART");
    expect(visibleOperators("comercial", "internacional")).toEqual([
      "Todos",
      "Satena",
      "Copa",
    ]);
    expect(resolveOperatorFilter("satena", "Avianca", "nacional")).toBe(
      "Satena",
    );
    expect(resolveOperatorFilter("comercial", "LATAM", "nacional")).toBe(
      "LATAM",
    );
  });
});
