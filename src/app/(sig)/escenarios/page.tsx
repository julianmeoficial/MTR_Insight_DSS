import { DssWorkbench } from "@/components/screens/DssWorkbench";
import { loadDashboardBundle } from "@/data/fixtures/load-dashboard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDateIso } from "@/lib/format";
import styles from "@/components/screens/screen.module.css";

export const metadata = {
  title: "Escenarios · MTR Insight",
};

export default function EscenariosPage() {
  const bundle = loadDashboardBundle();
  const dict = getDictionary("es");

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={dict.demo.tag}
          title={dict.screens.scenarios.title}
          question={dict.dss.goalSeek}
        />
      </div>
      <DssWorkbench
        baselinePassengers={1_478_610}
        baseYear={2024}
        capacity={bundle.capacity.declaredAnnualCapacity}
      />
      <footer className={styles.footer}>
        <ProvenanceLine
          source={bundle.meta.fuente}
          datasetVersion={bundle.meta.version}
          verificationStatus="simulated"
          lastValidated={formatDateIso(bundle.meta.lastValidated)}
        />
        <p className={styles.disclaimer}>{dict.dss.briefLocked}</p>
      </footer>
    </main>
  );
}
