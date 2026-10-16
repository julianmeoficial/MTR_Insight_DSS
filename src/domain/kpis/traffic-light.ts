import { kpiThresholds } from "@/config/thresholds";
import type { KpiId, TrafficLight } from "@/domain/types";

/**
 * Maps a raw ratio to a traffic light using versioned thresholds.
 * Callers must handle missing/zero denominators before invoking this.
 */
export function evaluateTrafficLight(kpiId: KpiId, value: number): TrafficLight {
  switch (kpiId) {
    case "K1": {
      if (value >= kpiThresholds.K1.greenMin) return "green";
      if (value >= kpiThresholds.K1.yellowMin) return "yellow";
      return "red";
    }
    case "K3": {
      if (value < kpiThresholds.K3.greenBelow) return "green";
      if (value < kpiThresholds.K3.redMin) return "yellow";
      return "red";
    }
    case "K4": {
      if (value >= kpiThresholds.K4.greenMin) return "green";
      if (value >= kpiThresholds.K4.yellowMin) return "yellow";
      return "red";
    }
    case "K5": {
      if (value >= kpiThresholds.K5.greenMin) return "green";
      if (value >= kpiThresholds.K5.yellowMin) return "yellow";
      return "red";
    }
    case "K2":
      throw new Error(
        "K2 status uses evaluateK2Compliance overrides; do not call evaluateTrafficLight for K2",
      );
    default: {
      const _exhaustive: never = kpiId;
      return _exhaustive;
    }
  }
}

export function noDataResult(
  kpiId: KpiId,
  period: { start: string; end: string },
  meta?: { numerator: number; denominator: number },
  dimensions?: Record<string, string>,
) {
  return {
    kpiId,
    value: null,
    unit: "ratio" as const,
    status: "no_data" as const,
    period,
    dimensions,
    meta,
  };
}
