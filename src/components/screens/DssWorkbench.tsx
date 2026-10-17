"use client";

import { useMemo, useState } from "react";
import {
  REFERENCE_AIRCRAFT,
  FORECAST_RATES,
  minPassengersForRatio,
  projectPassengers,
  capacityTriggerYear,
  buildFanSeries,
} from "@/domain/dss";
import { formatInt } from "@/lib/format";
import { CountUp } from "@/components/motion/CountUp";
import styles from "./DssWorkbench.module.css";

type Props = {
  baselinePassengers: number;
  baseYear: number;
  capacity: number;
};

export function DssWorkbench({
  baselinePassengers,
  baseYear,
  capacity,
}: Props) {
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
