import { AppShell } from "@/components/shell/AppShell";
import { buildDashboardReport } from "@/application/dashboard";

export default function SigLayout({ children }: { children: React.ReactNode }) {
  const report = buildDashboardReport();

  return (
    <AppShell
      globalStatus={report.globalStatus}
      lastValidated={report.lastValidatedLabel}
      asOfDate={report.asOfLabel}
      alertCount={report.alerts.length}
    >
      {children}
    </AppShell>
  );
}
