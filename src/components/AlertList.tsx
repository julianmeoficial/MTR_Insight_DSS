import type { AlertEvent } from "@/domain";

const SEVERITY_LABEL: Record<AlertEvent["severity"], string> = {
  red: "Rojo",
  yellow: "Amarillo",
};

type Props = {
  alerts: readonly AlertEvent[];
};

export function AlertList({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <p className="rounded-md border border-zinc-200 bg-white px-4 py-6 text-zinc-600">
        No hay alertas activas en los fixtures de demostración.
      </p>
    );
  }

  return (
    <ul className="space-y-3" aria-label="Alertas activas">
      {alerts.map((alert) => (
        <li
          key={alert.id}
          className="rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                alert.severity === "red"
                  ? "rounded px-2 py-0.5 text-xs font-semibold text-red-900 bg-red-100"
                  : "rounded px-2 py-0.5 text-xs font-semibold text-amber-950 bg-amber-100"
              }
            >
              Severidad: {SEVERITY_LABEL[alert.severity]}
            </span>
            <span className="font-mono text-xs text-zinc-500">{alert.trigger}</span>
            {alert.kpiId ? (
              <span className="text-xs text-zinc-500">{alert.kpiId}</span>
            ) : null}
          </div>
          <p className="mt-2 text-sm font-medium text-zinc-900">{alert.message}</p>
          <dl className="mt-2 grid gap-1 text-xs text-zinc-600 sm:grid-cols-2">
            <div>
              <dt className="inline font-medium text-zinc-800">Entidad: </dt>
              <dd className="inline font-mono">{alert.entity}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-zinc-800">Responsable: </dt>
              <dd className="inline">{alert.owner}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-zinc-800">Periodo: </dt>
              <dd className="inline">
                {alert.period.start} → {alert.period.end}
              </dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  );
}
