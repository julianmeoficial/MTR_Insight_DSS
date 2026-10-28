import { DssWorkbench } from "@/components/screens/DssWorkbench";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { loadDashboardBundle, loadSituation } from "@/data/fixtures/load-dashboard";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDateIso } from "@/lib/format";
import styles from "@/components/screens/screen.module.css";

export const metadata = {
  title: "Planeación 2045 · MTR Insight",
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function P6Page() {
  const bundle = loadDashboardBundle();
  const dict = getDictionary("es");

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={`${dict.nav.views} · P6`}
          title={dict.screens.p6.title}
          question={dict.screens.p6.question}
        />
      </div>
      <DssWorkbench
        baselinePassengers={1_478_610}
        baseYear={2024}
        capacity={bundle.capacity.declaredAnnualCapacity}
        expansionCapacity={
          loadSituation().infrastructure.terminals.find((t) => t.id === "T2")?.annualCapacity
        }
      />
      <p className={styles.dashNote}>{dict.states.locked}</p>
      <footer className={styles.footer}>
        <ProvenanceLine
          source={bundle.meta.fuente}
          datasetVersion={bundle.meta.version}
          verificationStatus="simulated"
          lastValidated={formatDateIso(bundle.meta.lastValidated)}
        />
      </footer>
    </main>
  );
}
