import { Suspense } from "react";
import { loadSituation } from "@/data/fixtures/load-dashboard";
import { readDemoRole } from "@/application/read-demo-session";
import { canAccessRoute } from "@/domain/access";
import { SituationView } from "@/components/screens/SituationView";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ScreenLoading } from "@/components/ui/ScreenLoading";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { getDictionary } from "@/i18n/dictionaries";
import { formatDateIso } from "@/lib/format";
import styles from "@/components/screens/screen.module.css";
import views from "@/components/screens/views.module.css";

export const metadata = {
  title: "Situación actual · MTR Insight",
};

type Props = {
  searchParams: Promise<{ ruta?: string }>;
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function SituacionPage({ searchParams }: Props) {
  const dict = getDictionary("es");
  return (
    <Suspense
      fallback={<ScreenLoading label={dict.states.loading} />}
    >
      <SituacionContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SituacionContent({ searchParams }: Props) {
  const params = await searchParams;
  const role = await readDemoRole();
  const dict = getDictionary("es");
  const situation = loadSituation();

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={`${dict.nav.groupContext} · ${dict.situation.step}`}
          title={dict.situation.title}
          question={dict.situation.question}
        />
      </div>
      <SituationView
        cutoffDate={situation.cutoffDate}
        origin={situation.origin}
        airports={situation.airports}
        routes={situation.routes}
        modernizations={situation.modernizations}
        erpmData={situation.erpmData}
        initialRouteId={params.ruta}
        canValidate={role ? canAccessRoute(role, "/validador") : false}
      />
      <footer className={views.footer}>
        <ProvenanceLine
          source={situation.dataset}
          datasetVersion={situation.version}
          verificationStatus="mixed"
          lastValidated={formatDateIso(situation.cutoffDate)}
        />
        <p className={views.disclaimer}>{dict.situation.disclaimer}</p>
      </footer>
    </main>
  );
}
