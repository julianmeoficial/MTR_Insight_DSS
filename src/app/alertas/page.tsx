import { AlertList } from "@/components/AlertList";
import { loadActiveDemoAlerts } from "@/data/fixtures/load-demo-alerts";

export const metadata = {
  title: "Centro de alertas · MTR Insight",
};

export default function AlertasPage() {
  const alerts = loadActiveDemoAlerts();

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
          Centro de alertas
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          Alertas activas
        </h1>
        <p className="text-zinc-600">
          Evaluadas por el motor de dominio a partir de fixtures locales en{" "}
          <code className="font-mono text-sm text-zinc-800">
            data/fixtures/demo/
          </code>
          . Severidad anunciada con etiqueta, no solo con color.
        </p>
        <p className="text-sm text-zinc-500" aria-live="polite">
          {alerts.length} alerta{alerts.length === 1 ? "" : "s"} activa
          {alerts.length === 1 ? "" : "s"}
        </p>
      </header>
      <AlertList alerts={alerts} />
    </main>
  );
}
