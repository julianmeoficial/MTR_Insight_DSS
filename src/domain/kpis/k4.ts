import type { DemandSnapshot, KpiResult } from "@/domain/types";
import { evaluateTrafficLight, noDataResult } from "@/domain/kpis/traffic-light";

/**
 * K4 = direct international departures from MTR / catchment international travelers.
 * Geography and time windows must already match in the input snapshot.
 */
export function calculateK4(snapshot: DemandSnapshot): KpiResult {
  const period = { start: snapshot.periodStart, end: snapshot.periodEnd };
  const {
    directInternationalDeparturesFromMtr,
    catchmentInternationalTravelers,
  } = snapshot;

  if (catchmentInternationalTravelers <= 0) {
    return noDataResult("K4", period, {
      numerator: directInternationalDeparturesFromMtr,
      denominator: catchmentInternationalTravelers,
    });
  }

  const value =
    directInternationalDeparturesFromMtr / catchmentInternationalTravelers;
  return {
    kpiId: "K4",
    value,
    unit: "ratio",
    status: evaluateTrafficLight("K4", value),
    period,
    meta: {
      numerator: directInternationalDeparturesFromMtr,
      denominator: catchmentInternationalTravelers,
    },
  };
}
