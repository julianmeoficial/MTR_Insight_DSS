import { alertPolicies } from "@/config/alert-policies";
import type {
  AlertEvent,
  KpiResult,
  QualityRecord,
} from "@/domain/types";

function entityKey(result: KpiResult): string {
  const d = result.dimensions;
  if (!d) return "aggregate";
  return [d.route, d.operator, d.aircraftType].filter(Boolean).join("|");
}

/**
 * Emits K1_RED_STREAK when an entity has N consecutive weekly K1 results in red.
 * Sorted by period.start ascending within each entity.
 */
export function evaluateK1RedStreak(
  k1Results: readonly KpiResult[],
  options?: { redStreakWeeks?: number; owner?: string },
): AlertEvent[] {
  const streakNeeded =
    options?.redStreakWeeks ?? alertPolicies.k1RedStreak.redStreakWeeks;
  const owner = options?.owner ?? alertPolicies.k1RedStreak.owner;

  const byEntity = new Map<string, KpiResult[]>();
  for (const result of k1Results) {
    if (result.kpiId !== "K1") continue;
    const key = entityKey(result);
    const list = byEntity.get(key) ?? [];
    list.push(result);
    byEntity.set(key, list);
  }

  const alerts: AlertEvent[] = [];

  for (const [entity, results] of byEntity) {
    const sorted = [...results].sort((a, b) =>
      a.period.start.localeCompare(b.period.start),
    );

    let streak = 0;
    let streakStart: string | null = null;
    let streakEnd: string | null = null;

    for (const result of sorted) {
      if (result.status === "red") {
        if (streak === 0) streakStart = result.period.start;
        streak += 1;
        streakEnd = result.period.end;
      } else {
        streak = 0;
        streakStart = null;
        streakEnd = null;
      }

      if (streak >= streakNeeded && streakStart && streakEnd) {
        const id = `K1_RED_STREAK|${entity}|${streakStart}|${streakEnd}|${streakNeeded}`;
        if (!alerts.some((a) => a.id === id)) {
          alerts.push({
            id,
            trigger: "K1_RED_STREAK",
            kpiId: "K1",
            severity: "red",
            period: { start: streakStart, end: streakEnd },
            entity,
            owner,
            message: `Load factor in red for ${streak} consecutive weeks (${alertPolicies.k1RedStreak.policyRef}).`,
          });
        }
      }
    }
  }

  return alerts;
}

/**
 * Emits SOURCE_NOT_LOADED when a critical data source was not loaded for the period.
 */
export function evaluateSourceNotLoaded(
  qualityRecords: readonly QualityRecord[],
  options?: { owner?: string },
): AlertEvent[] {
  const owner = options?.owner ?? alertPolicies.sourceNotLoaded.owner;
  const alerts: AlertEvent[] = [];

  for (const record of qualityRecords) {
    if (record.loaded) continue;

    const id = `SOURCE_NOT_LOADED|${record.sourceId}|${record.periodStart}|${record.periodEnd}`;
    alerts.push({
      id,
      trigger: "SOURCE_NOT_LOADED",
      kpiId: "K5",
      severity: "red",
      period: { start: record.periodStart, end: record.periodEnd },
      entity: record.sourceId,
      owner: record.owner || owner,
      message: `Critical source "${record.sourceName}" was not loaded on time (${alertPolicies.sourceNotLoaded.policyRef}).`,
    });
  }

  return alerts;
}

/**
 * Runs the minimum alert rules (≥2 thresholds) for P1, P2, and the alert center.
 */
export function evaluateAlerts(input: {
  k1Results?: readonly KpiResult[];
  qualityRecords?: readonly QualityRecord[];
}): AlertEvent[] {
  const events: AlertEvent[] = [];

  if (input.k1Results) {
    events.push(...evaluateK1RedStreak(input.k1Results));
  }
  if (input.qualityRecords) {
    events.push(...evaluateSourceNotLoaded(input.qualityRecords));
  }

  return events.sort((a, b) => a.id.localeCompare(b.id));
}
