import { calculateK3 } from "@/domain";
import { loadDashboardBundle } from "@/data/fixtures/load-dashboard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDictionary } from "@/i18n/dictionaries";
import { CountUp } from "@/components/motion/CountUp";
import { formatInt, formatDateIso } from "@/lib/format";
import styles from "@/components/screens/screen.module.css";

export const metadata = {
  title: "Infraestructura · MTR Insight",
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function P4Page() {
  const dict = getDictionary("es");
  const bundle = loadDashboardBundle();
  const k3 = calculateK3(bundle.capacity);
  const { runway, runwayConflict, terminal } = bundle.infrastructure;

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={dict.demo.tag}
          title={dict.screens.p4.title}
          question={dict.screens.p4.question}
        />
      </div>

      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>K3 · Utilización</p>
        <div className={styles.heroRow}>
          <p className={`num ${styles.heroValue}`}>
            <CountUp value={k3.value} mode="pct" />
          </p>
          <StatusBadge status={k3.status} />
        </div>
        <p className={styles.heroMeta}>
          <span className="num">
            {formatInt(bundle.capacity.rolling12MonthPassengers)}
          </span>{" "}
          pax (12 m) /{" "}
          <span className="num">
            {formatInt(bundle.capacity.declaredAnnualCapacity)}
          </span>{" "}
          capacidad anual declarada. Mantener por debajo del 80 %.
        </p>
      </section>

      <div className={styles.dual}>
        <article className={styles.cell}>
          <h2 className={styles.cellTitle}>Ficha técnica · pista</h2>
          <p className={`num ${styles.valueLg}`}>
            {formatInt(runway.lengthM)} m
          </p>
          <p className={styles.cellSub}>{runway.designator}</p>
          <p className={styles.disclaimer} style={{ marginTop: 12 }}>
            <span className={styles.ok}>Verificado</span> · {runway.source} ·{" "}
            {formatDateIso(runway.verifiedOn)}
          </p>
          <div className={styles.conflictBox}>
            <p style={{ fontSize: 12, color: "var(--fg)" }}>
              <span aria-hidden>◆ </span>
              <span style={{ fontWeight: 500 }}>En conflicto</span>
            </p>
            <p className="num" style={{ marginTop: 8, fontSize: 18 }}>
              {formatInt(runwayConflict.lengthM)} m
            </p>
            <p className={styles.disclaimer} style={{ marginTop: 4 }}>
              {runwayConflict.source}. {runwayConflict.note}
            </p>
          </div>
        </article>

        <article className={styles.cell}>
          <h2 className={styles.cellTitle}>Terminal</h2>
          <p className={`num ${styles.valueLg}`}>
            {formatInt(terminal.declaredAnnualCapacity)}
          </p>
          <p className={styles.cellSub}>pax / año declarados</p>
          <p className={styles.disclaimer} style={{ marginTop: 12 }}>
            <span className={styles.warn}>Pendiente</span> · {terminal.source}
          </p>
          <p className={styles.disclaimer} style={{ marginTop: 24 }}>
            Comparar longitud de pista o distancia aproximada de despegue no
            certifica idoneidad de aeronave. Cualquier cruce es ilustrativo y
            requiere revisión especializada.
          </p>
        </article>
      </div>

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
