import { buildDashboardReport } from "@/application/dashboard";
import { LandingPage } from "@/components/landing/LandingPage";

export default function Home() {
  const report = buildDashboardReport();
  return (
    <LandingPage
      tiles={report.tiles}
      alerts={report.alerts}
      series={report.series}
      meta={{
        source: report.meta.fuente,
        version: report.meta.version,
        status: report.meta.verificationStatus,
        lastValidated: report.lastValidatedLabel,
      }}
    />
  );
}
