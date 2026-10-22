import { calculateK4 } from "@/domain";
import { loadDashboardBundle } from "@/data/fixtures/load-dashboard";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getDictionary } from "@/i18n/dictionaries";
import { CountUp } from "@/components/motion/CountUp";
import { formatPct, formatDateIso } from "@/lib/format";
import { cn } from "@/lib/cn";
import styles from "@/components/screens/screen.module.css";
import chartStyles from "@/components/charts/charts.module.css";

export const metadata = {
  title: "Demanda regional · MTR Insight",
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function P5Page() {
  const dict = getDictionary("es");
  const bundle = loadDashboardBundle();
  const k4 = calculateK4(bundle.demand);
  const { competitors, evidenceChecklist, catchment } = bundle.competitors;

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={dict.demo.tag}
          title={dict.screens.p5.title}
          question={dict.screens.p5.question}
        />
      </div>

      <section className={styles.hero}>
        <p className={styles.heroEyebrow}>K4 · Captura regional</p>
        <div className={styles.heroRow}>
          <p className={`num ${styles.heroValue}`}>
            <CountUp value={k4.value} mode="pct" />
          </p>
          <StatusBadge status={k4.status} />
        </div>
        <p className={styles.heroMeta}>Meta ≥ 20 %. Zona: {catchment}.</p>
      </section>

      <div className={styles.dual}>
        <figure className={styles.cell}>
          <figcaption className={styles.cellTitle}>
            Diagrama MTR → PTY
          </figcaption>
          <svg
            viewBox="0 0 320 160"
            className={styles.svgChart}
            style={{ marginTop: 16 }}
            role="img"
            aria-label="Arco de ruta MTR a PTY en mapa plano"
          >
            <circle cx="48" cy="100" r="6" fill="var(--series-1)" />
            <text
              x="48"
              y="124"
              textAnchor="middle"
              className={`num ${chartStyles.chartTextFg}`}
              fontSize="11"
            >
              MTR
            </text>
            <circle cx="272" cy="56" r="6" fill="var(--series-2)" />
            <text
              x="272"
              y="44"
              textAnchor="middle"
              className={`num ${chartStyles.chartTextFg}`}
              fontSize="11"
            >
              PTY
            </text>
            <path
              d="M54 96 C 140 20, 200 20, 266 58"
              fill="none"
              stroke="var(--fg-muted)"
              strokeWidth="1"
            />
            <text
              x="160"
              y="148"
              textAnchor="middle"
              className={chartStyles.chartText}
              fontSize="10"
            >
              Mapa plano · sin proyección · ilustrativo
            </text>
          </svg>
        </figure>

        <div className={styles.cell}>
          <h2 className={styles.cellTitle}>
            Competidores (participación ilustrativa)
          </h2>
          <ul style={{ marginTop: 16 }}>
            {competitors.map((c) => (
              <li key={c.airport} style={{ marginBottom: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  <span>
                    {c.label}{" "}
                    <span className="num" style={{ color: "var(--fg-subtle)" }}>
                      {c.airport}
                    </span>
                  </span>
                  <span className="num">{formatPct(c.sharePct)}</span>
                </div>
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{ width: `${c.sharePct * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitleSm}>Paquete de evidencia</h2>
        <ul className={styles.evidenceList}>
          {evidenceChecklist.map((item) => (
            <li key={item.id} className={styles.evidenceItem}>
              <span
                className={cn(styles.check, item.done && styles.checkDone)}
                aria-hidden
              />
              <span>
                <span
                  className="num"
                  style={{ fontSize: 12, color: "var(--fg-subtle)" }}
                >
                  {item.id}
                </span>
                <span style={{ marginLeft: 8 }}>{item.label}</span>
              </span>
            </li>
          ))}
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
