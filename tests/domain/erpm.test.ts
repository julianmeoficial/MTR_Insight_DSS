import { describe, expect, it } from "vitest";
import {
  evaluateRoute,
  greatCircleKm,
  requiredRunwayM,
  resolveScenario,
  routeSensitivity,
  scenarioDeltas,
} from "@/domain/erpm";
import type {
  AirportConstraints,
  EvaluateRouteInput,
  RouteOpportunity,
} from "@/domain/erpm";
import { loadSituation } from "@/data/fixtures/load-dashboard";

const MTR = { lat: 8.8237, lon: -75.8258 };
const PTY = { lat: 9.0714, lon: -79.3835 };
const MAD = { lat: 40.4719, lon: -3.5626 };
const ICN = { lat: 37.4602, lon: 126.4407 };

const evidence = { source: "test", date: null, confidence: "low" as const };

const airport: AirportConstraints = {
  runways: [
    { id: "RWY1", designator: "14/32", status: "existing", lengthM: 2_297, widthM: 40, pcn: 50, approach: "CAT_I", evidence },
    { id: "RWY2", designator: "14L/32R", status: "projected", lengthM: 4_100, widthM: 60, pcn: 90, approach: "CAT_II", evidence },
  ],
  terminals: [
    { id: "T1", name: "T1", status: "existing", annualCapacity: 1_700_000, international: true, maxCodeLetter: "C", widebodyStands: 0, evidence },
    { id: "T2", name: "T2", status: "projected", annualCapacity: 2_500_000, international: true, maxCodeLetter: "E", widebodyStands: 4, evidence },
  ],
  arffCategory: { current: 7, expansion: 9 },
  elevationM: null,
  rolling12MonthPassengers: 1_452_689,
};

function route(partial: Partial<RouteOpportunity> = {}): RouteOpportunity {
  return {
    id: "RT-TEST",
    destination: "PTY",
    international: true,
    segment: "regional",
    stage: "proposed",
    airline: null,
    aircraftId: "E145",
    weeklyFrequencies: 3,
    start: null,
    weeklyDemandPax: 120,
    demandIsAssumption: true,
    evidence,
    note: "",
    ...partial,
  };
}

function input(partial: Partial<EvaluateRouteInput> = {}): EvaluateRouteInput {
  return {
    route: route(),
    aircraftId: "E145",
    origin: MTR,
    destination: PTY,
    airport,
    scenarioId: "base",
    ...partial,
  };
}

const check = (r: ReturnType<typeof evaluateRoute>, id: string) =>
  r.checks.find((c) => c.id === id)?.outcome;

describe("greatCircleKm", () => {
  it("measures MTR–PTY close to 390 km", () => {
    const d = greatCircleKm(MTR, PTY);
    expect(d).toBeGreaterThan(380);
    expect(d).toBeLessThan(400);
  });

  it("is symmetric and zero on the same point", () => {
    expect(greatCircleKm(MTR, PTY)).toBe(greatCircleKm(PTY, MTR));
    expect(greatCircleKm(MTR, MTR)).toBe(0);
  });
});

describe("evaluateRoute · current infrastructure", () => {
  it("uses carried pax over seats, capped by seats offered", () => {
    const r = evaluateRoute(input({ route: route({ weeklyDemandPax: 500 }) }));
    expect(r.weeklySeats).toBe(150);
    expect(r.projectedLoadFactor).toBe(1);
  });

  it("computes ceil passengers for the 70 % target", () => {
    expect(evaluateRoute(input({ aircraftId: "B738" })).paxPerFlightTarget70).toBe(112);
  });

  it("assigns the existing runway and Terminal 1 by default", () => {
    const r = evaluateRoute(input());
    expect(r.runwayId).toBe("RWY1");
    expect(r.terminalId).toBe("T1");
    expect(r.infraConfig).toBe("current");
  });

  it("an A350 fails length, width, pavement, ARFF and terminal today", () => {
    const r = evaluateRoute(
      input({
        route: route({ destination: "MAD", segment: "intercontinental", weeklyDemandPax: 300 }),
        aircraftId: "A359",
        destination: MAD,
      }),
    );
    for (const id of ["runway", "runway_width", "pavement", "approach", "arff", "terminal_fit"]) {
      expect(check(r, id)).toBe("fail");
    }
    expect(r.verdict).toBe("not_viable");
  });

  it("restrictive scenario can turn a runway pass into a fail", () => {
    expect(check(evaluateRoute(input({ aircraftId: "B738" })), "runway")).toBe("pass");
    expect(
      check(evaluateRoute(input({ aircraftId: "B738", scenarioId: "restrictive" })), "runway"),
    ).toBe("fail");
  });

  it("returns no-data when demand is unknown, never a false green", () => {
    const r = evaluateRoute(input({ route: route({ weeklyDemandPax: null }) }));
    expect(r.projectedLoadFactor).toBeNull();
    expect(r.verdict).toBe("no_data");
    expect(r.gaps).toContain("demand");
  });

  it("reports a missing PCN as a gap, not a pass", () => {
    const noPcn: AirportConstraints = {
      ...airport,
      runways: airport.runways.map((rw) => ({ ...rw, pcn: null })),
    };
    expect(evaluateRoute(input({ airport: noPcn })).gaps).toContain("pavement");
  });

  it("does not add an operating route's passengers twice to T1", () => {
    const r = evaluateRoute(input({ route: route({ stage: "operating" }) }));
    expect(r.utilizationAfter).toBeCloseTo(1_452_689 / 1_700_000, 10);
  });

  it("rejects freighters", () => {
    expect(() => evaluateRoute(input({ aircraftId: "A350F" }))).toThrow();
  });
});

describe("evaluateRoute · expansion (RWY 2 + T2)", () => {
  const mad = input({
    route: route({ destination: "MAD", segment: "intercontinental", weeklyDemandPax: 300, weeklyFrequencies: 2 }),
    aircraftId: "A359",
    destination: MAD,
    infraConfig: "expansion",
  });

  it("routes an A350 to the long runway and Terminal 2", () => {
    const r = evaluateRoute(mad);
    expect(r.runwayId).toBe("RWY2");
    expect(r.terminalId).toBe("T2");
    for (const id of ["runway", "runway_width", "pavement", "approach", "arff", "terminal_fit", "range"]) {
      expect(check(r, id)).toBe("pass");
    }
  });

  it("keeps regional jets on the shorter runway and T1", () => {
    const r = evaluateRoute(input({ infraConfig: "expansion" }));
    expect(r.runwayId).toBe("RWY1");
    expect(r.terminalId).toBe("T1");
  });

  it("a forced terminal that cannot take the aircraft fails terminal fit", () => {
    const r = evaluateRoute({ ...mad, terminal: "T1" });
    expect(r.terminalId).toBe("T1");
    expect(check(r, "terminal_fit")).toBe("fail");
    expect(r.verdict).toBe("not_viable");
  });

  it("Terminal 2 starts empty, so its utilization is only the new route", () => {
    const r = evaluateRoute(mad);
    expect(r.utilizationAfter).toBeCloseTo((300 * 2 * 52) / 2_500_000, 10);
  });

  it("Incheon is out of A350-900 range with reserve, within A350-1000", () => {
    const icn = {
      ...mad,
      route: route({ destination: "ICN", segment: "intercontinental", weeklyDemandPax: 180 }),
      destination: ICN,
    };
    expect(check(evaluateRoute({ ...icn, aircraftId: "A359" }), "range")).toBe("fail");
    expect(check(evaluateRoute({ ...icn, aircraftId: "A35K" }), "range")).toBe("pass");
    // Restrictive reserve (15 %) pushes it past the A350-1000 as well.
    expect(
      check(evaluateRoute({ ...icn, aircraftId: "A35K", scenarioId: "restrictive" }), "range"),
    ).toBe("fail");
  });

  it("reports the runway that clears the tight margin", () => {
    const r = requiredRunwayM("B738", { takeoffFactor: 1 });
    expect(r?.minimum).toBe(2_100);
    expect(r?.comfortable).toBe(Math.ceil(2_100 / 0.95));
  });

  it("applies frequency overrides and ignores invalid numbers", () => {
    const r = evaluateRoute(input({ overrides: { weeklyFrequencies: 5, demandFactor: Number.NaN } }));
    expect(r.weeklySeats).toBe(250);
    expect(resolveScenario("base", { demandFactor: -1 }).demandFactor).toBe(1);
  });
});

describe("routeSensitivity", () => {
  it("returns bars sorted by impact around the baseline margin", () => {
    const s = routeSensitivity(input({ route: route({ weeklyDemandPax: 100 }) }));
    expect(s.baseline).not.toBeNull();
    expect(s.bars).toHaveLength(4);
    for (let i = 1; i < s.bars.length; i++) {
      expect(s.bars[i - 1]!.impact).toBeGreaterThanOrEqual(s.bars[i]!.impact);
    }
    const demand = s.bars.find((b) => b.key === "demandFactor")!;
    expect(demand.high).toBeGreaterThan(demand.low);
  });

  it("is empty when demand is unknown", () => {
    const s = routeSensitivity(input({ route: route({ weeklyDemandPax: null }) }));
    expect(s.baseline).toBeNull();
    expect(s.bars).toEqual([]);
  });
});

describe("scenarioDeltas", () => {
  it("is empty for base and lists changed inputs otherwise", () => {
    expect(scenarioDeltas("base")).toEqual([]);
    const keys = scenarioDeltas("restrictive").map((d) => d.key);
    expect(keys).toContain("demandFactor");
    expect(keys).toContain("takeoffFactor");
  });
});

describe("situation fixture", () => {
  it("loads both runways and terminals with the verified RWY1 length", () => {
    const s = loadSituation();
    expect(s.constraints.runways.map((r) => r.id)).toEqual(["RWY1", "RWY2"]);
    expect(s.constraints.terminals.map((t) => t.id)).toEqual(["T1", "T2"]);
    expect(s.constraints.runways[0]!.lengthM).toBe(2_297);
  });
});
