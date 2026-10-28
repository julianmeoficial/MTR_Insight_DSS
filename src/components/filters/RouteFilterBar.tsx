"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import styles from "./filters.module.css";

type Week = { weekStart: string; label: string };

type RouteOption = { id: string; label: string };
type AircraftOption = { id: string; label: string };

type Props = {
  weeks: Week[];
  selectedWeek?: string;
  selectedOperator?: string;
  selectedAircraft?: string;
  selectedRoute?: string;
  operators?: readonly string[];
  routes?: readonly RouteOption[];
  aircraft?: readonly AircraftOption[];
  operatorLocked?: boolean;
  allRoutesLabel?: string;
  allAircraftLabel?: string;
};

const DEFAULT_AIRCRAFT: readonly AircraftOption[] = [
  { id: "Todos", label: "Todas" },
  { id: "E145", label: "ERJ-145" },
  { id: "B738", label: "B737 (supuesto)" },
  { id: "A320", label: "A320" },
  { id: "A20N", label: "A320neo" },
  { id: "AT72", label: "ATR 72 (supuesto)" },
];

export function RouteFilterBar({
  weeks,
  selectedWeek,
  selectedOperator = "Todos",
  selectedAircraft = "Todos",
  selectedRoute = "Todas",
  operators = ["Todos", "Satena", "Copa"],
  routes,
  aircraft = DEFAULT_AIRCRAFT,
  operatorLocked = false,
  allRoutesLabel = "Todas",
  allAircraftLabel = "Todas",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (
      value === "Todos" ||
      value === "Todas" ||
      value === allRoutesLabel ||
      value === allAircraftLabel ||
      !value
    ) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  const weekValue = selectedWeek ?? weeks[weeks.length - 1]?.weekStart ?? "";
  const aircraftOptions =
    aircraft[0]?.id === "Todos"
      ? [
          { id: "Todos", label: allAircraftLabel },
          ...aircraft.slice(1),
        ]
      : [{ id: "Todos", label: allAircraftLabel }, ...aircraft];

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
      {routes && routes.length > 0 ? (
        <label className={styles.label}>
          Ruta
          <select
            className={styles.select}
            value={selectedRoute}
            onChange={(e) => update("ruta", e.target.value)}
          >
            <option value="Todas">{allRoutesLabel}</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className={styles.label}>
        Operador
        <select
          className={styles.select}
          value={selectedOperator}
          disabled={operatorLocked}
          onChange={(e) => update("operador", e.target.value)}
        >
          {operators.map((op) => (
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
          {aircraftOptions.map((ac) => (
            <option key={ac.id} value={ac.id}>
              {ac.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
