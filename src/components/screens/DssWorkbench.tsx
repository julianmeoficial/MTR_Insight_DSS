"use client";

import { useMemo, useState } from "react";
import { CountUp } from "@/components/motion/CountUp";
import {
  REFERENCE_AIRCRAFT,
  FORECAST_RATES,
  minPassengersForRatio,
  projectPassengers,
  capacityTriggerYear,
  buildFanSeries,
} from "@/domain/dss";
import { formatInt } from "@/lib/format";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { usePreferences } from "@/components/providers/PreferencesProvider";
import styles from "./DssWorkbench.module.css";

type Props = {
  baselinePassengers: number;
  baseYear: number;
  /** Terminal 1 declared capacity (current) */
  capacity: number;
  /** Terminal 2 capacity from the simulated expansion plan */
  expansionCapacity?: number;
};

type CapacityMode = "t1" | "t1t2";

export function DssWorkbench({
  baselinePassengers,
  baseYear,
  capacity: t1Capacity,
  expansionCapacity,
}: Props) {
  const { dict } = usePreferences();
  const tc = dict.planning;
  const [mode, setMode] = useState<CapacityMode>("t1");
  const capacity =
    mode === "t1t2" && expansionCapacity ? t1Capacity + expansionCapacity : t1Capacity;
  const [aircraftIdx, setAircraftIdx] = useState(0);
  const [ratio, setRatio] = useState(0.7);
  const [band, setBand] = useState<"low" | "base" | "high">("base");
  const aircraft = REFERENCE_AIRCRAFT[aircraftIdx]!;
  const rate = FORECAST_RATES[band];

  const minPax = useMemo(
    () => minPassengersForRatio(aircraft.seats, ratio),
    [aircraft.seats, ratio],
  );
  const p2045 = useMemo(
    () => projectPassengers(baselinePassengers, baseYear, 2045, rate),
    [baselinePassengers, baseYear, rate],
  );
  const trigger80 = useMemo(
    () =>
      capacityTriggerYear(
        baselinePassengers,
        baseYear,
        rate,
        capacity,
        0.8,
      ),
    [baselinePassengers, baseYear, rate, capacity],
  );
  const trigger90 = useMemo(
    () =>
      capacityTriggerYear(
        baselinePassengers,
        baseYear,
        rate,
        capacity,
        0.9,
      ),
    [baselinePassengers, baseYear, rate, capacity],
  );

  const triggerRows = (["t1", "t1t2"] as const)
    .filter((m) => m === "t1" || expansionCapacity)
    .map((m) => {
      const cap = m === "t1" ? t1Capacity : t1Capacity + (expansionCapacity ?? 0);
      return {
        mode: m,
        cap,
        y80: capacityTriggerYear(baselinePassengers, baseYear, rate, cap, 0.8),
        y90: capacityTriggerYear(baselinePassengers, baseYear, rate, cap, 0.9),
      };
    });

  const fan = buildFanSeries(baselinePassengers, baseYear, 2045);
  const last = fan[fan.length - 1]!;

  return (
    <div className={styles.grid}>
      <div className={styles.inputs}>
        <h2 className={styles.title}>Entradas</h2>
        <label className={styles.label}>
          Aeronave
          <select
            className={styles.select}
            value={aircraftIdx}
            onChange={(e) => setAircraftIdx(Number(e.target.value))}
          >
            {REFERENCE_AIRCRAFT.map((ac, i) => (
              <option key={ac.id} value={i}>
                {ac.label} ({ac.seats}
                {ac.assumption ? ` · ${ac.assumption}` : ""})
              </option>
            ))}
          </select>
        </label>
        <label className={styles.label}>
          Umbral ocupación ({Math.round(ratio * 100)} %)
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
        {expansionCapacity ? (
          <div className={styles.label}>
            {tc.capacityMode}
            <SegmentedControl<CapacityMode>
              ariaLabel={tc.capacityMode}
              value={mode}
              onChange={setMode}
              options={[
                { value: "t1", label: tc.t1 },
                { value: "t1t2", label: tc.t1t2 },
              ]}
            />
          </div>
        ) : null}
        <fieldset className={styles.fieldset}>
          <legend className={styles.legend}>Escenario de crecimiento</legend>
          {(
            [
              ["low", "2,5 %"],
              ["base", "3,9 %"],
              ["high", "5,5 %"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className={styles.radio}>
              <input
                type="radio"
                name="band"
                checked={band === id}
                onChange={() => setBand(id)}
              />
              {label}
            </label>
          ))}
        </fieldset>
      </div>

      <div className={styles.outputs}>
        <div className={styles.result}>
          <CornerTicks />
          <p className={styles.eyebrow}>Resultado</p>
          <p className={`num ${styles.resultValue}`}>
            {minPax} pax mín. · {aircraft.label} · {Math.round(ratio * 100)} %
          </p>
          <p className={styles.resultLine}>
            P(2045) escenario {band}:{" "}
            <span className="num">
              <CountUp value={p2045} mode="int" />
            </span>{" "}
            pax
          </p>
          <p className={styles.resultLine}>
            Disparador 80 %:{" "}
            <span className="num">{trigger80 ?? "después de 2045"}</span>
            {" · "}
            90 %:{" "}
            <span className="num">{trigger90 ?? "después de 2045"}</span>
          </p>
          <p className={styles.note}>
            Tasas globales de referencia; no son un pronóstico validado para
            Montería. Capacidad <span className="num">{formatInt(capacity)}</span>
            .
          </p>
        </div>

        <div className={styles.fan}>
          <h3 className={styles.title}>Resumen del abanico</h3>
          <dl className={styles.fanGrid}>
            <div>
              <dt className={styles.fanDt}>Bajo 2045</dt>
              <dd className="num">
                <CountUp value={last.low} mode="int" />
              </dd>
            </div>
            <div>
              <dt className={styles.fanDt}>Base 2045</dt>
              <dd className="num">
                <CountUp value={last.base} mode="int" />
              </dd>
            </div>
            <div>
              <dt className={styles.fanDt}>Alto 2045</dt>
              <dd className="num">
                <CountUp value={last.high} mode="int" />
              </dd>
            </div>
          </dl>
          <p className={styles.fanHint}>
            Utilización base vs capacidad:{" "}
            <span className="num">
              <CountUp value={last.base / capacity} mode="pct" />
            </span>
          </p>
        </div>

        {expansionCapacity ? (
          <div className={styles.fan}>
            <h3 className={styles.title}>{tc.triggersTitle}</h3>
            <table className={styles.triggerTable}>
              <thead>
                <tr>
                  <th scope="col">{tc.config}</th>
                  <th scope="col">{tc.capacity}</th>
                  <th scope="col">{"80\u00A0%"}</th>
                  <th scope="col">{"90\u00A0%"}</th>
                </tr>
              </thead>
              <tbody>
                {triggerRows.map((row) => (
                  <tr key={row.mode} data-active={row.mode === mode ? "true" : undefined}>
                    <th scope="row">{row.mode === "t1" ? tc.t1 : tc.t1t2}</th>
                    <td className="num">{formatInt(row.cap)}</td>
                    <td className="num">{row.y80 ?? tc.after2045}</td>
                    <td className="num">{row.y90 ?? tc.after2045}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className={styles.fanHint}>{tc.note}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CornerTicks() {
  return (
    <>
      <span className={`${styles.corner} ${styles.cornerTl}`} />
      <span className={`${styles.corner} ${styles.cornerTr}`} />
      <span className={`${styles.corner} ${styles.cornerBl}`} />
      <span className={`${styles.corner} ${styles.cornerBr}`} />
    </>
  );
}
