"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import styles from "./filters.module.css";

type Week = { weekStart: string; label: string };

type Props = {
  weeks: Week[];
  selectedWeek?: string;
  selectedOperator?: string;
  selectedAircraft?: string;
};

const OPERATORS = ["Todos", "Satena", "Copa"] as const;
const AIRCRAFT = [
  { id: "Todos", label: "Todas" },
  { id: "E145", label: "ERJ-145" },
  { id: "B738", label: "B737 (supuesto)" },
  { id: "J32", label: "J32 (referencia)" },
] as const;

export function RouteFilterBar({
  weeks,
  selectedWeek,
  selectedOperator = "Todos",
  selectedAircraft = "Todos",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (value === "Todos" || !value) next.delete(key);
    else next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
  }

  const weekValue = selectedWeek ?? weeks[weeks.length - 1]?.weekStart ?? "";

  return (
    <div className={styles.bar} role="group" aria-label="Filtros de ruta">
      <label className={styles.label}>
        Semana
        <select
          className={styles.select}
          value={weekValue}
          onChange={(e) => update("semana", e.target.value)}
        >
          {weeks.map((w) => (
            <option key={w.weekStart} value={w.weekStart}>
              {w.label}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.label}>
        Operador
        <select
          className={styles.select}
          value={selectedOperator}
          onChange={(e) => update("operador", e.target.value)}
        >
          {OPERATORS.map((op) => (
            <option key={op} value={op}>
              {op}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.label}>
        Aeronave
        <select
          className={styles.select}
          value={selectedAircraft}
          onChange={(e) => update("aeronave", e.target.value)}
        >
          {AIRCRAFT.map((ac) => (
            <option key={ac.id} value={ac.id}>
              {ac.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
