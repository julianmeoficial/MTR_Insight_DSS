import type { KpiResult, QualityRecord } from "@/domain/types";
import { evaluateTrafficLight, noDataResult } from "@/domain/kpis/traffic-light";

/**
 * K5 = critical records loaded on time and validated / expected critical records.
 * Unresolved technical-data conflicts force red under the approved publication rule.
 */
export function calculateK5(records: readonly QualityRecord[]): KpiResult {
  if (records.length === 0) {
    return noDataResult("K5", { start: "", end: "" }, {
      numerator: 0,
      denominator: 0,
    });
  }

  const periodStart = records.reduce(
    (min, r) => (r.periodStart < min ? r.periodStart : min),
    records[0].periodStart,
  );
  const periodEnd = records.reduce(
    (max, r) => (r.periodEnd > max ? r.periodEnd : max),
    records[0].periodEnd,
  );
  const period = { start: periodStart, end: periodEnd };

  const numerator = records.reduce(
    (sum, r) => sum + r.loadedOnTimeAndValidated,
    0,
  );
  const denominator = records.reduce(
    (sum, r) => sum + r.expectedCriticalRecords,
    0,
  );
  const hasUnresolvedConflict = records.some(
    (r) => r.unresolvedTechnicalConflict,
  );

  if (denominator <= 0) {
    return noDataResult("K5", period, { numerator, denominator });
  }

  const value = numerator / denominator;
  let status = evaluateTrafficLight("K5", value);
  let overrideReason: string | undefined;

  if (hasUnresolvedConflict) {
    status = "red";
    overrideReason = "unresolved_technical_conflict";
  }

  return {
    kpiId: "K5",
    value,
    unit: "ratio",
    status,
    period,
    meta: { numerator, denominator, overrideReason },
  };
}
