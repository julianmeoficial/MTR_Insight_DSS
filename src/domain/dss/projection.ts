/**
 * P(t) = P(base) * (1 + rate)^(t - baseYear)
 * Rates are global references (2.5% / 3.9% / 5.5%), not Montería-validated forecasts.
 */

export const FORECAST_RATES = {
  low: 0.025,
  base: 0.039,
  high: 0.055,
} as const;

export type ForecastBand = keyof typeof FORECAST_RATES;

export function projectPassengers(
  baseline: number,
  baseYear: number,
  targetYear: number,
  rate: number,
): number {
  if (!Number.isFinite(baseline) || baseline < 0) {
    throw new Error("baseline must be a non-negative finite number");
  }
  if (!Number.isFinite(rate) || rate < -1) {
    throw new Error("rate must be finite and greater than -1");
  }
  const years = targetYear - baseYear;
  return baseline * (1 + rate) ** years;
}

export function capacityTriggerYear(
  baseline: number,
  baseYear: number,
  rate: number,
  capacity: number,
  triggerRatio: number,
): number | null {
  if (capacity <= 0) return null;
  const threshold = capacity * triggerRatio;
  if (baseline >= threshold) return baseYear;
  for (let y = baseYear; y <= 2045; y += 1) {
    if (projectPassengers(baseline, baseYear, y, rate) >= threshold) {
      return y;
    }
  }
  return null;
}

export type FanPoint = {
  year: number;
  low: number;
  base: number;
  high: number;
};

export function buildFanSeries(
  baseline: number,
  baseYear: number,
  endYear: number,
): FanPoint[] {
  const points: FanPoint[] = [];
  for (let year = baseYear; year <= endYear; year += 1) {
    points.push({
      year,
      low: projectPassengers(baseline, baseYear, year, FORECAST_RATES.low),
      base: projectPassengers(baseline, baseYear, year, FORECAST_RATES.base),
      high: projectPassengers(baseline, baseYear, year, FORECAST_RATES.high),
    });
  }
  return points;
}
