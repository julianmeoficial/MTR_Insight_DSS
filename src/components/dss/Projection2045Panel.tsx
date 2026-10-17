"use client";

import { useMemo } from "react";
import { projectDemand2045, sampleProjectionYears } from "@/domain/dss";

function formatPax(n: number): string {
  return Math.round(n).toLocaleString("es-CO");
}

function formatPct(n: number): string {
  return `${(n * 100).toFixed(1)} %`;
}

export function Projection2045Panel() {
  const projection = useMemo(() => projectDemand2045(), []);
  const years = useMemo(
    () => sampleProjectionYears(projection),
    [projection],
  );

  return (
    <section className="space-y-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold text-zinc-950">
          Proyección 2045 · capacidad terminal
        </h2>
        <p className="text-sm text-zinc-600">
          P(t) = P({projection.baseYear}) × (1 + r)^(t − {projection.baseYear}).
          Capacidad declarada:{" "}
          {formatPax(projection.declaredAnnualCapacity)} pax/año. Baseline{" "}
          {formatPax(projection.baselinePassengers)} (
          {formatPct(projection.baselineUtilization)} utilización).
        </p>
      </header>

      {projection.baselineUtilization >= 0.8 ? (
        <p
          className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          role="status"
        >
          Disparador 80 % <strong>ya cumplido</strong> en la línea base (
          {formatPct(projection.baselineUtilization)}). Planear ampliación
          (PG-11 / R16).
          {projection.baselineUtilization >= 0.9
            ? " El disparador 90 % también está cumplido."
            : null}
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <caption className="mb-2 text-left text-xs text-zinc-500">
            Pasajeros proyectados por escenario (muestra de años)
          </caption>
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-600">
              <th className="py-2 pr-3 font-medium">Escenario</th>
              {years.map((y) => (
                <th key={y} className="py-2 pr-3 font-medium">
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projection.scenarios.map((scenario) => (
              <tr key={scenario.id} className="border-b border-zinc-100">
                <td className="py-2 pr-3 font-medium text-zinc-900">
                  {scenario.label}
                </td>
                {years.map((y) => {
                  const point = scenario.series.find((p) => p.year === y);
                  return (
                    <td key={y} className="py-2 pr-3 tabular-nums text-zinc-700">
                      {point ? formatPax(point.passengers) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900">
          Disparadores de capacidad (terminal · R16)
        </h3>
        {projection.scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="rounded-md border border-zinc-100 bg-zinc-50 p-3"
          >
            <p className="mb-2 text-sm font-medium text-zinc-900">
              {scenario.label}
            </p>
            <ul className="space-y-2">
              {scenario.triggers.map((trigger) => {
                const util2045 =
                  scenario.series[scenario.series.length - 1]?.utilization ?? 0;
                const barWidth = Math.min(100, Math.round(util2045 * 100));
                return (
                  <li key={trigger.level} className="text-sm text-zinc-700">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span>{trigger.label}</span>
                      <span className="font-medium text-zinc-900">
                        {trigger.alreadyMet
                          ? "Ya cumplido en baseline"
                          : trigger.year
                            ? `Año estimado: ${trigger.year}`
                            : "No cruza en el horizonte"}
                      </span>
                    </div>
                    <div
                      className="mt-1 h-2 w-full overflow-hidden rounded bg-zinc-200"
                      role="img"
                      aria-label={`Utilización 2045 ${formatPct(util2045)}`}
                    >
                      <div
                        className="h-full rounded bg-zinc-700"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      Utilización 2045: {formatPct(util2045)} · {trigger.policyRef}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-zinc-500">
        {projection.assumptionNote}
      </p>
    </section>
  );
}
