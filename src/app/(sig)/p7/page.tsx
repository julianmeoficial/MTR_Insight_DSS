import { calculateK5 } from "@/domain";
import { loadDashboardBundle } from "@/data/fixtures/load-dashboard";
import { KpiHeadline } from "@/components/kpi/KpiHeadline";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { StatusPill } from "@/components/ui/StatusPill";
import { fillTemplate, getDictionary } from "@/i18n/dictionaries";
import { formatDateIso, formatInt, formatTimeIso } from "@/lib/format";
import styles from "@/components/screens/screen.module.css";
import views from "@/components/screens/views.module.css";
import p7 from "./p7.module.css";

export const metadata = {
  title: "Calidad del dato · MTR Insight",
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

function durationLabel(startIso: string, endIso: string): string {
  const seconds = Math.max(
    0,
    Math.round((Date.parse(endIso) - Date.parse(startIso)) / 1000),
  );
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m} min ${s} s` : `${s} s`;
}

export default function P7Page() {
  const dict = getDictionary("es");
  const t = dict.screenBody.p7;
  const bundle = loadDashboardBundle();
  const k5 = calculateK5(bundle.quality);
  const ok = bundle.quality.reduce((a, q) => a + q.loadedOnTimeAndValidated, 0);
  const exp = bundle.quality.reduce((a, q) => a + q.expectedCriticalRecords, 0);
  const missing = bundle.quality.filter((q) => !q.loaded);

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={`${dict.nav.views} · P7`}
          title={dict.screens.p7.title}
          question={dict.screens.p7.question}
        />
      </div>

      <KpiHeadline code="K5" label={t.kpiLabel} value={k5.value} status={k5.status}>
        {fillTemplate(t.meta, { ok: formatInt(ok), exp: formatInt(exp) })}
      </KpiHeadline>

      <section className={views.section}>
        <h2 className={views.sectionTitle}>{t.sourcesTitle}</h2>
        <ul className={p7.sources}>
          {bundle.quality.map((q) => {
            const ratio =
              q.expectedCriticalRecords > 0
                ? q.loadedOnTimeAndValidated / q.expectedCriticalRecords
                : 0;
            return (
              <li key={q.sourceId} className={`card ${p7.source}`}>
                <div className={p7.sourceHead}>
                  <span className={views.codeMuted}>{q.sourceId}</span>
                  {q.loaded ? (
                    q.unresolvedTechnicalConflict ? (
                      <StatusPill tone="crit" label={t.conflict} />
                    ) : (
                      <StatusPill tone="ok" label={t.loaded} />
                    )
                  ) : (
                    <StatusPill tone="warn" label={t.notLoaded} />
                  )}
                </div>
                <p className={p7.sourceName}>{q.sourceName}</p>
                <div className={p7.track} aria-hidden>
                  <span
                    className={p7.fill}
                    style={{ transform: `scaleX(${ratio})` }}
                  />
                </div>
                <p className={`num ${views.meta}`}>
                  {fillTemplate(t.records, {
                    ok: formatInt(q.loadedOnTimeAndValidated),
                    exp: formatInt(q.expectedCriticalRecords),
                  })}
                  {" · "}
                  {t.owner} {q.owner}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={views.section}>
        <h2 className={views.sectionTitle}>{t.loadsTitle}</h2>
        <div className={views.tableWrap}>
          <table className={views.table}>
            <thead>
              <tr>
                <th scope="col">{t.load}</th>
                <th scope="col">{t.source}</th>
                <th scope="col" className={views.cellNum}>
                  {t.accepted}
                </th>
                <th scope="col" className={views.cellNum}>
                  {t.rejected}
                </th>
                <th scope="col" className={views.cellNum}>
                  {t.duration}
                </th>
                <th scope="col">{t.reason}</th>
                <th scope="col">{t.rules}</th>
              </tr>
            </thead>
            <tbody>
              {bundle.etlLog.loads.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className={views.codeMuted}>{row.id}</span>
                    <br />
                    <span className="num">{formatTimeIso(row.startedAt)}</span>
                  </td>
                  <td className="num">{row.sourceId}</td>
                  <td className={views.cellNum}>{formatInt(row.accepted)}</td>
                  <td className={views.cellNum}>{formatInt(row.rejected)}</td>
                  <td className={views.cellNum}>
                    {durationLabel(row.startedAt, row.finishedAt)}
                  </td>
                  <td className={views.cellMuted}>{row.reason ?? "·"}</td>
                  <td>
                    <span className={views.codeMuted}>{row.ruleVersion}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={views.section}>
        <h2 className={views.sectionTitle}>{t.conflictsTitle}</h2>
        <ul className={p7.conflicts}>
          <li className={p7.conflict}>
            <StatusPill tone="warn" label={dict.screenBody.p4.conflicting} />
            <span>
              {fillTemplate(t.runwayConflict, {
                a: formatInt(bundle.infrastructure.runway.lengthM),
                b: formatInt(bundle.infrastructure.runwayConflict.lengthM),
              })}
            </span>
          </li>
          {missing.map((q) => (
            <li key={q.sourceId} className={p7.conflict}>
              <StatusPill tone="warn" label={t.notLoaded} />
              <span>{fillTemplate(t.sourceConflict, { source: q.sourceId })}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className={views.footer}>
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
