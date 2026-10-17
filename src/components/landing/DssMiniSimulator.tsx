"use client";

import { useMemo, useState } from "react";
import {
  REFERENCE_AIRCRAFT,
  minPassengersForRatio,
} from "@/domain/dss";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import styles from "./DssMiniSimulator.module.css";

export function DssMiniSimulator() {
  const { dict } = usePreferences();
  const [aircraftIdx, setAircraftIdx] = useState(0);
  const [ratio, setRatio] = useState(0.7);
  const aircraft = REFERENCE_AIRCRAFT[aircraftIdx]!;

  const minPax = useMemo(
    () => minPassengersForRatio(aircraft.seats, ratio),
    [aircraft.seats, ratio],
  );

  const resultLine = dict.dssMini.result
    .replace("{pax}", String(minPax))
    .replace("{aircraft}", aircraft.label)
    .replace("{pct}", String(Math.round(ratio * 100)));

  return (
    <div className={styles.box}>
      <p className={styles.label}>{dict.chapters.simulate.title}</p>
      <div className={styles.grid}>
        <label className={styles.field}>
          {dict.dssMini.aircraft}
          <select
            className={styles.control}
            value={aircraftIdx}
            onChange={(e) => setAircraftIdx(Number(e.target.value))}
          >
            {REFERENCE_AIRCRAFT.map((ac, i) => (
              <option key={ac.id} value={i}>
                {ac.label}
                {ac.assumption === "supuesto"
                  ? ` · ${dict.dssMini.assumption}`
                  : ac.assumption === "referencia"
                    ? ` · ${dict.dssMini.reference}`
                    : ""}{" "}
                ({ac.seats})
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          {dict.dssMini.occupancy} ({Math.round(ratio * 100)} %)
          <input
            type="range"
            min={0.5}
            max={0.9}
            step={0.01}
            value={ratio}
            onChange={(e) => setRatio(Number(e.target.value))}
            className={styles.range}
          />
        </label>
      </div>
      <p className={`num ${styles.result}`}>{resultLine}</p>
      <p className={styles.hint}>{dict.dssMini.hint}</p>
    </div>
  );
}
