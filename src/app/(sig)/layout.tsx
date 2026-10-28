import { Suspense } from "react";
import { redirect } from "next/navigation";
import { buildDashboardReport } from "@/application/dashboard";
import { readDemoRole } from "@/application/read-demo-session";
import { AccessGate } from "@/components/access/AccessGate";
import { AppShell } from "@/components/shell/AppShell";
import { getDictionary } from "@/i18n/dictionaries";
import type { RoleId } from "@/config/access-matrix";

/** Session cookie is request data, so this segment cannot prerender. */
export const instant = false;

export default function SigLayout({ children }: { children: React.ReactNode }) {
  const dict = getDictionary("es");

  return (
    <Suspense
      fallback={
        <p role="status" className="sr-only">
          {dict.states.loading}
        </p>
      }
    >
      <AuthedSig>{children}</AuthedSig>
    </Suspense>
  );
}

async function AuthedSig({ children }: { children: React.ReactNode }) {
  const role = await readDemoRole();
  if (!role) redirect("/login");

  return <SigFrame role={role}>{children}</SigFrame>;
}

function SigFrame({
  role,
  children,
}: {
  role: RoleId;
  children: React.ReactNode;
}) {
  const report = buildDashboardReport();

  return (
    <AppShell
      role={role}
      globalStatus={report.globalStatus}
      lastValidated={report.lastValidatedLabel}
      asOfDate={report.asOfLabel}
      alertCount={report.alerts.length}
      dataset={{
        source: report.meta.fuente,
        version: report.meta.version,
        verificationStatus: report.meta.verificationStatus,
      }}
    >
      <AccessGate role={role}>{children}</AccessGate>
    </AppShell>
  );
}
