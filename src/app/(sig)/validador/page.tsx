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
  const bundle = loadDashboardBundle();
  const { runway, terminal } = bundle.infrastructure;
  const { rolling12MonthPassengers: pax, declaredAnnualCapacity: cap } =
    bundle.capacity;
  const headroom80 = cap * 0.8 - pax;
  const headroom90 = cap * 0.9 - pax;

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={dict.nav.groupDss}
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
        aerodromeSidecar={{
          utilizationRatio: cap > 0 ? pax / cap : null,
          headroom80,
          headroom90,
          h1Operations: bundle.semesterH1.operations,
          cargoOperators: bundle.cargo.operators.map((op) => ({
            label: op.label,
            warehouses: op.warehouses,
          })),
          expansionNote: dict.aerodrome.expansionNote,
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
