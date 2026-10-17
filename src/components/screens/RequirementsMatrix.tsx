"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import styles from "./RequirementsMatrix.module.css";

export type RequirementRow = {
  requirementId: string;
  authority: string;
  dueDate: string;
  dueLabel: string;
  critical: boolean;
  completedFlag: boolean;
  evidenceId: string | null;
  approvalDate: string | null;
  approvalLabel: string | null;
  days: number;
  satisfied: boolean;
};

export function RequirementsMatrix({ rows }: { rows: RequirementRow[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = rows.find((r) => r.requirementId === selected) ?? null;

  return (
    <div className={styles.wrap}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Requisito</th>
              <th>Autoridad</th>
              <th>Vence</th>
              <th>Aviso</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.requirementId}
                onClick={() => setSelected(r.requirementId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelected(r.requirementId);
                  }
                }}
                tabIndex={0}
              >
                <td className="num">{r.requirementId}</td>
                <td>{r.authority}</td>
                <td className="num">{r.dueLabel}</td>
                <td>
                  <CountdownChips days={r.days} />
                </td>
                <td>
                  {r.satisfied ? (
                    <span className={styles.ok}>Con evidencia</span>
                  ) : (
                    <span className={styles.warn}>Pendiente</span>
                  )}
                  {r.critical ? (
                    <span className={styles.critical}>Crítico</span>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {active ? (
        <aside className={styles.drawer} aria-label="Evidencia">
          <h2 className={styles.drawerTitle}>
            Evidencia · {active.requirementId}
          </h2>
          <dl className={styles.drawerGrid}>
            <div>
              <dt className={styles.dt}>Identificador</dt>
              <dd className="num">{active.evidenceId ?? "-"}</dd>
            </div>
            <div>
              <dt className={styles.dt}>Aprobación</dt>
              <dd className="num">{active.approvalLabel ?? "Sin fecha"}</dd>
            </div>
            <div>
              <dt className={styles.dt}>Bandera completado</dt>
              <dd>
                {active.completedFlag ? "Sí" : "No"} (no basta sin evidencia)
              </dd>
            </div>
          </dl>
        </aside>
      ) : (
        <p className={styles.hint}>
          Selecciona una fila para abrir el cajón de evidencia.
        </p>
      )}
    </div>
  );
}

function CountdownChips({ days }: { days: number }) {
  const chips = [30, 15, 7] as const;
  return (
    <span className={styles.chips}>
      {chips.map((c) => {
        const active = days <= c && days >= 0;
        const crit = c === 7 && active;
        return (
          <span
            key={c}
            className={cn(
              `num ${styles.chip}`,
              crit && styles.chipCrit,
              !crit && active && styles.chipWarn,
            )}
          >
            {c} d
          </span>
        );
      })}
      {days < 0 ? (
        <span className={`num ${styles.chip} ${styles.chipCrit}`}>
          Vencido
        </span>
      ) : null}
    </span>
  );
}
