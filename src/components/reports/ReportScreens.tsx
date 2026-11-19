import { Suspense } from "react";
import { getReport } from "@/application/reports";
import { readDemoRole } from "@/application/read-demo-session";
import { loadDashboardBundle } from "@/data/fixtures/load-dashboard";
import { allowedReports, canExport } from "@/domain/access";
import type { ReportId } from "@/domain/reports";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ScreenLoading } from "@/components/ui/ScreenLoading";
import { getDictionary } from "@/i18n/dictionaries";
import { ReportCard, ReportDocument } from "./ReportViews";
import screen from "@/components/screens/screen.module.css";
import styles from "./reports.module.css";

function datasetLine() {
  const { meta } = loadDashboardBundle();
  return `Dataset ${meta.dataset} v${meta.version} · ${meta.fuente} · ${meta.verificationStatus}`;
}

/** /reportes: the three decision reports side by side. */
export function ReportsOverview() {
  const dict = getDictionary("es");
  return (
    <Suspense fallback={<ScreenLoading label={dict.states.loading} />}>
      <OverviewContent />
    </Suspense>
  );
}

async function OverviewContent() {
  const dict = getDictionary("es");
  const t = dict.screens.reports;
  const role = await readDemoRole();
  const ids = role ? allowedReports(role) : [];
  const exportAllowed = role ? canExport(role) : false;

  return (
    <main className={screen.main}>
      <div className={screen.pad}>
        <ScreenHeader eyebrow={`${dict.nav.groupDss} · ${dict.nav.reports}`} title={t.title} question={t.question} />
      </div>
      <div className={styles.intro}>
        <p>
          Cada informe responde una pregunta de gerencia, muestra la evidencia y termina en decisiones con responsable. Genere el informe completo para el comité, descárguelo en CSV o guárdelo en PDF.
        </p>
      </div>
      <div className={styles.cards}>
        {ids.map((id) => (
          <ReportCard
            key={id}
            report={getReport(id)}
            canExport={exportAllowed}
            deniedNote={dict.access.exportDenied}
          />
        ))}
      </div>
      <footer className={screen.footer}>
        <p className={screen.disclaimer}>{datasetLine()}. Los informes apoyan el juicio de la gerencia; no lo reemplazan.</p>
      </footer>
    </main>
  );
}

type DetailProps = {
  id: ReportId;
  searchParams: Promise<{ imprimir?: string }>;
};

/** /reportes/<id>: the full, printable report. */
export function ReportDetail(props: DetailProps) {
  const dict = getDictionary("es");
  return (
    <Suspense fallback={<ScreenLoading label={dict.states.loading} />}>
      <DetailContent {...props} />
    </Suspense>
  );
}

async function DetailContent({ id, searchParams }: DetailProps) {
  const dict = getDictionary("es");
  const [role, params] = await Promise.all([readDemoRole(), searchParams]);
  const exportAllowed = role ? canExport(role) : false;
  return (
    <ReportDocument
      report={getReport(id)}
      canExport={exportAllowed}
      deniedNote={dict.access.exportDenied}
      autoPrint={params.imprimir === "1"}
      datasetLine={datasetLine()}
    />
  );
}
