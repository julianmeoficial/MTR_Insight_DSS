import { kpiThresholds } from "@/config/thresholds";
import type { KpiResult, RequirementRecord } from "@/domain/types";
import { noDataResult } from "@/domain/kpis/traffic-light";

function isSatisfied(req: RequirementRecord, asOfDate: string): boolean {
  if (!req.applicable) return false;
  if (!req.evidenceId || !req.approvalDate) return false;
  if (req.approvalDate > asOfDate) return false;
  return true;
}

function isOverdue(req: RequirementRecord, asOfDate: string): boolean {
  return req.dueDate < asOfDate && !isSatisfied(req, asOfDate);
}

/**
 * K2 = requirements satisfied with valid evidence / applicable requirements.
 * A completed flag without evidence and approval date does not count.
 * Critical overdue or quarterly compliance < 90% overrides to red.
 * Overdue non-critical milestones are yellow.
 */
export function calculateK2(
  requirements: readonly RequirementRecord[],
  asOfDate: string,
  period: { start: string; end: string },
): KpiResult {
  const applicable = requirements.filter((r) => r.applicable);

  if (applicable.length === 0) {
    return noDataResult("K2", period, { numerator: 0, denominator: 0 });
  }

  const satisfied = applicable.filter((r) => isSatisfied(r, asOfDate));
  const value = satisfied.length / applicable.length;

  const criticalApplicable = applicable.filter((r) => r.critical);
  const criticalOverdue = criticalApplicable.some((r) => isOverdue(r, asOfDate));
  const nonCriticalOverdue = applicable.some(
    (r) => !r.critical && isOverdue(r, asOfDate),
  );

  let status: KpiResult["status"];
  let overrideReason: string | undefined;

  if (criticalOverdue) {
    status = "red";
    overrideReason = "critical_overdue";
  } else if (value < kpiThresholds.K2.quarterlyRedBelow) {
    status = "red";
    overrideReason = "quarterly_below_90";
  } else if (nonCriticalOverdue) {
    status = "yellow";
    overrideReason = "noncritical_overdue";
  } else if (
    criticalApplicable.length > 0 &&
    criticalApplicable.every((r) => isSatisfied(r, asOfDate))
  ) {
    status = "green";
  } else if (value >= kpiThresholds.K2.quarterlyRedBelow) {
    status = "yellow";
  } else {
    status = "red";
  }

  return {
    kpiId: "K2",
    value,
    unit: "ratio",
    status,
    period,
    meta: {
      numerator: satisfied.length,
      denominator: applicable.length,
      overrideReason,
    },
  };
}
