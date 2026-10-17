import { calculateK5 } from "@/domain";
import { loadDashboardBundle } from "@/data/fixtures/load-dashboard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDictionary } from "@/i18n/dictionaries";
import { CountUp } from "@/components/motion/CountUp";
import { formatDateIso, formatInt } from "@/lib/format";
import { cn } from "@/lib/cn";
import styles from "@/components/screens/screen.module.css";

export const metadata = {
  title: "Calidad del dato · MTR Insight",
};

export default function P7Page() {
  const dict = getDictionary("es");
  const bundle = loadDashboardBundle();
  const k5 = calculateK5(bundle.quality);

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={dict.demo.tag}
          title={dict.screens.p7.title}
          question={dict.screens.p7.question}
        />
      </div>

      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>K5 · Integridad</p>
        <div className={styles.heroRow}>
          <p className={`num ${styles.heroValue}`}>
            <CountUp value={k5.value} mode="pct" />
          </p>
          <StatusBadge status={k5.status} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitleSm}>Estado de fuentes</h2>
        <ol className={styles.timeline}>
          {bundle.quality.map((q) => (
            <li key={q.sourceId} className={styles.timelineItem}>
              <span
                className={cn(
                  styles.timelineDot,
                  q.loaded
                    ? q.unresolvedTechnicalConflict
                      ? styles.timelineDotCrit
                      : styles.timelineDotOk
                    : styles.timelineDotWarn,
                )}
                aria-hidden
              />
              <p
                className="num"
                style={{ fontSize: 12, color: "var(--fg-subtle)" }}
              >
                {q.sourceId}
              </p>
              <p style={{ fontSize: 14, fontWeight: 500 }}>{q.sourceName}</p>
              <p
                className="num"
                style={{ fontSize: 12, color: "var(--fg-muted)" }}
              >
                {formatInt(q.loadedOnTimeAndValidated)} /{" "}
                {formatInt(q.expectedCriticalRecords)} · dueño {q.owner}
                {q.unresolvedTechnicalConflict ? " · conflicto técnico" : ""}
                {!q.loaded ? " · no cargada" : ""}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitleSm}>Bitácora de carga</h2>
        <div className={styles.tableWrap}>
          <table className={styles.table} style={{ minWidth: "36rem" }}>
            <thead>
              <tr>
                <th>Id</th>
                <th>Fuente</th>
                <th>Aceptadas</th>
                <th>Rechazadas</th>
                <th>Motivo</th>
                <th>Reglas</th>
              </tr>
            </thead>
            <tbody>
              {bundle.etlLog.loads.map((row) => (
                <tr key={row.id}>
                  <td className="num" style={{ fontSize: 12 }}>
                    {row.id}
                  </td>
                  <td className="num">{row.sourceId}</td>
                  <td className="num">{formatInt(row.accepted)}</td>
                  <td className="num">{formatInt(row.rejected)}</td>
                  <td style={{ fontSize: 12, color: "var(--fg-muted)" }}>
                    {row.reason ?? "-"}
                  </td>
                  <td className="num" style={{ fontSize: 12 }}>
                    {row.ruleVersion}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitleSm}>Conflictos abiertos</h2>
        <ul className={styles.muted}>
          <li style={{ marginBottom: 8 }}>
            ◆ Pista: {formatInt(bundle.infrastructure.runway.lengthM)} m
            (verificado) frente a{" "}
            {formatInt(bundle.infrastructure.runwayConflict.lengthM)} m (no
            adoptado). Ver P4.
          </li>
          <li>
            Fuente MANIFEST-CMP sin carga en el corte demo (dispara alerta
            SOURCE_NOT_LOADED).
          </li>
        </ul>
      </section>

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
