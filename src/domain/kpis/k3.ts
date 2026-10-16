import type { CapacitySnapshot, KpiResult } from "@/domain/types";
import { evaluateTrafficLight, noDataResult } from "@/domain/kpis/traffic-light";

/**
 * K3 = rolling 12-month passengers / declared annual capacity.
 */
export function calculateK3(snapshot: CapacitySnapshot): KpiResult {
  const period = { start: snapshot.periodStart, end: snapshot.periodEnd };
  const { rolling12MonthPassengers, declaredAnnualCapacity } = snapshot;

  if (declaredAnnualCapacity <= 0) {
    return noDataResult("K3", period, {
      numerator: rolling12MonthPassengers,
      denominator: declaredAnnualCapacity,
    });
  }

  const value = rolling12MonthPassengers / declaredAnnualCapacity;
  return {
    kpiId: "K3",
    value,
    unit: "ratio",
    status: evaluateTrafficLight("K3", value),
    period,
    meta: {
      numerator: rolling12MonthPassengers,
      denominator: declaredAnnualCapacity,
    },
  };
}
