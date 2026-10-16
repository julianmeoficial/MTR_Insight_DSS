import type { ScreenDef } from "@/lib/screens";

type Props = {
  screen: ScreenDef;
  badge?: string;
};

export function ScreenPlaceholder({ screen, badge = "Placeholder" }: Props) {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10 sm:px-6">
      <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
        {screen.code} · {badge}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">
        {screen.title}
      </h1>
      <p className="text-lg leading-relaxed text-zinc-600">{screen.purpose}</p>
      <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
        Pantalla aún no implementada. El dominio de KPIs/alertas ya existe; esta
        vista solo fija el mapa de navegación del Paso 8.
      </p>
    </article>
  );
}
