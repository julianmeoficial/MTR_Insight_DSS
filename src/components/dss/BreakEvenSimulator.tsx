"use client";

import { useMemo, useState } from "react";
import {
  AIRCRAFT_CATALOG,
  RUNWAY_LENGTH_M,
  type AircraftId,
} from "@/config/aircraft";
import { dssDefaults } from "@/config/dss-defaults";
import { calculateBreakEven } from "@/domain/dss";

function formatRatio(value: number | null): string {
  if (value === null) return "—";
  return `${(value * 100).toFixed(1)} %`;
}

function formatInt(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("es-CO");
}

const COMPARISON_LABEL = {
  above_break_even: "Por encima del equilibrio",
  below_break_even: "Por debajo del equilibrio",
  at_break_even: "En el punto de equilibrio",
  unavailable: "Sin LF actual comparable",
} as const;

const STATUS_LABEL = {
  feasible: "Factible",
  infeasible: "Inviable (>100 %)",
  no_data: "Sin dato",
  cargo_n_a: "No aplica (carguero)",
} as const;

export function BreakEvenSimulator() {
  const [aircraftId, setAircraftId] = useState<AircraftId>("E145");
  const [revenuePerPax, setRevenuePerPax] = useState<number>(
    dssDefaults.revenuePerPax,
  );
  const [costPerFlight, setCostPerFlight] = useState<number>(
    dssDefaults.costPerFlight,
  );
  const [weeklyFrequencies, setWeeklyFrequencies] = useState<number>(
    dssDefaults.weeklyFrequencies,
  );
  const [currentLoadFactor, setCurrentLoadFactor] = useState<number>(
    dssDefaults.currentLoadFactor,
  );

  const result = useMemo(
    () =>
      calculateBreakEven({
        aircraftId,
        revenuePerPax,
        costPerFlight,
        weeklyFrequencies,
        currentLoadFactor,
      }),
    [
      aircraftId,
      revenuePerPax,
      costPerFlight,
      weeklyFrequencies,
      currentLoadFactor,
    ],
  );

  const selected = AIRCRAFT_CATALOG.find((a) => a.id === aircraftId)!;
  const mtrOps = AIRCRAFT_CATALOG.filter((a) => a.group === "mtr_ops");
  const expansion = AIRCRAFT_CATALOG.filter((a) => a.group === "expansion");

  return (
    <section className="space-y-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-zinc-950">
          Equilibrio por aeronave
        </h2>
        <p className="text-sm text-zinc-600">
          Modelo aeroportuario Paso 8: LF<sub>eq</sub> = costo por vuelo ÷
          (ingreso medio por pax × sillas). No usa tarifa de boleto de aerolínea.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1 text-sm sm:col-span-2">
          <span className="font-medium text-zinc-800">Aeronave</span>
          <select
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2"
            value={aircraftId}
            onChange={(e) => setAircraftId(e.target.value as AircraftId)}
          >
            <optgroup label="Operación MTR">
              {mtrOps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label} ({a.seats} sillas)
                </option>
              ))}
            </optgroup>
            <optgroup label="Expansión / otras rutas / cargo">
              {expansion.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                  {a.mode === "cargo" ? " (cargo)" : ` (${a.seats} sillas)`}
                </option>
              ))}
            </optgroup>
          </select>
          <span className="block text-xs text-zinc-500">{selected.note}</span>
          {selected.approxTakeoffDistanceM !== null ? (
            <span className="block text-xs text-amber-800">
              Distancia de despegue aprox. {selected.approxTakeoffDistanceM} m vs
              pista MTR {RUNWAY_LENGTH_M} m — ilustrativo; requiere revisión
              especializada.
            </span>
          ) : null}
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-zinc-800">
            Ingreso medio por pasajero (COP)
          </span>
          <input
            type="number"
            min={0}
            step={1000}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
            value={revenuePerPax}
            onChange={(e) => setRevenuePerPax(Number(e.target.value))}
            aria-describedby="revenue-help"
          />
          <span id="revenue-help" className="block text-xs text-zinc-500">
            T<sub>aeroportuaria</sub> + I<sub>comercial</sub>
          </span>
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-zinc-800">
            Costo por vuelo (COP)
          </span>
          <input
            type="number"
            min={0}
            step={10000}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
            value={costPerFlight}
            onChange={(e) => setCostPerFlight(Number(e.target.value))}
            aria-describedby="cost-help"
          />
          <span id="cost-help" className="block text-xs text-zinc-500">
            C<sub>fijo</sub> + C<sub>variable</sub> por frecuencia
          </span>
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-zinc-800">
            Frecuencias (vuelos / semana · sentido)
          </span>
          <input
            type="number"
            min={0}
            step={1}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
            value={weeklyFrequencies}
            onChange={(e) => setWeeklyFrequencies(Number(e.target.value))}
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="font-medium text-zinc-800">
            Load factor actual (decimal)
          </span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            className="w-full rounded-md border border-zinc-300 px-3 py-2"
            value={currentLoadFactor}
            onChange={(e) => setCurrentLoadFactor(Number(e.target.value))}
          />
        </label>
      </div>

      <div
        className="grid gap-3 rounded-md border border-zinc-100 bg-zinc-50 p-4 sm:grid-cols-2"
        aria-live="polite"
      >
        <div>
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            Estado
          </p>
          <p className="text-lg font-semibold text-zinc-950">
            {STATUS_LABEL[result.status]}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            LF equilibrio
          </p>
          <p className="text-lg font-semibold text-zinc-950">
            {formatRatio(result.lfEquilibrium)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            Pax mínimos / vuelo
          </p>
          <p className="text-lg font-semibold text-zinc-950">
            {formatInt(result.minPassengers)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            vs LF actual ({formatRatio(result.currentLoadFactor)})
          </p>
          <p className="text-lg font-semibold text-zinc-950">
            {COMPARISON_LABEL[result.comparison]}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            Sillas / semana · sentido
          </p>
          <p className="font-medium text-zinc-900">
            {formatInt(result.weeklySeatsOffered)}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
            Pax equilibrio / semana · sentido
          </p>
          <p className="font-medium text-zinc-900">
            {formatInt(result.weeklyBreakEvenPax)}
          </p>
        </div>
      </div>

      <table className="w-full text-left text-sm">
        <caption className="mb-2 text-left text-xs text-zinc-500">
          Umbrales de ocupación (ceil) para {selected.label}
        </caption>
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-600">
            <th className="py-1 pr-2 font-medium">65 % alerta</th>
            <th className="py-1 pr-2 font-medium">70 % meta 6 m</th>
            <th className="py-1 font-medium">80 % meta 12 m</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1 pr-2">{formatInt(result.thresholdPax.alert65)}</td>
            <td className="py-1 pr-2">{formatInt(result.thresholdPax.target70)}</td>
            <td className="py-1">{formatInt(result.thresholdPax.target80)}</td>
          </tr>
        </tbody>
      </table>

      <p className="text-sm text-zinc-600">{result.message}</p>
    </section>
  );
}
