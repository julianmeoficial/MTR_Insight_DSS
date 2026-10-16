import Link from "next/link";
import { SCREENS } from "@/lib/screens";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12 sm:px-6">
      <p className="text-sm font-medium tracking-wide text-zinc-500 uppercase">
        Prototipo base · verificación rápida
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-zinc-950">
        MTR Insight
      </h1>
      <p className="text-lg leading-relaxed text-zinc-600">
        SIG académico con apoyo a la decisión para el Aeropuerto Los Garzones
        (MTR). Dominio K1–K5 y motor de alertas listos; pantallas P3–P7 como
        placeholders; centro de alertas con datos locales JSON.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {SCREENS.map((screen) => (
          <li key={screen.href}>
            <Link
              href={screen.href}
              className="block rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm hover:border-zinc-400"
            >
              <span className="font-semibold text-zinc-950">{screen.code}</span>
              <span className="text-zinc-600"> — {screen.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-xs leading-relaxed text-zinc-400">
        No es un producto oficial de Airplan, ni integración operativa en vivo,
        ni un sistema de control de tráfico aéreo.
      </p>
    </main>
  );
}
