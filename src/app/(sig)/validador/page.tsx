import { Suspense } from "react";
import { loadDashboardBundle, loadSituation } from "@/data/fixtures/load-dashboard";
import { ValidatorView } from "@/components/screens/ValidatorView";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ScreenLoading } from "@/components/ui/ScreenLoading";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDateIso } from "@/lib/format";
import styles from "@/components/screens/screen.module.css";
import views from "@/components/screens/views.module.css";

export const metadata = {
  title: "Validador de escenarios · MTR Insight",
};

type Props = {
  searchParams: Promise<{
    ruta?: string;
    aeronave?: string;
    escenario?: string;
    vista?: string;
    infra?: string;
  }>;
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function ValidadorPage({ searchParams }: Props) {
  const dict = getDictionary("es");
  return (
    <Suspense
      fallback={<ScreenLoading label={dict.states.loading} />}
    >
      <ValidadorContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ValidadorContent({ searchParams }: Props) {
  const params = await searchParams;
  const dict = getDictionary("es");
  const situation = loadSituation();
  const { runway, terminal } = loadDashboardBundle().infrastructure;

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={`${dict.nav.groupDss} · ${dict.validator.step}`}
          title={dict.validator.title}
          question={dict.validator.question}
        />
      </div>
      <ValidatorView
        origin={situation.origin}
        airports={situation.airports}
        routes={situation.routes}
        constraints={situation.constraints}
        sources={{
          runway: `${runway.source} · ${formatDateIso(runway.verifiedOn)}`,
          capacity: terminal.source,
        }}
        initial={{
          routeId: params.ruta,
          aircraftId: params.aeronave,
          scenarioId: params.escenario,
          perspective: params.vista,
          infra: params.infra,
        }}
      />
      <footer className={views.footer}>
        <ProvenanceLine
          source={situation.dataset}
          datasetVersion={situation.version}
          verificationStatus="simulated"
          lastValidated={formatDateIso(situation.cutoffDate)}
        />
        <p className={views.disclaimer}>{dict.validator.disclaimer}</p>
      </footer>
    </main>
  );
}
