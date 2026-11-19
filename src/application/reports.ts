import { loadDashboardBundle, loadSituation } from "@/data/fixtures/load-dashboard";
import {
  buildCapacityReport,
  buildCommercialReport,
  buildComplianceReport,
  type AnyReport,
  type CapacityReport,
  type CommercialReport,
  type ComplianceReport,
  type ReportId,
} from "@/domain/reports";

export const REPORT_IDS: readonly ReportId[] = ["comercial", "capacidad", "cumplimiento"];

export function isReportId(value: string): value is ReportId {
  return (REPORT_IDS as readonly string[]).includes(value);
}

export function getCommercialReport(): CommercialReport {
  const bundle = loadDashboardBundle();
  const situation = loadSituation();
  return buildCommercialReport({
    flights: bundle.flights,
    routes: bundle.routes.routes,
    launches: situation.routes
      .filter((r) => r.start !== null && r.airline !== null)
      .map((r) => ({ destination: r.destination, airline: r.airline })),
    quality: bundle.quality,
  });
}

export function getCapacityReport(): CapacityReport {
  const bundle = loadDashboardBundle();
  const situation = loadSituation();
  const projected = situation.infrastructure.terminals
    .filter((t) => t.status === "projected")
    .reduce((s, t) => s + t.annualCapacity, 0);
  return buildCapacityReport({
    capacity: bundle.capacity,
    projectedTerminalCapacity: projected > 0 ? projected : null,
    cargo: bundle.cargo.operators.map((o) => ({ label: o.label, warehouses: o.warehouses })),
    runwayConflict:
      bundle.infrastructure.runwayConflict.lengthM !== bundle.infrastructure.runway.lengthM
        ? {
            verifiedM: bundle.infrastructure.runway.lengthM,
            conflictingM: bundle.infrastructure.runwayConflict.lengthM,
          }
        : null,
  });
}

export function getComplianceReport(): ComplianceReport {
  const bundle = loadDashboardBundle();
  return buildComplianceReport({
    requirements: bundle.requirements,
    asOf: bundle.requirementsAsOf,
    period: bundle.requirementsPeriod,
    quality: bundle.quality,
    etlLoads: bundle.etlLog.loads,
  });
}

export function getReport(id: ReportId): AnyReport {
  switch (id) {
    case "comercial":
      return getCommercialReport();
    case "capacidad":
      return getCapacityReport();
    case "cumplimiento":
      return getComplianceReport();
  }
}
