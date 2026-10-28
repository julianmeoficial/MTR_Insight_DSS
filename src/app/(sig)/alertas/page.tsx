import { AlertList } from "@/components/AlertList";
import { buildDashboardReport } from "@/application/dashboard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { getDictionary } from "@/i18n/dictionaries";
import styles from "@/components/screens/screen.module.css";

export const metadata = {
  title: "Alertas · MTR Insight",
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function AlertasPage() {
  const report = buildDashboardReport();
  const dict = getDictionary("es");

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={dict.nav.alerts}
          title={dict.screens.alerts.title}
          question={dict.screens.alerts.purpose}
        />
        <p className={styles.muted} aria-live="polite">
          <span className="num">{report.alerts.length}</span>
          {" · "}
          {report.meta.version}
        </p>
      </div>
      <AlertList alerts={report.alerts} keyboard />
      <footer className={styles.footer}>
        <ProvenanceLine
          source={report.meta.fuente}
          datasetVersion={report.meta.version}
          verificationStatus={report.meta.verificationStatus}
          lastValidated={report.lastValidatedLabel}
        />
      </footer>
    </main>
  );
}
