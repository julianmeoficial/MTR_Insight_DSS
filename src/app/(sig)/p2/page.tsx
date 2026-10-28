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
import { OpsScopeSwitch } from "@/components/filters/OpsScopeSwitch";
import { KpiHero } from "@/components/kpi/KpiHero";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ScreenLoading } from "@/components/ui/ScreenLoading";
import { ProvenanceLine } from "@/components/ui/ProvenanceLine";
import { ContextPanel } from "@/components/ui/ContextPanel";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatPct, formatInt } from "@/lib/format";
import { getDictionary } from "@/i18n/dictionaries";
import { parseOpsScope } from "@/domain";
import {
  canExport,
  resolveOperatorFilter,
  visibleOperators,
} from "@/domain/access";
import { getAircraft } from "@/config/aircraft";
import type { TrafficLight } from "@/domain/types";
import { cn } from "@/lib/cn";
import styles from "@/components/screens/screen.module.css";
import views from "@/components/screens/views.module.css";

export const metadata = {
  title: "Rutas y ocupación · MTR Insight",
};

type Props = {
  searchParams: Promise<{
    semana?: string;
    operador?: string;
    aeronave?: string;
    op?: string;
    ruta?: string;
  }>;
};

/** Demo session is request data, so this screen does not prerender. */
export const instant = false;

export default function P2Page({ searchParams }: Props) {
  const dict = getDictionary("es");
  return (
    <Suspense fallback={<ScreenLoading label={dict.states.loading} />}>
      <P2Content searchParams={searchParams} />
    </Suspense>
  );
}

async function P2Content({ searchParams }: Props) {
  const dict = getDictionary("es");
  const t = dict.screens.p2;
  const params = await searchParams;
  const opsScope = parseOpsScope(params.op);
  const role = await readDemoRole();
  const operator = role
    ? resolveOperatorFilter(role, params.operador, opsScope)
    : (params.operador ?? "Todos");
  const scopeOperators =
    opsScope === "nacional"
      ? ["Avianca", "Satena", "LATAM", "JetSMART", "Clic"]
      : ["Satena", "Copa"];
  const operators = role
    ? visibleOperators(role, opsScope)
    : ["Todos", ...scopeOperators];
  const exportNote =
    role && canExport(role)
      ? dict.access.exportFullSig
      : dict.access.exportDenied;
  const aircraft = params.aeronave ?? "Todos";
  const route = params.ruta ?? "Todas";
  const report = buildDashboardReport({
    weekStart: params.semana,
    operator,
    aircraftType: aircraft,
    route,
    opsScope,
  });

  const selectedWeek =
    params.semana && report.weeks.some((w) => w.weekStart === params.semana)
      ? params.semana
      : report.weeks[report.weeks.length - 1]?.weekStart;

  const hero = getFilteredK1Hero({
    operator,
    aircraftType: aircraft,
    weekStart: selectedWeek,
    route,
    opsScope,
  });
  const vsBe = hero.value === null ? null : hero.value - 0.7;

  const unitSeats =
    aircraft === "Todos"
      ? 50
      : (() => {
          try {
            return getAircraft(
              aircraft as Parameters<typeof getAircraft>[0],
            ).seats;
          } catch {
            return 50;
          }
        })();
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

  const routeOptions = report.scopeRoutes.map((r) => ({
    id: r.id,
    label: `${r.id} · ${r.city}`,
  }));

  return (
    <main className={styles.main}>
      <div className={styles.pad}>
        <ScreenHeader
          eyebrow={`${dict.nav.views} · P2`}
          title={dict.screens.p2.title}
          question={dict.screens.p2.question}
        >
          <OpsScopeSwitch
            value={opsScope}
            nacionalLabel={dict.screens.p1.opsNacional}
            internacionalLabel={dict.screens.p1.opsInternacional}
            ariaLabel={dict.screens.p1.opsScopeAria}
          />
        </ScreenHeader>
      </div>

      <RouteFilterBar
        weeks={report.weeks}
        selectedWeek={selectedWeek}
        selectedOperator={operator}
        selectedAircraft={aircraft}
        selectedRoute={route}
        operators={operators}
        routes={routeOptions}
        operatorLocked={operators.length === 1}
        allRoutesLabel={t.allRoutes}
        allAircraftLabel={t.allAircraft}
      />

      <KpiHero
        value={hero.value}
        status={hero.status}
        label={`K1 · ${dict.kpi.k1} · ${route === "Todas" ? opsScope : route} · ${operator} · ${aircraft === "Todos" ? t.allAircraft : aircraft}`}
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
    <div className={views.section}>
      <h3 className={views.sectionTitle}>Detalle de la semana</h3>
      {rows.length === 0 ? (
        <p className={views.hint}>Sin datos para el filtro.</p>
      ) : (
        <div className={views.tableWrap}>
          <table className={views.table}>
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
                  <td className={views.cellNum}>{formatInt(row.passengers)}</td>
                  <td className={views.cellNum}>{formatInt(row.seats)}</td>
                  <td className={views.cellNum}>{formatPct(row.value)}</td>
                  <td>
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className={views.disclaimer}>Exportar · Disponible en SIG completo</p>
    </div>
  );
}
