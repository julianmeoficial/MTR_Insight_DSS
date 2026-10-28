import { Suspense } from "react";
import Link from "next/link";
import { buildDashboardReport } from "@/application/dashboard";
import { parseOpsScope } from "@/domain";
import { operatorColor } from "@/config/operators";
import { KpiTile } from "@/components/kpi/KpiTile";
import { WhyPanel } from "@/components/kpi/WhyPanel";
import { LoadFactorChart } from "@/components/charts/LoadFactorChart";
import { OperatorShareBars } from "@/components/charts/OperatorShareBars";
import { OperatorShareChart } from "@/components/landing/OperatorShareChart";
import { CompareBars } from "@/components/landing/CompareBars";
import { AlertList } from "@/components/AlertList";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ScreenLoading } from "@/components/ui/ScreenLoading";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { WeekPicker } from "@/components/filters/WeekPicker";
import { OpsScopeSwitch } from "@/components/filters/OpsScopeSwitch";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CountUp } from "@/components/motion/CountUp";
import { formatDateIso, formatInt, formatPct } from "@/lib/format";
import { getDictionary } from "@/i18n/dictionaries";
import styles from "@/components/screens/screen.module.css";
import views from "@/components/screens/views.module.css";

export const metadata = {
  title: "Tablero ejecutivo · MTR Insight",
};

type Props = {
  searchParams: Promise<{ semana?: string; op?: string }>;
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function P1Page({ searchParams }: Props) {
  const dict = getDictionary("es");
  return (
    <Suspense fallback={<ScreenLoading label={dict.states.loading} />}>
      <P1Content searchParams={searchParams} />
    </Suspense>
  );
}

async function P1Content({ searchParams }: Props) {
  const params = await searchParams;
  const opsScope = parseOpsScope(params.op);
  const report = buildDashboardReport({
    weekStart: params.semana,
    opsScope,
  });
  const dict = getDictionary("es");
  const t = dict.screens.p1;

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={`${dict.nav.views} · P1`}
          title={dict.screens.p1.title}
          question={dict.screens.p1.question}
        >
          <OpsScopeSwitch
            value={opsScope}
            nacionalLabel={t.opsNacional}
            internacionalLabel={t.opsInternacional}
            ariaLabel={t.opsScopeAria}
          />
          <WeekPicker weeks={report.weeks} selected={params.semana} />
        </ScreenHeader>
      </div>

      {report.semesterH1 ? (
        <section className={views.statStrip} aria-label={t.h1Title}>
          <div className={views.stat}>
            <span className={views.statLabel}>{t.h1Title}</span>
            <span className={views.hint}>{report.semesterH1.sourceLabel}</span>
            <span className={views.hint}>{t.h1Note}</span>
          </div>
          <div className={views.stat}>
            <span className={views.statLabel}>{t.h1Pax}</span>
            <span className={views.statValue}>
              <CountUp value={report.semesterH1.passengers} mode="int" />
            </span>
          </div>
          <div className={views.stat}>
            <span className={views.statLabel}>{t.h1Ops}</span>
            <span className={views.statValue}>
              <CountUp value={report.semesterH1.operations} mode="int" />
            </span>
          </div>
        </section>
      ) : null}

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

      {opsScope === "nacional" ? (
        <p className={views.hint} style={{ paddingInline: "var(--s-4)" }}>
          {t.k4ContextNote}
        </p>
      ) : null}

      <div className={styles.split}>
        <div className={styles.splitPrimary}>
          <LoadFactorChart
            series={report.series}
            title={dict.landing.lfChartTitle}
            hint={
              opsScope === "nacional" ? t.lfHintNacional : t.lfHintInternacional
            }
          />
          {opsScope === "nacional" && report.routeRows.length > 0 ? (
            <section className={styles.section}>
              <h2 className={styles.sectionTitleSm}>{t.routeTableTitle}</h2>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>{t.routeCol}</th>
                      <th>{t.cityCol}</th>
                      <th>{t.lfCol}</th>
                      <th>{t.paxCol}</th>
                      <th>{t.seatsCol}</th>
                      <th>{t.statusCol}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.routeRows.map((row) => (
                      <tr key={row.route}>
                        <td>
                          <Link
                            href={`/p2?op=nacional&ruta=${encodeURIComponent(row.route)}`}
                            className={styles.tableLink}
                          >
                            {row.route}
                          </Link>
                        </td>
                        <td>{row.city}</td>
                        <td className="num">{formatPct(row.value)}</td>
                        <td className="num">{formatInt(row.passengers)}</td>
                        <td className="num">{formatInt(row.seats)}</td>
                        <td>
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </div>
        <div className={styles.splitSecondary}>
          <P1SideAnalytics
            tiles={report.tiles}
            series={report.series}
            shareTitle={dict.landing.shareTitle}
            compareTitle={dict.landing.compareTitle}
            useBars={opsScope === "nacional"}
          />
          {report.tiles[0] ? (
            <WhyPanel
              tile={report.tiles[0]}
              formula={t.whyFormula}
              numerator={t.whyNum}
              denominator={t.whyDen}
              thresholdBand={t.whyThreshold}
              ruleVersion="thresholds-1.0"
              source={report.meta.fuente}
              validated={report.lastValidatedLabel}
            />
          ) : null}
          {opsScope === "internacional" ? (
            <RequirementsPanel
              items={report.criticalRequirements}
              copaNote={report.copaPermitStatus}
            />
          ) : null}
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
  useBars,
}: {
  tiles: ReturnType<typeof buildDashboardReport>["tiles"];
  series: ReturnType<typeof buildDashboardReport>["series"];
  shareTitle: string;
  compareTitle: string;
  useBars: boolean;
}) {
  const paxByOp = new Map<string, number>();
  for (const row of series) {
    paxByOp.set(row.operator, (paxByOp.get(row.operator) ?? 0) + row.passengers);
  }
  const slices = [...paxByOp.entries()].map(([label, value]) => ({
    id: label,
    label,
    value,
    color: operatorColor(label),
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
        useBars || slices.length > 4 ? (
          <OperatorShareBars bars={slices} title={shareTitle} />
        ) : (
          <OperatorShareChart slices={slices} title={shareTitle} />
        )
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
  copaNote: string | null;
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
      {copaNote ? <p className={styles.disclaimer}>{copaNote}</p> : null}
    </div>
  );
}
