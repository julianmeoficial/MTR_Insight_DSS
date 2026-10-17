import { REFERENCE_AIRCRAFT, breakEvenTable } from "@/domain/dss";
import { formatInt } from "@/lib/format";
import styles from "./charts.module.css";

export function BreakEvenBars() {
  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Pasajeros mínimos por umbral</h3>
      <p className={styles.sub}>
        ceil(ratio × sillas). B737 marcado como supuesto de escenario.
      </p>
      <ul className={styles.list}>
        {REFERENCE_AIRCRAFT.map((ac) => {
          const rows = breakEvenTable(ac);
          return (
            <li key={ac.id}>
              <p className={`num ${styles.acLabel}`}>
                {ac.label}
                {ac.assumption === "supuesto" ? (
                  <span className={styles.tag}>Supuesto</span>
                ) : null}
                {ac.assumption === "referencia" ? (
                  <span className={styles.tagMuted}>Referencia</span>
                ) : null}
              </p>
              {rows.map((row) => (
                <div key={row.ratio} className={styles.barRow}>
                  <span className={`num ${styles.barPct}`}>
                    {Math.round(row.ratio * 100)} %
                  </span>
                  <div className={styles.barTrack}>
                    <div
                      className={styles.barFill}
                      style={{
                        width: `${(row.passengers / ac.seats) * 100}%`,
                      }}
                    />
                  </div>
                  <span className={`num ${styles.barVal}`}>
                    {formatInt(row.passengers)}
                  </span>
                </div>
              ))}
            </li>
          );
        })}
      </ul>
      <p className={styles.note}>
        Compatibilidad con pista 2.297 m: ilustrativo · requiere revisión
        especializada.
      </p>
    </div>
  );
}
