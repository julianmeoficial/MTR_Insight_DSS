import { BreakEvenSimulator } from "@/components/dss/BreakEvenSimulator";
import { Projection2045Panel } from "@/components/dss/Projection2045Panel";
import { getScreen } from "@/lib/screens";

export const metadata = {
  title: "P6 · Planeación 2045 (DSS) · MTR Insight",
};

export default function P6Page() {
  const screen = getScreen("P6")!;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
          {screen.code} · Simulador DSS
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
          {screen.title}
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600">{screen.purpose}</p>
        <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          Enfoque: economía del <strong>aeropuerto MTR</strong>, no de
          aerolíneas. Las variantes A350 están disponibles para escenarios de
          expansión; no certifican aptitud de pista.
        </p>
      </header>

      <BreakEvenSimulator />
      <Projection2045Panel />

      <footer className="text-xs leading-relaxed text-zinc-400">
        Las recomendaciones del DSS apoyan el juicio humano; no ejecutan
        decisiones operativas. Datos y costos son supuestos de demostración
        académica.
      </footer>
    </main>
  );
}
