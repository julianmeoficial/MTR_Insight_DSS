import { Suspense } from "react";
import {
  buildDashboardReport,
  getFilteredK1Hero,
} from "@/application/dashboard";
import { readDemoRole } from "@/application/read-demo-session";
import { LoadFactorChart } from "@/components/charts/LoadFactorChart";
import { SeatUnitChart } from "@/components/charts/SeatUnitChart";
import { BreakEvenBars } from "@/components/charts/BreakEvenBars";
import { RouteFilterBar } from "@/components/filters/RouteFilterBar";
import { KpiHero } from "@/components/kpi/KpiHero";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { ContextPanel } from "@/components/ui/ContextPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPct, formatInt } from "@/lib/format";
import { getDictionary } from "@/i18n/dictionaries";
import { canExport, resolveOperatorFilter, visibleOperators } from "@/domain/access";
import type { TrafficLight } from "@/domain/types";
import { cn } from "@/lib/cn";
import styles from "@/components/screens/screen.module.css";

export const metadata = {
  title: "Rutas y ocupación · MTR Insight",
};

type Props = {
  searchParams: Promise<{
    semana?: string;
    operador?: string;
    aeronave?: string;
  }>;
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function P2Page({ searchParams }: Props) {
  return (
    <Suspense
      fallback={
        <main className={styles.main}>
          <div className={styles.pad}>
            <p className={styles.muted} role="status">
              Cargando rutas…
            </p>
          </div>
        </main>
      }
    >
      <P2Content searchParams={searchParams} />
    </Suspense>
  );
}

async function P2Content({ searchParams }: Props) {
  const dict = getDictionary("es");
  const params = await searchParams;
  const role = await readDemoRole();
  const operator = role
    ? resolveOperatorFilter(role, params.operador)
    : (params.operador ?? "Todos");
  const operators = role ? visibleOperators(role) : ["Todos", "Satena", "Copa"];
  const exportNote = role && canExport(role)
    ? dict.access.exportFullSig
    : dict.access.exportDenied;
  const aircraft = params.aeronave ?? "Todos";
  const report = buildDashboardReport({
    weekStart: params.semana,
    operator,
    aircraftType: aircraft,
  });

  const selectedWeek =
    params.semana && report.weeks.some((w) => w.weekStart === params.semana)
      ? params.semana
      : report.weeks[report.weeks.length - 1]?.weekStart;

  const hero = getFilteredK1Hero({
    operator,
    aircraftType: aircraft,
    weekStart: selectedWeek,
  });
  const vsBe = hero.value === null ? null : hero.value - 0.7;

  const unitSeats = aircraft === "B738" ? 160 : aircraft === "J32" ? 19 : 50;
  const unitFlights = report.series.filter(
    (s) =>
      s.weekStart === selectedWeek &&
      (operator === "Todos" || s.operator === operator) &&
      (aircraft === "Todos" || s.aircraftType === aircraft),
  );
  const unitPax = unitFlights.reduce((a, s) => a + s.passengers, 0);
  const unitSeatSum = unitFlights.reduce((a, s) => a + s.seats, 0);
  const boardedForMap =
    unitSeatSum > 0
      ? Math.round((unitPax / unitSeatSum) * unitSeats)
      : Math.min(unitSeats, unitPax);

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={dict.demo.tag}
          title={dict.screens.p2.title}
          question={dict.screens.p2.question}
        />
      </div>

      <RouteFilterBar
        weeks={report.weeks}
        selectedWeek={selectedWeek}
        selectedOperator={operator}
        selectedAircraft={aircraft}
        operators={operators}
        operatorLocked={operators.length === 1}
      />

      <KpiHero
        value={hero.value}
        status={hero.status}
        label={`K1 · LOAD FACTOR · ${operator} · ${aircraft === "Todos" ? "Todas las aeronaves" : aircraft}`}
        vsBreakEvenPp={vsBe}
      />

      <div className={styles.split}>
        <div className={styles.splitPrimary}>
          <LoadFactorChart
            series={report.series}
            title="Serie semanal de load factor"
          />
        </div>
        <div className={cn(styles.splitSecondary, styles.splitStack)}>
          <ContextPanel>
            <p>
              Compara ocupación frente a umbrales 65 % / 70 % y pasajeros
              mínimos por tipo de aeronave. El B737 usa capacidad 160 como
              supuesto de escenario, no como configuración confirmada.
            </p>
          </ContextPanel>
          <BreakEvenBars />
        </div>
      </div>

      <div className={styles.dual}>
        <SeatUnitChart
          seats={unitSeats}
          boarded={boardedForMap}
          label={
            aircraft === "Todos"
              ? "Mapa unitario · referencia ERJ-145 (50)"
              : `Mapa unitario · ${aircraft}`
          }
        />
        <DetailTable series={report.series} weekStart={selectedWeek} />
      </div>

      <footer className={styles.footer}>
        <ProvenanceLine
          source={report.meta.fuente}
          datasetVersion={report.meta.version}
          verificationStatus={report.meta.verificationStatus}
          lastValidated={report.lastValidatedLabel}
        />
        <p className={styles.disclaimer}>
          {exportNote} {dict.access.runwayNote}
        </p>
      </footer>
    </main>
  );
}

function DetailTable({
  series,
  weekStart,
}: {
  series: {
    weekStart: string;
    weekLabel: string;
    operator: string;
    aircraftType: string;
    value: number | null;
    status: TrafficLight;
    passengers: number;
    seats: number;
  }[];
  weekStart?: string;
}) {
  const rows = series.filter((s) => !weekStart || s.weekStart === weekStart);

  return (
    <div className={styles.cell}>
      <h3 className={styles.cellTitle}>Detalle de la semana</h3>
      {rows.length === 0 ? (
        <p className={styles.muted} style={{ marginTop: 12 }}>
          Sin datos para el filtro.
        </p>
      ) : (
        <div className={styles.tableWrap} style={{ marginTop: 12, border: "none" }}>
          <table className={styles.table} style={{ minWidth: "20rem" }}>
            <thead>
              <tr>
                <th>Operador</th>
                <th>Aeronave</th>
                <th>Pax</th>
                <th>Sillas</th>
                <th>LF</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`${row.operator}-${row.aircraftType}-${row.weekStart}`}
                >
                  <td>{row.operator}</td>
                  <td className="num">{row.aircraftType}</td>
                  <td className="num">{formatInt(row.passengers)}</td>
                  <td className="num">{formatInt(row.seats)}</td>
                  <td className="num">{formatPct(row.value)}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.disclaimer} style={{ marginTop: 12 }}>
        Exportar · Disponible en SIG completo
      </p>
    </div>
  );
}
