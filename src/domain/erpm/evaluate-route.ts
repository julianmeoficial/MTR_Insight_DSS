/**
 * Preliminary route × aircraft validator (Paso 14, DSS + ERPM).
 * Management-level comparison only: it never certifies performance,
 * dispatch, pavement strength or an authority decision.
 */

import {
  CODE_LETTER_ORDER,
  getAircraft,
  type AircraftDefinition,
  type AircraftId,
} from "@/config/aircraft";
import {
  APPROACH_ORDER,
  ERPM_SCENARIOS,
  REQUIRED_APPROACH,
  RUNWAY_TIGHT_MARGIN,
  type ErpmScenario,
  type ErpmScenarioId,
} from "@/config/erpm-scenarios";
import { kpiThresholds } from "@/config/thresholds";
import { calculateBreakEven } from "@/domain/dss/break-even";
import { evaluateTrafficLight } from "@/domain/kpis/traffic-light";
import type {
  AirportConstraints,
  CheckOutcome,
  FeasibilityCheck,
  GeoPoint,
  InfraConfig,
  RouteEvaluation,
  RouteOpportunity,
  RunwayRef,
  ScenarioDelta,
  TerminalChoice,
  TerminalRef,
  Verdict,
} from "@/domain/erpm/types";

const EARTH_RADIUS_KM = 6_371;
const WEEKS_PER_YEAR = 52;
const DIRECTIONS = 2;
const DEFAULT_FREQUENCIES = 3;

/** Great-circle distance (haversine), rounded to whole km. */
export function greatCircleKm(a: GeoPoint, b: GeoPoint): number {
  const rad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)));
}

function runwayLengthCheck(
  takeoffM: number | null,
  scenario: ErpmScenario,
  runway: RunwayRef,
): FeasibilityCheck {
  if (takeoffM === null) {
    return { id: "runway", outcome: "no_data", required: null, available: runway.lengthM };
  }
  const required = Math.round(takeoffM * scenario.takeoffFactor);
  const margin = (runway.lengthM - required) / runway.lengthM;
  const outcome: CheckOutcome =
    margin < 0 ? "fail" : margin < RUNWAY_TIGHT_MARGIN ? "tight" : "pass";
  return { id: "runway", outcome, required, available: runway.lengthM };
}

/** Length, width, pavement and approach checks for one runway. */
function runwayChecks(
  aircraft: AircraftDefinition,
  scenario: ErpmScenario,
  runway: RunwayRef,
  requiredApproach: (typeof APPROACH_ORDER)[number],
): FeasibilityCheck[] {
  const approachOk =
    APPROACH_ORDER.indexOf(runway.approach) >= APPROACH_ORDER.indexOf(requiredApproach);
  return [
    runwayLengthCheck(aircraft.approxTakeoffDistanceM, scenario, runway),
    {
      id: "runway_width",
      outcome: runway.widthM >= aircraft.minRunwayWidthM ? "pass" : "fail",
      required: aircraft.minRunwayWidthM,
      available: runway.widthM,
    },
    {
      id: "pavement",
      outcome:
        runway.pcn === null
          ? "no_data"
          : aircraft.acn > runway.pcn
            ? "fail"
            : aircraft.acn > runway.pcn * 0.9
              ? "tight"
              : "pass",
      required: aircraft.acn,
      available: runway.pcn,
    },
    {
      id: "approach",
      outcome: approachOk ? "pass" : "fail",
      required: APPROACH_ORDER.indexOf(requiredApproach),
      available: APPROACH_ORDER.indexOf(runway.approach),
    },
  ];
}

const OUTCOME_RANK: Record<CheckOutcome, number> = { pass: 0, tight: 1, no_data: 2, fail: 3 };

function worstOutcome(checks: FeasibilityCheck[]): number {
  return Math.max(...checks.map((c) => OUTCOME_RANK[c.outcome]));
}

/** Assets usable under a configuration. */
export function availableInfra<T extends { status: "existing" | "projected" }>(
  items: readonly T[],
  config: InfraConfig,
): T[] {
  return items.filter((i) => config === "expansion" || i.status === "existing");
}

function terminalFit(
  aircraft: AircraftDefinition,
  terminal: TerminalRef,
  international: boolean,
): FeasibilityCheck {
  const codeOk =
    CODE_LETTER_ORDER.indexOf(aircraft.codeLetter) <=
    CODE_LETTER_ORDER.indexOf(terminal.maxCodeLetter);
  const borderOk = !international || terminal.international;
  return {
    id: "terminal_fit",
    outcome: codeOk && borderOk ? "pass" : "fail",
    required: CODE_LETTER_ORDER.indexOf(aircraft.codeLetter),
    available: CODE_LETTER_ORDER.indexOf(terminal.maxCodeLetter),
  };
}

function rangeCheck(
  distanceKm: number,
  rangeKm: number,
  scenario: ErpmScenario,
): FeasibilityCheck {
  const required = Math.round(distanceKm * (1 + scenario.rangeReserve));
  return {
    id: "range",
    outcome: required <= rangeKm ? "pass" : "fail",
    required,
    available: rangeKm,
  };
}

function demandOutcome(status: ReturnType<typeof evaluateTrafficLight> | "no_data"): CheckOutcome {
  if (status === "green") return "pass";
  if (status === "yellow") return "tight";
  if (status === "red") return "fail";
  return "no_data";
}

function verdictFrom(checks: FeasibilityCheck[]): Verdict {
  const by = (id: FeasibilityCheck["id"]) => checks.find((c) => c.id === id)!;
  const HARD: FeasibilityCheck["id"][] = [
    "runway",
    "runway_width",
    "pavement",
    "approach",
    "arff",
    "terminal_fit",
    "range",
    "break_even",
  ];
  const hardFail = HARD.some((id) => by(id).outcome === "fail");
  if (hardFail) return "not_viable";
  if (by("demand").outcome === "no_data") return "no_data";
  const soft = checks.some(
    (c) => c.outcome === "tight" || (c.id === "demand" && c.outcome === "fail"),
  );
  return soft ? "conditional" : "viable";
}

/** User edits on top of a preset (what-if, expansion projects). */
export type ScenarioOverrides = Partial<Omit<ErpmScenario, "id">> & {
  /** Replaces the route's frequencies for every route */
  weeklyFrequencies?: number;
};

export type EvaluateRouteInput = {
  route: RouteOpportunity;
  aircraftId: AircraftId;
  origin: GeoPoint;
  destination: GeoPoint;
  /** Runways, terminals and ARFF, existing and projected */
  airport: AirportConstraints;
  /** "current" ignores projected assets; "expansion" adds them */
  infraConfig?: InfraConfig;
  /** Force a terminal, or let the validator pick the best fit */
  terminal?: TerminalChoice;
  scenarioId: ErpmScenarioId;
  overrides?: ScenarioOverrides;
};

/** Preset merged with overrides; invalid numbers fall back to the preset. */
export function resolveScenario(
  scenarioId: ErpmScenarioId,
  overrides: ScenarioOverrides = {},
): ErpmScenario {
  const preset = ERPM_SCENARIOS[scenarioId];
  const pick = (key: keyof Omit<ErpmScenario, "id">, min: number) => {
    const v = overrides[key];
    return typeof v === "number" && Number.isFinite(v) && v >= min ? v : preset[key];
  };
  return {
    id: scenarioId,
    demandFactor: pick("demandFactor", 0),
    takeoffFactor: pick("takeoffFactor", 0.5),
    revenuePerPax: pick("revenuePerPax", 0),
    costPerFlight: pick("costPerFlight", 0),
    rangeReserve: pick("rangeReserve", 0),
  };
}

/**
 * Runway the aircraft needs under a scenario: the bare takeoff distance and
 * the length that also clears the tight-margin band. Illustrative only.
 */
export function requiredRunwayM(
  aircraftId: AircraftId,
  scenario: Pick<ErpmScenario, "takeoffFactor">,
): { minimum: number; comfortable: number } | null {
  const takeoff = getAircraft(aircraftId).approxTakeoffDistanceM;
  if (takeoff === null) return null;
  const minimum = Math.ceil(takeoff * scenario.takeoffFactor);
  return {
    minimum,
    comfortable: Math.ceil(minimum / (1 - RUNWAY_TIGHT_MARGIN)),
  };
}

export function evaluateRoute(input: EvaluateRouteInput): RouteEvaluation {
  const aircraft = getAircraft(input.aircraftId);
  if (aircraft.mode === "cargo") {
    throw new Error("Route validator covers passenger aircraft only");
  }
  const scenario = resolveScenario(input.scenarioId, input.overrides);
  const { route, airport } = input;
  const infraConfig = input.infraConfig ?? "current";
  const requiredApproach = REQUIRED_APPROACH[route.segment];

  // Best runway: fewest failures, then the shortest one (keeps the long
  // runway free). A forced terminal does not constrain the runway.
  const runways = availableInfra(airport.runways, infraConfig);
  if (runways.length === 0) throw new Error("No runway available for the configuration");
  const rankedRunways = runways
    .map((r) => ({ runway: r, checks: runwayChecks(aircraft, scenario, r, requiredApproach) }))
    .sort(
      (a, b) =>
        worstOutcome(a.checks) - worstOutcome(b.checks) || a.runway.lengthM - b.runway.lengthM,
    );
  const chosenRunway = rankedRunways[0]!;

  const terminals = availableInfra(airport.terminals, infraConfig);
  if (terminals.length === 0) throw new Error("No terminal available for the configuration");
  const forced =
    input.terminal && input.terminal !== "auto"
      ? terminals.find((t) => t.id === input.terminal)
      : undefined;
  const terminal =
    forced ??
    terminals
      .map((t) => ({ t, fit: terminalFit(aircraft, t, route.international) }))
      .sort((a, b) => OUTCOME_RANK[a.fit.outcome] - OUTCOME_RANK[b.fit.outcome])[0]!.t;
  const fit = terminalFit(aircraft, terminal, route.international);
  const arff = airport.arffCategory[infraConfig];

  const distanceKm = greatCircleKm(input.origin, input.destination);
  const overrideFreq = input.overrides?.weeklyFrequencies;
  const frequencies =
    typeof overrideFreq === "number" && Number.isFinite(overrideFreq) && overrideFreq >= 1
      ? Math.floor(overrideFreq)
      : (route.weeklyFrequencies ?? DEFAULT_FREQUENCIES);
  const weeklySeats = aircraft.seats * frequencies;

  const weeklyDemandPax =
    route.weeklyDemandPax === null
      ? null
      : Math.round(route.weeklyDemandPax * scenario.demandFactor);
  const carried =
    weeklyDemandPax === null ? null : Math.min(weeklyDemandPax, weeklySeats);
  const projectedLoadFactor =
    carried === null || weeklySeats <= 0 ? null : carried / weeklySeats;
  const loadFactorStatus =
    projectedLoadFactor === null
      ? "no_data"
      : evaluateTrafficLight("K1", projectedLoadFactor);

  const breakEven = calculateBreakEven({
    aircraftId: input.aircraftId,
    revenuePerPax: scenario.revenuePerPax,
    costPerFlight: scenario.costPerFlight,
    weeklyFrequencies: frequencies,
    currentLoadFactor: projectedLoadFactor,
  });
  const breakEvenOutcome: CheckOutcome =
    breakEven.status === "infeasible"
      ? "fail"
      : breakEven.lfEquilibrium === null
        ? "no_data"
        : breakEven.comparison === "below_break_even"
          ? "tight"
          : breakEven.comparison === "unavailable"
            ? "no_data"
            : "pass";

  // An operating route is already inside the rolling 12-month baseline.
  const addedAnnualPax =
    carried === null || (route.stage === "operating" && terminal.id === "T1")
      ? 0
      : carried * DIRECTIONS * WEEKS_PER_YEAR;
  // Today's traffic lives in T1; a new T2 starts empty.
  const terminalBaseline = terminal.id === "T1" ? airport.rolling12MonthPassengers : 0;
  const utilizationAfter =
    (terminalBaseline + addedAnnualPax) / terminal.annualCapacity;
  const utilizationStatus = evaluateTrafficLight("K3", utilizationAfter);

  const checks: FeasibilityCheck[] = [
    ...chosenRunway.checks,
    {
      id: "arff",
      outcome: arff >= aircraft.arffCategory ? "pass" : "fail",
      required: aircraft.arffCategory,
      available: arff,
    },
    fit,
    rangeCheck(distanceKm, aircraft.rangeKm, scenario),
    {
      id: "demand",
      outcome: demandOutcome(loadFactorStatus),
      required: Math.ceil(kpiThresholds.K1.greenMin * weeklySeats),
      available: weeklyDemandPax,
    },
    {
      id: "break_even",
      outcome: breakEvenOutcome,
      required: breakEven.lfEquilibrium,
      available: projectedLoadFactor,
    },
    {
      id: "terminal",
      outcome:
        utilizationStatus === "green"
          ? "pass"
          : utilizationStatus === "yellow"
            ? "tight"
            : "fail",
      required: utilizationAfter,
      available: kpiThresholds.K3.greenBelow,
    },
  ];

  const runway = requiredRunwayM(input.aircraftId, scenario);
  const longest = Math.max(...runways.map((r) => r.lengthM));

  return {
    routeId: route.id,
    aircraftId: input.aircraftId,
    scenarioId: input.scenarioId,
    infraConfig,
    runwayId: chosenRunway.runway.id,
    terminalId: terminal.id,
    distanceKm,
    weeklyFrequencies: frequencies,
    runwayRequiredM: runway?.comfortable ?? null,
    runwayExtensionM:
      runway === null ? null : Math.max(0, runway.comfortable - longest),
    weeklySeats,
    weeklyDemandPax,
    projectedLoadFactor,
    loadFactorStatus,
    breakEvenLoadFactor: breakEven.lfEquilibrium,
    breakEvenStatus: breakEven.status,
    paxPerFlightTarget70: Math.ceil(kpiThresholds.K1.greenMin * aircraft.seats),
    utilizationAfter,
    utilizationStatus,
    checks,
    verdict: verdictFrom(checks),
    gaps: checks.filter((c) => c.outcome === "no_data").map((c) => c.id),
  };
}

/** Inputs that differ from the base preset, for "what changed" UI. */
export function scenarioDeltas(scenarioId: ErpmScenarioId): ScenarioDelta[] {
  const base = ERPM_SCENARIOS.base;
  const scenario = ERPM_SCENARIOS[scenarioId];
  const keys: ScenarioDelta["key"][] = [
    "demandFactor",
    "takeoffFactor",
    "revenuePerPax",
    "costPerFlight",
    "rangeReserve",
  ];
  return keys
    .filter((key) => scenario[key] !== base[key])
    .map((key) => ({ key, base: base[key], value: scenario[key] }));
}

export type SensitivityKey =
  | "demandFactor"
  | "revenuePerPax"
  | "costPerFlight"
  | "weeklyFrequencies";

export type SensitivityBar = {
  key: SensitivityKey;
  /** Margin over break-even (LF points as a ratio) with the input at −delta */
  low: number;
  /** Same with the input at +delta */
  high: number;
  /** Largest absolute change from the baseline margin */
  impact: number;
};

export type SensitivityResult = {
  /** projected LF − break-even LF at the current inputs; null if unknown */
  baseline: number | null;
  bars: SensitivityBar[];
};

function marginOf(e: RouteEvaluation): number | null {
  if (e.projectedLoadFactor === null || e.breakEvenLoadFactor === null) return null;
  return e.projectedLoadFactor - e.breakEvenLoadFactor;
}

/**
 * Tornado (DESIGN.md §9): ±delta on each input (±1 for frequencies), effect on the margin over the
 * airport break-even, sorted by impact. Mandatory next to any verdict.
 */
export function routeSensitivity(
  input: EvaluateRouteInput,
  delta = 0.1,
): SensitivityResult {
  const base = evaluateRoute(input);
  const baseline = marginOf(base);
  if (baseline === null) return { baseline: null, bars: [] };
  const scenario = resolveScenario(input.scenarioId, input.overrides);
  const values: Record<SensitivityKey, number> = {
    demandFactor: scenario.demandFactor,
    revenuePerPax: scenario.revenuePerPax,
    costPerFlight: scenario.costPerFlight,
    weeklyFrequencies: base.weeklyFrequencies,
  };
  const bars = (Object.keys(values) as SensitivityKey[]).map((key) => {
    // Frequencies are whole flights, so they move by one instead of ±delta.
    const at = (direction: -1 | 1) => {
      const next =
        key === "weeklyFrequencies"
          ? Math.max(1, values[key] + direction)
          : values[key] * (1 + direction * delta);
      const m = marginOf(
        evaluateRoute({ ...input, overrides: { ...input.overrides, [key]: next } }),
      );
      return m ?? baseline;
    };
    const low = at(-1);
    const high = at(1);
    return {
      key,
      low,
      high,
      impact: Math.max(Math.abs(low - baseline), Math.abs(high - baseline)),
    };
  });
  bars.sort((a, b) => b.impact - a.impact);
  return { baseline, bars };
}
