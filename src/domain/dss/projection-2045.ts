import { dssDefaults } from "@/config/dss-defaults";
import type {
  CapacityTrigger,
  Projection2045Result,
  ProjectionPoint,
  ProjectionScenarioId,
  ScenarioProjection,
} from "@/domain/dss/types";

export type Projection2045Input = {
  baseYear?: number;
  horizonYear?: number;
  baselinePassengers?: number;
  declaredAnnualCapacity?: number;
  rates?: { low: number; base: number; high: number };
};

function projectPassengers(
  baseline: number,
  rate: number,
  baseYear: number,
  year: number,
): number {
  return baseline * (1 + rate) ** (year - baseYear);
}

function firstYearCrossing(
  series: readonly ProjectionPoint[],
  thresholdUtilization: number,
  alreadyMetAtBase: boolean,
): number | null {
  if (alreadyMetAtBase) return null;
  for (const point of series) {
    if (point.utilization >= thresholdUtilization) {
      return point.year;
    }
  }
  return null;
}

function buildTriggers(
  series: readonly ProjectionPoint[],
  baselineUtilization: number,
): CapacityTrigger[] {
  const planAlready = baselineUtilization >= dssDefaults.projection.triggerPlan;
  const execAlready =
    baselineUtilization >= dssDefaults.projection.triggerExecute;

  return [
    {
      level: 0.8,
      label: "Planear ampliación (80 % de capacidad terminal)",
      year: firstYearCrossing(series, 0.8, planAlready),
      alreadyMet: planAlready,
      policyRef: "PG-11 / R16",
    },
    {
      level: 0.9,
      label: "Ejecutar ampliación (90 %) · R16 saturación terminal",
      year: firstYearCrossing(series, 0.9, execAlready),
      alreadyMet: execAlready,
      policyRef: "R16",
    },
  ];
}

function buildScenario(
  id: ProjectionScenarioId,
  rate: number,
  label: string,
  baseline: number,
  capacity: number,
  baseYear: number,
  horizonYear: number,
  baselineUtilization: number,
): ScenarioProjection {
  const series: ProjectionPoint[] = [];
  for (let year = baseYear; year <= horizonYear; year += 1) {
    const passengers = projectPassengers(baseline, rate, baseYear, year);
    series.push({
      year,
      passengers,
      utilization: passengers / capacity,
    });
  }

  return {
    id,
    rate,
    label,
    series,
    triggers: buildTriggers(series, baselineUtilization),
  };
}

/**
 * P(t) = P(base) × (1 + rate)^(t − baseYear)
 * Rates: low 2.5 %, base 3.9 % (Airbus GMF global reference), high 5.5 %.
 */
export function projectDemand2045(
  input: Projection2045Input = {},
): Projection2045Result {
  const baseYear = input.baseYear ?? dssDefaults.projection.baseYear;
  const horizonYear = input.horizonYear ?? dssDefaults.projection.horizonYear;
  const baselinePassengers =
    input.baselinePassengers ?? dssDefaults.projection.baselinePassengers;
  const declaredAnnualCapacity =
    input.declaredAnnualCapacity ??
    dssDefaults.projection.declaredAnnualCapacity;
  const rates = input.rates ?? dssDefaults.projection.rates;

  if (declaredAnnualCapacity <= 0) {
    throw new Error("declaredAnnualCapacity must be > 0");
  }

  const baselineUtilization = baselinePassengers / declaredAnnualCapacity;

  const scenarios: ScenarioProjection[] = [
    buildScenario(
      "low",
      rates.low,
      "Bajo 2,5 %",
      baselinePassengers,
      declaredAnnualCapacity,
      baseYear,
      horizonYear,
      baselineUtilization,
    ),
    buildScenario(
      "base",
      rates.base,
      "Base 3,9 % (GMF Airbus)",
      baselinePassengers,
      declaredAnnualCapacity,
      baseYear,
      horizonYear,
      baselineUtilization,
    ),
    buildScenario(
      "high",
      rates.high,
      "Alto 5,5 %",
      baselinePassengers,
      declaredAnnualCapacity,
      baseYear,
      horizonYear,
      baselineUtilization,
    ),
  ];

  return {
    baseYear,
    horizonYear,
    baselinePassengers,
    declaredAnnualCapacity,
    baselineUtilization,
    scenarios,
    assumptionNote:
      "La tasa 3,9 % es una referencia global del GMF de Airbus, no un pronóstico validado de Montería. Los disparadores apoyan juicio humano; no ejecutan decisiones operativas.",
  };
}

/** Sample selected years for compact UI tables (base, +5, mid, horizon). */
export function sampleProjectionYears(
  result: Projection2045Result,
): number[] {
  const { baseYear, horizonYear } = result;
  const mid = Math.floor((baseYear + horizonYear) / 2);
  const years = new Set([
    baseYear,
    baseYear + 5,
    mid,
    horizonYear - 5,
    horizonYear,
  ]);
  return [...years]
    .filter((y) => y >= baseYear && y <= horizonYear)
    .sort((a, b) => a - b);
}
