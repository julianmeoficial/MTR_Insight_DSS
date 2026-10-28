import { Suspense } from "react";
import { buildDashboardReport } from "@/application/dashboard";
import { KpiTile } from "@/components/kpi/KpiTile";
import { WhyPanel } from "@/components/kpi/WhyPanel";
import { LoadFactorChart } from "@/components/charts/LoadFactorChart";
import { CompareBars } from "@/components/landing/CompareBars";
import { OperatorShareChart } from "@/components/landing/OperatorShareChart";
import { AlertList } from "@/components/AlertList";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ScreenLoading } from "@/components/ui/ScreenLoading";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { WeekPicker } from "@/components/filters/WeekPicker";
import { formatDateIso } from "@/lib/format";
import { getDictionary } from "@/i18n/dictionaries";
import styles from "@/components/screens/screen.module.css";

export const metadata = {
  title: "Tablero ejecutivo · MTR Insight",
};

type Props = {
  searchParams: Promise<{ semana?: string }>;
};

const WHY: Record<
  string,
  { formula: string; threshold: string; num?: string; den?: string }
> = {
  K1: {
    formula: "Σ embarcados / Σ sillas ofrecidas",
    threshold: "≥70 % meta · ≥65 % atención · <65 % crítico",
    num: "Pasajeros embarcados",
    den: "Sillas ofrecidas",
  },
  K2: {
    formula: "Requisitos con evidencia válida / aplicables",
    threshold: "Críticos vencidos → crítico · <90 % trimestral → crítico",
  },
  K3: {
    formula: "Pasajeros 12 meses / capacidad anual declarada",
    threshold: "<80 % meta · ≥80 % atención · ≥90 % crítico",
  },
  K4: {
    formula: "Salidas internacionales MTR / viajeros zona",
    threshold: "≥20 % meta · ≥10 % atención · <10 % crítico",
  },
  K5: {
    formula: "Críticos a tiempo y validados / esperados",
    threshold: "≥98 % meta · ≥95 % atención · <95 % crítico",
  },
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function P1Page({ searchParams }: Props) {
  const dict = getDictionary("es");
  return (
    <Suspense
      fallback={<ScreenLoading label={dict.states.loading} />}
    >
      <P1Content searchParams={searchParams} />
    </Suspense>
  );
}

async function P1Content({ searchParams }: Props) {
  const params = await searchParams;
  const report = buildDashboardReport({ weekStart: params.semana });
  const dict = getDictionary("es");

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={`${dict.nav.views} · P1`}
          title={dict.screens.p1.title}
          question={dict.screens.p1.question}
        >
          <WeekPicker weeks={report.weeks} selected={params.semana} />
        </ScreenHeader>
      </div>

      <section className={styles.kpiRow} aria-label={dict.kpisTitle}>
        {report.tiles.map((tile, i) => (
          <div key={tile.kpiId} className={styles.kpiCell}>
            <KpiTile
              tile={tile}
              index={i}
              provenanceMeta={`${tile.subtitle} · ${dict.kpi.validated} ${report.lastValidatedLabel}`}
            />
          </div>
        ))}
      </section>

      <div className={styles.split}>
        <div className={styles.splitPrimary}>
          <LoadFactorChart
            series={report.series}
            title={dict.landing.lfChartTitle}
          />
        </div>
        <div className={styles.splitSecondary}>
          <P1SideAnalytics
            tiles={report.tiles}
            series={report.series}
            shareTitle={dict.landing.shareTitle}
            compareTitle={dict.landing.compareTitle}
          />
          {report.tiles[0] && WHY.K1 ? (
            <WhyPanel
              tile={report.tiles[0]}
              formula={WHY.K1.formula}
              numerator={WHY.K1.num}
              denominator={WHY.K1.den}
              thresholdBand={WHY.K1.threshold}
              ruleVersion="thresholds-1.0"
              source={report.meta.fuente}
              validated={report.lastValidatedLabel}
            />
          ) : null}
          <RequirementsPanel
            items={report.criticalRequirements}
            copaNote={report.copaPermitStatus}
          />
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{dict.alerts.title}</h2>
        <AlertList alerts={report.alerts} />
      </section>

      <footer className={styles.footer}>
        <ProvenanceLine
          source={report.meta.fuente}
          datasetVersion={report.meta.version}
          verificationStatus={report.meta.verificationStatus}
          lastValidated={report.lastValidatedLabel}
        />
        <p className={styles.disclaimer}>{dict.landing.footerDisclaimer}</p>
      </footer>
    </main>
  );
}

function P1SideAnalytics({
  tiles,
  series,
  shareTitle,
  compareTitle,
}: {
  tiles: ReturnType<typeof buildDashboardReport>["tiles"];
  series: ReturnType<typeof buildDashboardReport>["series"];
  shareTitle: string;
  compareTitle: string;
}) {
  const paxByOp = new Map<string, number>();
  for (const row of series) {
    paxByOp.set(row.operator, (paxByOp.get(row.operator) ?? 0) + row.passengers);
  }
  const slices = [...paxByOp.entries()].map(([label, value], i) => ({
    id: label,
    label,
    value,
    color: i === 0 ? "var(--series-1)" : "var(--series-2)",
  }));
  const compareRows = tiles.slice(0, 4).map((tile, i) => ({
    id: tile.kpiId,
    label: tile.title,
    value: tile.value,
    target: tile.kpiId === "K1" ? 0.7 : tile.kpiId === "K3" ? 0.8 : 0.9,
    color: `var(--series-${(i % 5) + 1})`,
  }));

  return (
    <div className={styles.analyticsStack}>
      {slices.length > 0 ? (
        <OperatorShareChart slices={slices} title={shareTitle} />
      ) : null}
      <CompareBars title={compareTitle} rows={compareRows} />
    </div>
  );
}

function RequirementsPanel({
  items,
  copaNote,
}: {
  items: {
    id: string;
    authority: string;
    dueDate: string;
    critical: boolean;
    satisfied: boolean;
  }[];
  copaNote: string;
}) {
  const dict = getDictionary("es");
  const upcoming = [...items]
    .filter((r) => r.critical)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return (
    <div className={styles.cell}>
      <h3 className={styles.cellTitle}>{dict.screens.p3.title}</h3>
      <ul className={styles.reqList}>
        {upcoming.map((r) => (
          <li key={r.id} className={styles.listRow}>
            <div>
              <p className={styles.reqId}>{r.id}</p>
              <p className={styles.muted}>{r.authority}</p>
            </div>
            <div className={styles.reqRight}>
              <p className="num">{formatDateIso(r.dueDate)}</p>
              <p className={r.satisfied ? styles.ok : styles.warn}>
                {r.satisfied ? dict.status.ok : dict.status.warn}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className={styles.disclaimer}>{copaNote}</p>
    </div>
  );
}
