import { loadDashboardBundle } from "@/data/fixtures/load-dashboard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { RequirementsMatrix } from "@/components/screens/RequirementsMatrix";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDateIso } from "@/lib/format";
import styles from "@/components/screens/screen.module.css";

export const metadata = {
  title: "Cumplimiento · MTR Insight",
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function P3Page() {
  const dict = getDictionary("es");
  const bundle = loadDashboardBundle();
  const asOf = bundle.requirementsAsOf;
  const rows = bundle.requirements.map((r) => {
    const days = daysUntil(r.dueDate, asOf);
    const satisfied = Boolean(r.applicable && r.evidenceId && r.approvalDate);
    return {
      requirementId: r.requirementId,
      authority: r.authority,
      dueDate: r.dueDate,
      dueLabel: formatDateIso(r.dueDate),
      critical: r.critical,
      completedFlag: r.completedFlag,
      evidenceId: r.evidenceId,
      approvalDate: r.approvalDate,
      approvalLabel: r.approvalDate ? formatDateIso(r.approvalDate) : null,
      days,
      satisfied,
    };
  });

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={dict.demo.tag}
          title={dict.screens.p3.title}
          question={dict.screens.p3.question}
        />
      </div>
      <RequirementsMatrix rows={rows} />
      <footer className={styles.footer}>
        <ProvenanceLine
          source={bundle.meta.fuente}
          datasetVersion={bundle.meta.version}
          verificationStatus={bundle.meta.verificationStatus}
          lastValidated={formatDateIso(bundle.meta.lastValidated)}
        />
      </footer>
    </main>
  );
}

function daysUntil(dueIso: string, asOfIso: string): number {
  const due = Date.parse(`${dueIso}T12:00:00-05:00`);
  const asOf = Date.parse(`${asOfIso}T12:00:00-05:00`);
  return Math.ceil((due - asOf) / (1000 * 60 * 60 * 24));
}
